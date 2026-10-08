"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (err: string) => void;
  onScanEnd?: () => void;
  className?: string;
  constraints?: { facingMode?: string; video?: boolean; audio?: boolean };
}

export function QRScanner({
  onScan,
  onError,
  onScanEnd,
  className,
  constraints = { facingMode: "environment" },
}: QRScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const scanningRef = React.useRef(false);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [state, setState] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const scanCountRef = React.useRef(0);

  const start = React.useCallback(async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanningRef.current = true;
      scanCountRef.current = 0;
      setState("ready");
      scanLoop();
    } catch (err: any) {
      let msg = "Camera access denied";
      if (err.name === "NotAllowedError") msg = "Camera permission denied. Please allow camera access.";
      else if (err.name === "NotFoundError") msg = "No camera found on this device.";
      else msg = err.message || "Camera error";
      setErrorMsg(msg);
      setState("error");
      onError?.(msg);
    }
  }, [constraints, onError]);

  const stop = React.useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setState("idle");
    onScanEnd?.();
  }, [onScanEnd]);

  const scanLoop = React.useCallback(() => {
    if (!scanningRef.current || state !== "ready") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      requestAnimationFrame(scanLoop);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) { requestAnimationFrame(scanLoop); return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = decodeQRFromImage(imageData);
    if (code) {
      scanCountRef.current++;
      if (scanCountRef.current >= 2) {
        onScan(code);
        stop();
        return;
      }
    } else {
      scanCountRef.current = 0;
    }
    requestAnimationFrame(scanLoop);
  }, [onScan, stop, state]);

  React.useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  if (state === "error") {
    return (
      <Card className={cn("border-dashed border-2 border-border", className)}>
        <CardContent className="p-5">
          <div className="text-center">
            <CameraOffIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">Camera Unavailable</h3>
            <p className="text-xs text-muted-foreground mb-4">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={start}>Try Again</Button>
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => {
              const input = prompt("Enter QR code content:");
              if (input) onScan(input);
            }}>
              Enter Manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-black/80", className)}>
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover"
        playsInline
        muted
        style={{ visibility: state === "ready" ? "visible" : "hidden" }}
      />
      {state === "ready" && (
        <div className="absolute inset-0 pointer-events-none">
          <ScanLineAnimation />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-primary/60 rounded-full shadow-lg shadow-primary/30 animate-pulse" />
          </div>
          <CornerBrackets />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
        {state === "loading" && (
          <>
            <div className="flex items-center gap-2 text-white text-xs">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Accessing camera...
            </div>
            <Button variant="ghost" size="sm" className="text-white" onClick={stop}>Cancel</Button>
          </>
        )}
        {state === "ready" && (
          <>
            <span className="text-white text-xs">Point camera at a QR code</span>
            <Button variant="ghost" size="sm" className="text-white" onClick={stop}>Stop</Button>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {state === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <Button size="lg" onClick={start} className="gap-2">
            <CameraIcon className="h-4 w-4" />
            Start Scanning
          </Button>
        </div>
      )}
    </div>
  );
}

function decodeQRFromImage(imageData: ImageData): string | null {
  const { data, width, height } = imageData;
  const luminance = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    luminance[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) | 0;
  }
  try {
    return findAndDecodeQR(luminance, width, height);
  } catch {
    return null;
  }
}

function findAndDecodeQR(lum: Uint8Array, w: number, h: number): string | null {
  const finderSize = 7;
  for (let y = 0; y < h - finderSize * 3; y++) {
    for (let x = 0; x < w - finderSize * 3; x++) {
      if (isFinderPattern(x, y, lum, w, h, finderSize)) {
        const moduleSize = estimateModuleSize(x, y, lum, w, h);
        if (moduleSize < 2 || moduleSize > 20) continue;
        const ps = Math.round(moduleSize);
        const rightX = x + Math.round((finderSize + 7) * ps);
        if (!isFinderPattern(rightX, y, lum, w, h, finderSize, ps)) continue;
        const bottomY = y + Math.round((finderSize + 7) * ps);
        if (!isFinderPattern(x, bottomY, lum, w, h, finderSize, ps)) continue;
        const decoded = decodeMatrix(lum, w, h, x, y, ps);
        if (decoded) return decoded;
      }
    }
  }
  return null;
}

function isFinderPattern(startX: number, startY: number, lum: Uint8Array, w: number, h: number, size: number, moduleSize: number = 1): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = startX + c * moduleSize;
      const y = startY + r * moduleSize;
      if (r === 0 || r === size - 1 || c === 0 || c === size - 1) {
        if (!isDarkPixel(lum, w, h, x, y)) return false;
      } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
        if (isDarkPixel(lum, w, h, x, y)) return false;
      } else {
        if (isDarkPixel(lum, w, h, x, y)) return false;
      }
    }
  }
  return true;
}

function isDarkPixel(lum: Uint8Array, w: number, h: number, x: number, y: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  return lum[y * w + x] < 128;
}

function estimateModuleSize(startX: number, startY: number, lum: Uint8Array, w: number, h: number): number {
  for (let dx = 10; dx < w - startX; dx += 2) {
    if (isFinderPattern(startX + dx, startY, lum, w, h, 7, 1)) return dx / 7;
  }
  let count = 0;
  for (let x = startX; x < w && isDarkPixel(lum, w, h, x, startY + 3); x++) count++;
  return count > 0 ? count / 7 : 5;
}

function decodeMatrix(lum: Uint8Array, w: number, h: number, originX: number, originY: number, moduleSize: number): string | null {
  const gridOriginX = originX - Math.round(moduleSize);
  const gridOriginY = originY - Math.round(moduleSize);
  const sampleGridSize = Math.min(21, Math.round((w - gridOriginX) / moduleSize));
  if (sampleGridSize < 21) return null;
  const grid: boolean[][] = [];
  for (let row = 0; row < sampleGridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < sampleGridSize; col++) {
      const cx = Math.round(gridOriginX + col * moduleSize + moduleSize / 2);
      const cy = Math.round(gridOriginY + row * moduleSize + moduleSize / 2);
      grid[row][col] = isDarkPixel(lum, w, h, cx, cy);
    }
  }
  const bits: number[] = [];
  for (let row = 0; row < sampleGridSize; row++) {
    const leftToRight = row % 2 === 0;
    for (let col = 0; col < sampleGridSize; col++) {
      const c = leftToRight ? col : sampleGridSize - 1 - col;
      if (
        (row < 7 && col < 7) ||
        (row < 7 && col >= sampleGridSize - 7) ||
        (row >= sampleGridSize - 7 && col < 7) ||
        (row === 6 && col < sampleGridSize) ||
        (col === 6 && row < sampleGridSize)
      ) continue;
      bits.push(grid[row][c] ? 1 : 0);
    }
  }
  if (bits.length < 4) return null;
  let result = "";
  for (let i = 0; i < bits.length - 3; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) byte = (byte << 1) | bits[i + j];
    if (byte >= 32 && byte < 127) result += String.fromCharCode(byte);
  }
  return result || null;
}

function ScanLineAnimation() {
  return (
    <div className="absolute left-0 right-0 h-0 overflow-hidden">
      <div className="h-full w-full absolute inset-0">
        <div className="absolute top-1/4 h-1 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-line" />
      </div>
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-50%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(50%); opacity: 0; }
        }
        .animate-scan-line { animation: scan-line 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function CornerBrackets() {
  const b = "border-primary border-2";
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className={cn("absolute top-4 left-4 w-8 h-8", b)} style={{ borderRight: "none", borderBottom: "none" }} />
      <div className={cn("absolute top-4 right-4 w-8 h-8", b)} style={{ borderLeft: "none", borderBottom: "none" }} />
      <div className={cn("absolute bottom-4 left-4 w-8 h-8", b)} style={{ borderRight: "none", borderTop: "none" }} />
      <div className={cn("absolute bottom-4 right-4 w-8 h-8", b)} style={{ borderLeft: "none", borderTop: "none" }} />
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CameraOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}
