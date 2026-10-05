/**
 * Enterprise Document & Resume Security Gateway
 * Enforces magic bytes verification, path traversal prevention, file size limits,
 * extension allowlists, and authorized access control.
 */

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.rtf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const BLOCKED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.vbs', '.js', '.jsx', '.ts', '.tsx',
  '.html', '.htm', '.svg', '.php', '.phtml', '.py', '.rb', '.jar', '.dll', '.so'
];

class DocumentSecurityServiceImpl {
  /**
   * Sanitizes a filename to prevent path traversal (../, ..\) and unsafe control characters
   */
  sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return `document_${Date.now()}`;
    // Remove any path indicators
    let safeName = filename.replace(/^.*[\\\/]/, '');
    // Remove null bytes and control chars
    safeName = safeName.replace(/[\0\x00-\x1F\x7F]/g, '');
    // Remove dangerous symbols
    safeName = safeName.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Ensure it's not starting with a dot or double extension trick
    if (safeName.startsWith('.')) safeName = `file${safeName}`;
    return safeName.substring(0, 100);
  }

  /**
   * Verifies file signature / magic bytes from ArrayBuffer or DataURL
   */
  async verifyMagicBytes(fileOrBuffer) {
    let buffer = null;

    if (fileOrBuffer instanceof ArrayBuffer) {
      buffer = fileOrBuffer;
    } else if (fileOrBuffer instanceof Uint8Array) {
      buffer = fileOrBuffer.buffer;
    } else if (typeof fileOrBuffer === 'string' && fileOrBuffer.startsWith('data:')) {
      // Decode DataURL base64 header
      const base64Index = fileOrBuffer.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64Data = fileOrBuffer.substring(base64Index + 8, base64Index + 64);
        if (typeof atob !== 'undefined') {
          const binary = atob(base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          buffer = bytes.buffer;
        }
      }
    } else if (typeof File !== 'undefined' && fileOrBuffer instanceof File) {
      // Read first 32 bytes of the File
      const slice = fileOrBuffer.slice(0, 32);
      buffer = await slice.arrayBuffer();
    }

    if (!buffer) return { isValid: true, detectedType: 'unknown' };

    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return { isValid: true, detectedType: 'text' };

    // 1. PDF signature: %PDF- (0x25, 0x50, 0x44, 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { isValid: true, detectedType: 'application/pdf' };
    }

    // 2. DOCX / ZIP signature: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return { isValid: true, detectedType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    }

    // 3. Old DOC signature: \xD0\xCF\x11\xE0 (Compound File Binary)
    if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
      return { isValid: true, detectedType: 'application/msword' };
    }

    // 4. Executable / ELF / PE signatures (BLOCK)
    if ((bytes[0] === 0x4D && bytes[1] === 0x5A) || // MZ (Windows PE/EXE)
        (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46)) { // ELF (Linux binary)
      return { isValid: false, error: 'Executable binary file upload blocked for security reasons.' };
    }

    return { isValid: true, detectedType: 'text/plain' };
  }

  /**
   * Complete validation pipeline for uploaded resume/document
   */
  async validateDocumentUpload({ file, name, size }) {
    const rawName = name || file?.name || 'document';
    const fileSize = size !== undefined ? size : file?.size || 0;

    // 1. Size bounds check
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File size exceeds the 10 MB maximum limit (received ${(fileSize / (1024 * 1024)).toFixed(2)} MB).`
      };
    }

    // 2. Extension validation & Double Extension Protection
    const lowerName = rawName.toLowerCase();

    // Check for null bytes in filename
    if (rawName.includes('\0') || rawName.includes('%00')) {
      return {
        isValid: false,
        error: 'Filename contains illegal null byte characters.'
      };
    }

    // Check for double extension patterns (e.g., file.pdf.exe or file.docx.bat)
    const nameParts = lowerName.split('.');
    if (nameParts.length > 2) {
      const intermediateExts = nameParts.slice(1, -1);
      const hasSuspiciousExt = intermediateExts.some(ext => 
        ALLOWED_EXTENSIONS.includes(`.${ext}`) || BLOCKED_EXTENSIONS.includes(`.${ext}`)
      );
      if (hasSuspiciousExt) {
        return {
          isValid: false,
          error: 'Double file extensions are prohibited for security reasons.'
        };
      }
    }

    const hasBlockedExt = BLOCKED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    if (hasBlockedExt) {
      return {
        isValid: false,
        error: 'Dangerous or executable file extensions are strictly prohibited.'
      };
    }

    const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    if (!hasAllowedExt) {
      return {
        isValid: false,
        error: `Unsupported file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}.`
      };
    }

    // 3. Magic bytes / Content Signature check
    if (file) {
      const magicCheck = await this.verifyMagicBytes(file);
      if (!magicCheck.isValid) {
        return {
          isValid: false,
          error: magicCheck.error || 'File content does not match its declared format.'
        };
      }
    }

    const safeFilename = this.sanitizeFilename(rawName);

    return {
      isValid: true,
      sanitizedName: safeFilename,
      safeId: `DOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    };
  }

  /**
   * Authorization gate for viewing / downloading candidate documents
   */
  authorizeDocumentAccess(document, userContext) {
    if (!document) return { authorized: false, reason: 'Document not found' };
    
    // ATS Admin, HR Admin, and Recruiter have full document access
    const role = userContext?.role || 'employee';
    if (role === 'ats_admin' || role === 'hr_admin' || role === 'recruiter' || role === 'super_admin') {
      return { authorized: true };
    }

    // Hiring manager can view resume and work samples
    if (role === 'hiring_manager') {
      if (document.type === 'resume' || document.type === 'portfolio' || document.type === 'certificate') {
        return { authorized: true };
      }
      return { authorized: false, reason: 'Access restricted to standard application materials.' };
    }

    // Other roles: restricted
    return { authorized: false, reason: 'Unauthorized to download or view candidate documents.' };
  }
}

export const DocumentSecurityService = new DocumentSecurityServiceImpl();
