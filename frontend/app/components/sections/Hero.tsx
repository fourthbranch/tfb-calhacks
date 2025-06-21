import React from "react";
import Image from "next/image";
import Button from "../ui/Button";

export default function Hero() {
  return (
    <div className="flex flex-col gap-8 items-center text-center lg:text-left lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Build beautiful interfaces with Next.js
        </h1>
        <p className="text-lg text-foreground/80">
          A modern UI toolkit for building responsive, accessible, and beautiful
          web applications using Next.js and Tailwind CSS.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Button size="lg">Get Started</Button>
          <Button variant="secondary" size="lg">
            View Documentation
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-md aspect-square lg:max-w-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-3xl opacity-30"></div>
        <div className="relative bg-[#f9f9f9] dark:bg-[#111] border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 h-full flex items-center justify-center">
          <Image
            src="/next.svg"
            alt="Next.js logo"
            width={240}
            height={80}
            className="dark:invert"
            priority
          />
        </div>
      </div>
    </div>
  );
}
