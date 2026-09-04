/**
 * Grabs a still frame from a video the admin just picked, so a course without
 * its own cover still gets a real picture instead of an empty box. Runs
 * entirely in the browser, which also means it works with local storage where
 * the server cannot render a frame itself.
 */
const CAPTURE_AT_SECONDS = 2;
const MAX_WIDTH = 1280;

export interface VideoStill {
  file: File;
  previewUrl: string;
  durationSeconds: number;
}

export function captureVideoStill(videoFile: File): Promise<VideoStill | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(videoFile);
    const video = document.createElement("video");
    let settled = false;

    const finish = (result: VideoStill | null) => {
      if (settled) return;
      settled = true;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    // A codec the browser cannot decode, or a video that never seeks, must not
    // hang the upload flow.
    const timeout = setTimeout(() => finish(null), 8000);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    video.onloadeddata = () => {
      const target = Math.min(CAPTURE_AT_SECONDS, Math.max(video.duration / 2, 0.1));
      video.currentTime = Number.isFinite(target) ? target : 0.1;
    };

    video.onseeked = () => {
      try {
        const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round((video.videoWidth || MAX_WIDTH) * scale);
        canvas.height = Math.round((video.videoHeight || 720) * scale);

        const context = canvas.getContext("2d");
        if (!context || !canvas.width || !canvas.height) return finish(null);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            if (!blob) return finish(null);
            const file = new File([blob], `${videoFile.name.replace(/\.[^.]+$/, "")}-cover.jpg`, {
              type: "image/jpeg",
            });
            finish({
              file,
              previewUrl: URL.createObjectURL(blob),
              durationSeconds: Math.round(video.duration) || 0,
            });
          },
          "image/jpeg",
          0.82
        );
      } catch {
        finish(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      finish(null);
    };
  });
}

/** Reads a video's duration without decoding a frame. */
export function readVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(videoFile);
    const video = document.createElement("video");
    const done = (seconds: number) => {
      URL.revokeObjectURL(objectUrl);
      resolve(seconds);
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => done(Math.round(video.duration) || 0);
    video.onerror = () => done(0);
    video.src = objectUrl;
  });
}

/**
 * Last resort when no frame can be captured: a branded cover drawn from the
 * course title, so listings never fall back to a blank rectangle.
 */
export function generateCoverDataUrl(title: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext("2d");
  if (!context) return "";

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0F4C45");
  gradient.addColorStop(1, "#072F2B");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(198,161,91,.45)";
  context.lineWidth = 3;
  context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  context.fillStyle = "#EADFC4";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 44px Almarai, system-ui, sans-serif";

  const words = title.trim().split(/\s+/).slice(0, 6);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > canvas.width - 120 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const startY = canvas.height / 2 - ((lines.length - 1) * 56) / 2;
  lines.slice(0, 3).forEach((text, index) => {
    context.fillText(text, canvas.width / 2, startY + index * 56);
  });

  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Turns a generated data URL back into a file the upload endpoint accepts. */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
