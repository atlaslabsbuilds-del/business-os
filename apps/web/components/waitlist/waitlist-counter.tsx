"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

function useAnimatedNumber(value: number) {
  const spring = useSpring(value, { stiffness: 90, damping: 22, mass: 0.8 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  return display;
}

export function WaitlistCounter({ count, className = "" }: { count: number; className?: string }) {
  const animatedCount = useAnimatedNumber(count);
  const previousCount = useRef(count);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count > previousCount.current) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 700);
      previousCount.current = count;
      return () => window.clearTimeout(timer);
    }
    previousCount.current = count;
  }, [count]);

  if (count <= 0) {
    return (
      <p className={`text-sm leading-6 text-secondary sm:text-base ${className}`}>
        Be the first founder to join the VanderBase waitlist.
      </p>
    );
  }

  return (
    <motion.p
      animate={pulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`text-sm leading-6 text-secondary sm:text-base ${className}`}
    >
      Join{" "}
      <span className="font-semibold tabular-nums text-foreground">{animatedCount.toLocaleString()}</span>{" "}
      founder{animatedCount === 1 ? "" : "s"} already on the VanderBase waitlist.
    </motion.p>
  );
}
