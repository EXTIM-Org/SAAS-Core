'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation variants for numbers
const numberVariant: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, y: 10 },
};

export const AnimatedNumber = ({
  value,
  className = 'text-3xl font-bold',
}: {
  value: string | number;
  className?: string;
}) => (
  <div className="overflow-hidden h-10">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={value}
        variants={numberVariant}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {value}
      </motion.div>
    </AnimatePresence>
  </div>
);
