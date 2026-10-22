"use client";

import { useRef, useState } from "react";

const BOX = 280; // preview size in px
const OUT = 256; // saved image size in px

type Props = {
  file: File;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
};

export default function AvatarCropper({ file, onCancel, onDone }: Props) {
  // Revoked in the Cancel/Save handlers, not in an effect: React dev mode runs effect
  // cleanups twice and would revoke the URL before the image loads.
  const [url] = useState(() => URL.createObjectURL(file));

  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const base = nat ? BOX / Math.min(nat.w, nat.h) : 1; // scale at which the image just covers the box
  const scale = base * zoom;

  function clamp(p: { x: number; y: number }, z = zoom) {
    if (!nat) return p;
    const s = base * z;
    const maxX = Math.max(0, (nat.w * s - BOX) / 2);
    const maxY = Math.max(0, (nat.h * s - BOX) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setPos((p) => clamp({ x: p.x + dx, y: p.y + dy }));
  }
  function changeZoom(z: number) {
    setZoom(z);
    setPos((p) => clamp(p, z));
  }

  function save() {
    const img = imgRef.current;
    if (!img || !nat) return;
    const left = BOX / 2 - (nat.w * scale) / 2 + pos.x;
    const top = BOX / 2 - (nat.h * scale) / 2 + pos.y;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = OUT;
    canvas.getContext("2d")!.drawImage(img, -left / scale, -top / scale, BOX / scale, BOX / scale, 0, 0, OUT, OUT);
    canvas.toBlob(
      (b) => {
        if (!b) return;
        URL.revokeObjectURL(url);
        onDone(b);
      },
      "image/jpeg",
      0.88,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-3xl border border-line bg-surface p-5">
        <div>
          <h3 className="text-lg font-bold">Adjust your photo</h3>
          <p className="text-sm text-muted">Drag to move. Use the slider to zoom.</p>
        </div>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-full bg-surface-2"
          style={{ width: BOX, height: BOX, cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="pointer-events-none absolute max-w-none select-none"
            style={
              nat
                ? {
                    width: nat.w * scale,
                    height: nat.h * scale,
                    left: BOX / 2 - (nat.w * scale) / 2 + pos.x,
                    top: BOX / 2 - (nat.h * scale) / 2 + pos.y,
                  }
                : { opacity: 0 }
            }
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label="Zoom"
        />

        <div className="flex gap-2">
          <button
            onClick={() => {
              URL.revokeObjectURL(url);
              onCancel();
            }}
            className="flex-1 rounded-xl border border-line py-3 text-muted">
            Cancel
          </button>
          <button onClick={save} className="flex-1 rounded-xl bg-accent py-3 font-semibold text-accent-ink">
            Save photo
          </button>
        </div>
      </div>
    </div>
  );
}
