import React from "react";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="w-full">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} The Fourth Branch. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
} 