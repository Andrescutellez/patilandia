"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Brief sección 13 sugiere fades/slides de entrada de sección "si aporta valor" — se aplica acá,
 * no en toda la página, para no exagerar con animaciones donde no suman nada.
 */
export function FadeIn({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: "-80px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
