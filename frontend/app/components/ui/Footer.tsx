import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-black/[.08] dark:border-white/[.145] py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="border-t border-black/[.08] dark:border-white/[.145] mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <p className="text-sm text-foreground/60 mb-2">
                © {currentYear} The Fourth Branch. All rights reserved.
              </p>
              <p className="text-xs text-foreground/50">
                Developed for UC Berkeley AI Hackathon 2025
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-foreground/50 mb-1">Authors:</p>
              <p className="text-xs text-foreground/50">
                Zichen Zhang, Yuchen Huang, Jenny Wang
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
