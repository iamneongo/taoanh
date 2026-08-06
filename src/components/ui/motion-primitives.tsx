"use client";

import * as React from "react";
import { motion, type Transition, type Variants } from "motion/react";

const EASE: Transition = { type: "spring", stiffness: 380, damping: 32 };

/** Fade + slide-up on mount. Optional `delay` (seconds). */
export function FadeIn({
  children,
  delay = 0,
  y = 8,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: EASE },
};

/** Wrap a grid/list to fade+scale its `StaggerItem` children in sequence. */
export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Subtle tap/press feedback wrapper for interactive tiles. */
export function Pressable({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={EASE}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
