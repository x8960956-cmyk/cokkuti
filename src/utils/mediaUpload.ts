export interface UploadedMediaResult {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export function uploadMediaFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedMediaResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/raw', true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name || 'upload'));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300 && parsed.success && parsed.url) {
          if (onProgress) onProgress(100);
          resolve(parsed);
        } else {
          reject(new Error(parsed.error || `Upload failed (HTTP ${xhr.status})`));
        }
      } catch {
        reject(new Error('Invalid server response during upload'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading media file'));
    };

    xhr.send(file);
  });
}

export function extractVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
        URL.revokeObjectURL(objectUrl);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
      video.src = objectUrl;
    } catch {
      resolve(0);
    }
  });
}

export function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
