"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg z-[-1] opacity-30"></div>
      </div>

      <div className="text-center px-4 py-10 w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center"
        >
          <span className="text-9xl font-bold text-primary opacity-10 absolute -top-10">
            404
          </span>
          <h1 className="text-4xl font-bold relative mb-2">Page Not Found</h1>
          <div className="h-1 w-20 bg-primary rounded-full mb-6"></div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-muted-foreground mb-8"
        >
          The page you are looking for doesn't exist or has been moved.
          Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">Read the Blog</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}