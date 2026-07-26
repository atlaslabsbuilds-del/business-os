"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export function LandingAtmosphere() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springY = useSpring(y, { stiffness: 80, damping: 20 });
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0)`;

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <>
      <div className="landing-aurora" aria-hidden>
        <div className="landing-aurora__blob landing-aurora__blob--a" />
        <div className="landing-aurora__blob landing-aurora__blob--b" />
        <div className="landing-aurora__blob landing-aurora__blob--c" />
        <div className="landing-grid" />
        <div className="landing-noise" />
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-primary/40"
            style={{
              left: `${(index * 17) % 100}%`,
              top: `${(index * 29) % 100}%`,
              animation: `landing-pulse ${4 + (index % 5)}s ease-in-out ${index * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <motion.div className="landing-cursor-glow" style={{ transform }} aria-hidden />
    </>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return <motion.div className="landing-scroll-progress" style={{ scaleX }} aria-hidden />;
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function useTilt(max = 8) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 160, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 160, damping: 18 });

  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max);
    rotateX.set(-py * max);
  };

  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return {
    style: {
      rotateX: springX,
      rotateY: springY,
      transformPerspective: 1200,
    },
    onMove,
    onLeave,
  };
}

export function MagneticButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tx = useSpring(x, { stiffness: 220, damping: 18 });
  const ty = useSpring(y, { stiffness: 220, damping: 18 });

  return (
    <motion.div
      className={className}
      style={{ x: tx, y: ty }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.2);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxY({
  children,
  distance = 40,
  className = "",
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, distance]);
  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
