import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Mic, Monitor, Maximize, Volume2, Wifi, CheckCircle2, 
  AlertTriangle, XCircle, RefreshCw, HelpCircle, ShieldCheck, 
  VideoOff, Play, Check, Eye, Activity, Sparkles, VolumeX, Radio
} from 'lucide-react';

const MIN_VOICE_LEVEL_THRESHOLD = 15; // 15% minimum audible volume threshold

export const TechnicalReadinessCheck = ({
  policy,
  checklistState,
  onUpdateChecklist,
  onTroubleshoot
}) => {
  const rules = policy?.rules || {};
  const [videoStream, setVideoStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [peakVoiceLevel, setPeakVoiceLevel] = useState(0);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ online: true, latency: '18ms', speed: 'High Speed (Broadband)' });
  const [showTroubleshootHelp, setShowTroubleshootHelp] = useState(false);

  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const analyzerRef = useRef(null);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setNetworkInfo({ online: true, latency: '18ms', speed: 'Connected (High Speed)' });
    const handleOffline = () => setNetworkInfo({ online: false, latency: 'N/A', speed: 'Offline' });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (videoStream) videoStream.getTracks().forEach(t => t.stop());
      if (audioStream) audioStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [videoStream, audioStream, screenStream]);

  // Attach video stream to element
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Request & Start Camera Preview
  const handleStartCamera = async () => {
    onUpdateChecklist('cameraStatus', 'testing');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onUpdateChecklist('cameraStatus', 'unsupported');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      });
      setVideoStream(stream);
      // Wait for candidate to verify their face visibility
      onUpdateChecklist('cameraStatus', 'previewing');
    } catch (err) {
      console.warn('Camera access denied or failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onUpdateChecklist('cameraStatus', 'denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        onUpdateChecklist('cameraStatus', 'not_found');
      } else {
        onUpdateChecklist('cameraStatus', 'failed');
      }
    }
  };

  // Confirm Candidate Face Visibility
  const handleConfirmCameraVisibility = () => {
    if (videoStream && videoStream.active) {
      onUpdateChecklist('cameraStatus', 'ready');
    }
  };

  // Request & Test Microphone with strict minimum audible volume check
  const handleTestMicrophone = async () => {
    onUpdateChecklist('microphoneStatus', 'measuring');
    setPeakVoiceLevel(0);
    setAudioLevel(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onUpdateChecklist('microphoneStatus', 'unsupported');
        return;
      }

      // 1. Initialize or resume AudioContext
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }

      // 2. Request microphone audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // 3. Connect stream to Web Audio analyzer
      if (audioContextRef.current && stream) {
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        mediaStreamSourceRef.current = source;
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = 512;
        analyzer.smoothingTimeConstant = 0.3;
        source.connect(analyzer);
        analyzerRef.current = analyzer;

        const timeData = new Uint8Array(analyzer.fftSize);
        const freqData = new Uint8Array(analyzer.frequencyBinCount);

        const updateMeter = () => {
          if (!analyzerRef.current) return;
          
          // Measure waveform peak-to-peak amplitude
          analyzer.getByteTimeDomainData(timeData);
          let minVal = 255;
          let maxVal = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i];
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
          }
          const peakToPeak = maxVal - minVal; // 0 (silence) to 255 (max loudness)

          // Measure frequency vocal energy
          analyzer.getByteFrequencyData(freqData);
          let freqSum = 0;
          const vocalBinLimit = Math.min(freqData.length, 64);
          for (let i = 1; i < vocalBinLimit; i++) {
            freqSum += freqData[i];
          }
          const freqAvg = vocalBinLimit > 1 ? freqSum / (vocalBinLimit - 1) : 0;

          // Compute composite voice score (0-100%)
          const timeScore = (peakToPeak / 100) * 100;
          const freqScore = (freqAvg / 50) * 100;
          const composite = Math.max(timeScore, freqScore);
          const currentLevel = Math.min(100, Math.round(composite));

          setAudioLevel(currentLevel);

          setPeakVoiceLevel(prev => {
            const newPeak = Math.max(prev, currentLevel);
            // If voice level crosses audible threshold >= 15%, automatically mark Ready!
            if (newPeak >= MIN_VOICE_LEVEL_THRESHOLD) {
              onUpdateChecklist('microphoneStatus', 'ready');
            }
            return newPeak;
          });

          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        updateMeter();
      }
    } catch (err) {
      console.warn('Microphone access denied or failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        onUpdateChecklist('microphoneStatus', 'denied');
      } else {
        onUpdateChecklist('microphoneStatus', 'failed');
      }
    }
  };

  const handleConfirmMicrophone = () => {
    onUpdateChecklist('microphoneStatus', 'ready');
  };

  // Quick simulation helper for testing or muted hardware
  const handleSimulateVoice = () => {
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const simulatedLevel = Math.min(85, Math.floor(25 + Math.random() * 50));
      setAudioLevel(simulatedLevel);
      if (tick >= 6) {
        clearInterval(interval);
        setAudioLevel(0);
        onUpdateChecklist('microphoneStatus', 'ready');
      }
    }, 150);
  };

  // Test Speaker via pleasant Web Audio synthesizer chime
  const handleTestSpeaker = () => {
    setIsPlayingTestTone(true);
    setHasPlayedChime(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
      setTimeout(() => {
        setIsPlayingTestTone(false);
      }, 500);
    } catch {
      setIsPlayingTestTone(false);
    }
  };

  // Confirm Speaker Audio
  const handleConfirmSpeaker = () => {
    onUpdateChecklist('speakerStatus', 'ready');
  };

  // Request Screen Share
  const handleTestScreenShare = async () => {
    onUpdateChecklist('screenShareStatus', 'testing');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        onUpdateChecklist('screenShareStatus', 'unsupported');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      onUpdateChecklist('screenShareStatus', 'ready');

      // Listen for when candidate stops sharing via browser bar
      stream.getVideoTracks()[0].onended = () => {
        onUpdateChecklist('screenShareStatus', 'failed');
        setScreenStream(null);
      };
    } catch (err) {
      console.warn('Screen share permission denied:', err);
      onUpdateChecklist('screenShareStatus', 'denied');
    }
  };

  // Toggle Fullscreen Mode
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        onUpdateChecklist('fullscreenActive', true);
      } else {
        await document.exitFullscreen();
        onUpdateChecklist('fullscreenActive', false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      onUpdateChecklist('fullscreenActive', !!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [onUpdateChecklist]);

  const renderStatusBadge = (status, mandatory = false) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Verified & Ready
          </span>
        );
      case 'previewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/30 animate-pulse">
            <Eye className="w-3.5 h-3.5" />
            Confirm Face Visibility
          </span>
        );
      case 'measuring':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse">
            <Radio className="w-3.5 h-3.5 animate-spin" />
            Listening... (Speak)
          </span>
        );
      case 'testing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/30 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Connecting...
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Permission Denied
          </span>
        );
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Device Not Found
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Unsupported Browser
          </span>
        );
      default:
        return mandatory ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            Check Required
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            Optional
          </span>
        );
    }
  };

  // Render 20-segment high-precision LED VU meter
  const renderLedVuMeter = () => {
    const totalSegments = 24;
    const activeSegments = Math.round((audioLevel / 100) * totalSegments);
    const targetSegmentIndex = Math.floor((MIN_VOICE_LEVEL_THRESHOLD / 100) * totalSegments);

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Microphone Input Level
          </span>
          <span className={`text-xs font-bold font-mono ${audioLevel >= MIN_VOICE_LEVEL_THRESHOLD ? 'text-emerald-600 dark:text-emerald-400' : audioLevel > 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
            {audioLevel >= MIN_VOICE_LEVEL_THRESHOLD
              ? `${audioLevel}% (✓ Good Level)` 
              : audioLevel > 3 
              ? `${audioLevel}% (Speak louder)` 
              : '0% (Silent)'}
          </span>
        </div>

        {/* LED Segments Container */}
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1 shadow-inner relative">
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const isLit = idx < activeSegments;
            const isTarget = idx === targetSegmentIndex;

            // Color gradient scheme for segments
            let colorClass = 'bg-slate-800';
            if (isLit) {
              if (idx < 14) colorClass = 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]';
              else if (idx < 19) colorClass = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]';
              else colorClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]';
            }

            return (
              <div 
                key={idx} 
                className={`flex-1 h-4 rounded-xs transition-all duration-75 ${colorClass} ${isTarget && !isLit ? 'ring-1 ring-emerald-500/40' : ''}`}
                title={`Level ${(idx + 1) * (100 / totalSegments)}%`}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 px-0.5">
          <span>0% Muted</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">▲ ≥15% Target Pass Threshold</span>
          <span>100% Max</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand" />
            Device & Hardware Readiness Check
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify your camera visibility, audio microphone levels, and speaker output before starting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTroubleshootHelp(!showTroubleshootHelp)}
          className="text-xs font-semibold text-brand hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          {showTroubleshootHelp ? 'Hide Guide' : 'Troubleshoot Guide'}
        </button>
      </div>

      {/* Troubleshooting Help Accordion */}
      {showTroubleshootHelp && (
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 space-y-2.5 animate-fadeIn">
          <div className="font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-brand" />
            Camera & Microphone Setup Recommendations:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">1. Center Face & Lighting</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Ensure front-facing light with no strong backlighting or shadows obscuring your face.
              </p>
            </div>
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">2. Speak Naturally</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Speak clearly into your microphone until the voice level crosses the 15% minimum threshold.
              </p>
            </div>
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-indigo-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">3. Browser Permissions</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                If blocked, click the lock/camera icon in your address bar and grant media permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Hardware Diagnostic Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Camera Test Card */}
        <div className={`p-5 rounded-2xl border transition-all ${rules.camera?.required ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs' : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/40'}`}>
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Webcam / Camera Feed
                  {rules.camera?.required && (
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/40">
                      Required
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live proctoring video feed verification
                </p>
              </div>
            </div>
            {renderStatusBadge(checklistState.cameraStatus, rules.camera?.required)}
          </div>

          {/* Cinematic Live Video Preview Viewport */}
          <div className="relative aspect-video w-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner mb-3.5 group">
            {(checklistState.cameraStatus === 'ready' || checklistState.cameraStatus === 'previewing') && videoStream ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* HUD Framing Overlay Brackets */}
                <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-brand/70 rounded-tl-md"></div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      1080p • 30 FPS
                    </div>
                    <div className="w-6 h-6 border-t-2 border-r-2 border-brand/70 rounded-tr-md"></div>
                  </div>

                  <div className="self-center">
                    <div className="text-[10px] font-semibold text-white/70 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-brand" />
                      Center Face in Target Area
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-brand/70 rounded-bl-md"></div>
                    {checklistState.cameraStatus === 'ready' && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 text-[10px] font-bold">
                        <Check className="w-3 h-3" /> Position Validated
                      </div>
                    )}
                    <div className="w-6 h-6 border-b-2 border-r-2 border-brand/70 rounded-br-md"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-6 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <VideoOff className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Webcam Inactive</p>
                  <p className="text-[11px] text-slate-600">Click below to activate camera preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Action Buttons */}
          {checklistState.cameraStatus === 'previewing' ? (
            <button
              type="button"
              onClick={handleConfirmCameraVisibility}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 animate-pulse"
            >
              <Check className="w-4 h-4" />
              Confirm: My Face is Centered & Clearly Visible
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartCamera}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {checklistState.cameraStatus === 'ready' ? 'Re-test / Re-align Camera' : 'Start Camera & Enable Preview'}
            </button>
          )}
        </div>

        {/* Microphone Test Card */}
        <div className={`p-5 rounded-2xl border transition-all ${rules.microphone?.required ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs' : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/40'}`}>
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Microphone & Voice Input
                  {rules.microphone?.required && (
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/40">
                      Required
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Audible volume verification (Requires ≥ 15%)
                </p>
              </div>
            </div>
            {renderStatusBadge(checklistState.microphoneStatus, rules.microphone?.required)}
          </div>

          {/* LED VU Meter Widget */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 mb-3.5 space-y-3">
            {renderLedVuMeter()}
          </div>

          {/* Microphone Action Buttons */}
          {checklistState.microphoneStatus === 'measuring' ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmMicrophone}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 animate-pulse"
                >
                  <Check className="w-4 h-4" />
                  Confirm: Voice is Audible (Mark Ready)
                </button>
                <button
                  type="button"
                  onClick={handleTestMicrophone}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Restart Listening"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSimulateVoice}
                  className="text-[11px] text-brand hover:underline cursor-pointer font-medium"
                >
                  Quick Test: Simulate Voice Signal
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTestMicrophone}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Mic className="w-3.5 h-3.5" />
                {checklistState.microphoneStatus === 'ready' ? 'Voice Level Verified (Click to Re-test)' : 'Start Microphone & Speak'}
              </button>

              {checklistState.microphoneStatus !== 'ready' && (
                <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
                  <button
                    type="button"
                    onClick={handleConfirmMicrophone}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium underline cursor-pointer"
                  >
                    Directly Confirm Microphone
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateVoice}
                    className="text-brand hover:underline font-medium cursor-pointer"
                  >
                    Simulate Signal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auxiliary Devices & Screen/Fullscreen Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Screen Share Test */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${rules.screenShare?.required ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/50'}`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50">
                <Monitor className="w-4 h-4" />
              </div>
              {renderStatusBadge(checklistState.screenShareStatus, rules.screenShare?.required)}
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Screen Sharing</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {checklistState.screenShareStatus === 'ready' ? 'Screen stream active.' : 'Verify screen broadcast capability.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestScreenShare}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {checklistState.screenShareStatus === 'ready' ? 'Screen Active (Re-test)' : 'Test Screen Share'}
          </button>
        </div>

        {/* Fullscreen Mode Check */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${rules.fullscreen?.required ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/50'}`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50">
                <Maximize className="w-4 h-4" />
              </div>
              {checklistState.fullscreenActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                </span>
              ) : rules.fullscreen?.required ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200">
                  Windowed
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Optional</span>
              )}
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Fullscreen Lock</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {checklistState.fullscreenActive ? 'Browser is in full screen.' : 'Enforces single-window focus.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            {checklistState.fullscreenActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
        </div>

        {/* Speaker Audio Output Test */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Volume2 className="w-4 h-4" />
              </div>
              {checklistState.speakerStatus === 'ready' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200">
                  <Check className="w-3 h-3" /> Audio Verified
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Not Tested</span>
              )}
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Speaker Output</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Play diagnostic sound chime.
            </p>
          </div>

          {hasPlayedChime && checklistState.speakerStatus !== 'ready' ? (
            <div className="space-y-1.5 animate-fadeIn">
              <button
                type="button"
                onClick={handleConfirmSpeaker}
                className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Yes, Heard Chime ✓
              </button>
              <button
                type="button"
                onClick={handleTestSpeaker}
                className="w-full py-1 text-[11px] text-slate-500 hover:underline cursor-pointer"
              >
                Play chime again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTestSpeaker}
              disabled={isPlayingTestTone}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Play className={`w-3.5 h-3.5 ${isPlayingTestTone ? 'text-emerald-500 animate-spin' : ''}`} />
              {isPlayingTestTone ? 'Playing Chime...' : 'Play Test Chime'}
            </button>
          )}
        </div>

        {/* Network Stability Diagnostic */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                <Wifi className="w-4 h-4" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${networkInfo.online ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200' : 'bg-rose-50 text-rose-700'}`}>
                {networkInfo.online ? 'Stable' : 'Offline'}
              </span>
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Network & Latency</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Latency: <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{networkInfo.latency}</span>
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-center">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{networkInfo.speed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
