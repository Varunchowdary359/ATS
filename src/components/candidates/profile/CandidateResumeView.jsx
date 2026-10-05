import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Award, Globe, Sparkles, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Configure pdfjs worker
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  } catch {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
    } catch (_) {}
  }
}

// ─── PDF Canvas Viewer ───────────────────────────────────────────────────────
const PdfCanvasViewer = ({ objectUrl }) => {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!objectUrl) return;
    setLoading(true);
    setError(null);
    const loadingTask = pdfjsLib.getDocument({ url: objectUrl, isEvalSupported: false });
    loadingTask.promise
      .then(doc => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPageNum(1);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load PDF: ' + (err?.message || 'Unknown error'));
        setLoading(false);
      });
    return () => loadingTask.destroy?.();
  }, [objectUrl]);

  const renderPage = useCallback(async (doc, num, sc) => {
    if (!doc || !canvasRef.current) return;
    // Cancel any in-flight render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (_) {}
      renderTaskRef.current = null;
    }
    try {
      const page = await doc.getPage(num);
      const viewport = page.getViewport({ scale: sc });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') {
        setError('Page render failed: ' + (e?.message || ''));
      }
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, pageNum, scale);
  }, [pdfDoc, pageNum, scale, renderPage]);

  const goToPrev = () => setPageNum(p => Math.max(1, p - 1));
  const goToNext = () => setPageNum(p => Math.min(totalPages, p + 1));
  const zoomIn = () => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)));
  const resetZoom = () => setScale(1.4);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center p-8">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-500">Loading PDF…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button onClick={goToPrev} disabled={pageNum <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 px-2">
            Page {pageNum} of {totalPages}
          </span>
          <button onClick={goToNext} disabled={pageNum >= totalPages}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <ZoomOut className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={resetZoom} title="Reset Zoom"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="overflow-auto rounded-xl bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 max-h-[680px]">
        <div className="flex justify-center p-4">
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-sm"
            style={{ display: 'block', maxWidth: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Main CandidateResumeView ────────────────────────────────────────────────
const CandidateResumeView = ({ candidate }) => {
  if (!candidate) return null;

  const objectUrl = candidate.resumeObjectUrl || null;
  const mimeType = candidate.resumeMimeType || '';
  const fileName = candidate.fileName || 'Candidate_Resume.pdf';
  const isPdf = mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    if (objectUrl) {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      a.click();
    } else {
      alert(`Resume file (${fileName}) is not available for download in this session.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Resume File Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {fileName}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Size: {candidate.fileSize || '—'} • Source: {candidate.source || 'Upload'} • Uploaded: {candidate.uploadedDate || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download File
          </button>
        </div>
      </div>

      {/* Parsed Summary Section */}
      {candidate.parsedSummary && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Parsed Resume Summary</h3>
          </div>

          {candidate.parsedSummary.professionalSummary && candidate.parsedSummary.professionalSummary !== 'N/A' && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Professional Summary</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                {candidate.parsedSummary.professionalSummary}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {candidate.parsedSummary.certifications?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Certifications &amp; Licenses
                </h4>
                <ul className="space-y-1">
                  {candidate.parsedSummary.certifications.map((c, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {candidate.parsedSummary.languages?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Languages
                </h4>
                <ul className="space-y-1">
                  {candidate.parsedSummary.languages.map((l, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Live Resume Viewer ─── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Resume Viewer</h3>
          <span className="text-xs text-slate-400 font-mono">{fileName}</span>
        </div>

        {objectUrl && isPdf ? (
          <PdfCanvasViewer objectUrl={objectUrl} />
        ) : objectUrl ? (
          // Non-PDF browser-renderable (e.g. TXT shown in iframe)
          <iframe
            src={objectUrl}
            title="Resume Preview"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
            style={{ minHeight: 600 }}
          />
        ) : (
          // No objectUrl — file not available in this session
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{fileName}</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                The resume file is not available in the current browser session.
                Re-upload the resume or use the Download button if the file was previously saved.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CandidateResumeView;
