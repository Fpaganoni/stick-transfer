"use client";

import { ArrowUpIcon } from "lucide-react";
import { motion } from "framer-motion";

/** Inline validation message shown under a register field. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-1 text-error bg-error/20 font-semibold p-1 text-xs mt-1"
    >
      <ArrowUpIcon size={14} className="shrink-0 mt-px" />
      {message}
    </motion.p>
  );
}
