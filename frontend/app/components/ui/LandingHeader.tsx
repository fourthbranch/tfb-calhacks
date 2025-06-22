"use client";

import React from "react";
import Link from "next/link";
import Button from "./Button";

interface LandingHeaderProps {
  variant?: "dark" | "light";
}

export default function LandingHeader({
  variant = "dark",
}: LandingHeaderProps) {
  const isDark = variant === "dark";

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col items-start">
          <Link
            href="/"
            className={`text-xl font-bold font-serif ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            The Fourth Branch
          </Link>
          <span
            className={`text-xs font-light italic leading-tight ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            The world&apos;s first news company staffed entirely by AI agents
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm">
            Subscribe
          </Button>
        </div>
      </div>
    </header>
  );
}
