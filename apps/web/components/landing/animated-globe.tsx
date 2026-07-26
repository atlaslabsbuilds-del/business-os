"use client";

import { useEffect, useRef } from "react";

type Dot = { lat: number; lng: number; size: number };

const DOTS: Dot[] = [
  { lat: 40.7, lng: -74, size: 2.2 },
  { lat: 51.5, lng: -0.1, size: 2 },
  { lat: 35.7, lng: 139.7, size: 2.4 },
  { lat: 1.3, lng: 103.8, size: 1.8 },
  { lat: -33.9, lng: 18.4, size: 1.6 },
  { lat: 19.4, lng: -99.1, size: 2 },
  { lat: 48.9, lng: 2.3, size: 1.8 },
  { lat: 37.8, lng: -122.4, size: 2.2 },
  { lat: 28.6, lng: 77.2, size: 2.6 },
  { lat: -23.5, lng: -46.6, size: 1.8 },
  { lat: 25.2, lng: 55.3, size: 1.6 },
  { lat: 52.5, lng: 13.4, size: 1.4 },
];

function project(lat: number, lng: number, rotation: number, cx: number, cy: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + rotation) * Math.PI) / 180;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const scale = (z + radius) / (2 * radius);
  return { x: cx + x, y: cy + y, scale, visible: z > -radius * 0.15 };
}

export function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rotation = 0;
    let frame = 0;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.38;

      ctx.clearRect(0, 0, size, size);

      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      gradient.addColorStop(0, "rgba(249,115,22,0.08)");
      gradient.addColorStop(1, "rgba(11,11,15,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 4) {
          const point = project(lat, lng, rotation, cx, cy, radius);
          if (!point.visible) continue;
          if (lng === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.stroke();
      }

      const sorted = DOTS.map((dot) => ({
        ...dot,
        ...project(dot.lat, dot.lng, rotation, cx, cy, radius),
      })).sort((a, b) => a.scale - b.scale);

      for (const dot of sorted) {
        if (!dot.visible) continue;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size * dot.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${0.35 + dot.scale * 0.55})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size * dot.scale * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${0.06 * dot.scale})`;
        ctx.fill();
      }

      rotation += 0.18;
      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="landing-globe pointer-events-none absolute right-[-8%] top-[12%] hidden h-[min(520px,55vw)] w-[min(520px,55vw)] opacity-70 lg:block"
      aria-hidden
    />
  );
}
