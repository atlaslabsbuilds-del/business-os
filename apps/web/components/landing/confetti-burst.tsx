"use client";

import { useEffect } from "react";
import gsap from "gsap";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#ffffff", "#ea580c"];

export function ConfettiBurst({ nonce }: { nonce: number }) {
  useEffect(() => {
    if (nonce === 0) return;

    const canvas = document.createElement("canvas");
    canvas.className = "landing-confetti-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 72 }, () => ({
      x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 120,
      y: window.innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 12,
    }));

    const tween = gsap.to(
      {},
      {
        duration: 2.4,
        ease: "none",
        onUpdate: () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (const particle of particles) {
            particle.vy += 0.32;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.spin;
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate((particle.rotation * Math.PI) / 180);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.max(0, 1 - particle.y / canvas.height);
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
            ctx.restore();
          }
        },
        onComplete: () => {
          window.removeEventListener("resize", resize);
          canvas.remove();
        },
      },
    );

    return () => {
      tween.kill();
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  }, [nonce]);

  return null;
}
