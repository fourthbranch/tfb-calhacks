import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-black/[.08] dark:border-white/[.145] py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="border-t border-black/[.08] dark:border-white/[.145] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-foreground/60">
            © {currentYear} The Fourth Branch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
