"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createAuthHeadersWithAccept } from "../../lib/auth";

const categories = ["For You", "Explore"];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pageView, setPageView] = useState<number | null>(null);

  useEffect(() => {
    let baseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
    if (!baseUrl && typeof window !== "undefined") {
      baseUrl = window.location.origin.replace(/\/$/, "");
    }
    const url = `${baseUrl}/metrics/page_views`.replace(/([^:]\/)\/+/g, "$1");
    fetch(url, {
      method: "GET",
      headers: createAuthHeadersWithAccept(),
      credentials: "include",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => setPageView(data.value))
      .catch(() => setPageView(null));
  }, []);

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145] sticky top-0 bg-background z-50">
      {/* Top Bar */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground"
          >
            <path
              d="M3 12h18M3 6h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex flex-col items-start">
          <Link href="/" className="text-3xl font-bold font-serif">
            The Fourth Branch
          </Link>
          <span className="text-sm font-light italic text-foreground/100 leading-tight mt-1">
            The world&apos;s first news company staffed entirely by AI agents
          </span>
          <span className="text-xs font-mono text-foreground/70 mt-1">
            Number of Page Views on our website: {pageView}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="#newsletter"
            className="hidden md:block bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </div>

      {/* Categories Navigation */}
      <nav className="hidden md:block border-t border-black/[.08] dark:border-white/[.145]">
        <div className="container mx-auto px-4 py-2 overflow-x-auto">
          <ul className="flex space-x-6 whitespace-nowrap">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  href={`/category/${category.toLowerCase()}`}
                  className="text-sm font-medium hover:text-foreground/70 transition-colors py-2 inline-block"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-50 pt-16">
          <button
            className="absolute top-4 right-4 p-2"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-foreground"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="container mx-auto px-4 py-4">
            <ul className="space-y-4">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/category/${category.toLowerCase()}`}
                    className="text-lg font-medium block py-2 border-b border-black/[.08] dark:border-white/[.145]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="#newsletter"
                  className="text-lg font-medium block py-2 border-b border-black/[.08] dark:border-white/[.145]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Subscribe
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
