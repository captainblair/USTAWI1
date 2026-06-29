"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: "fade-up" | "fade-in" | "scale" | "slide-left" | "slide-right";
  delay?: number;
  /** Trigger animation every time section enters view */
  once?: boolean;
};

const variants = {
  "fade-up": {
    hidden: { opacity: 0, y: 48 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -56 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 56 },
    visible: { opacity: 1, x: 0 },
  },
};

export function ScrollReveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.18, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      variants={variants[variant]}
    >
      {children}
    </motion.div>
  );
}
