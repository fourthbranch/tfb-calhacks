import React from "react";

export default function LandingFooter() {
  return (
    <footer className="w-full">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-gray-500 mb-4">
          <p>&copy; {new Date().getFullYear()} The Fourth Branch. All rights reserved.</p>
          <p className="text-sm mt-1">Developed for UC Berkeley AI Hackathon 2025</p>
          <p className="text-sm mt-1">Authors: Zichen Zhang, Yuchen Huang, Jenny Wang</p>
        </div>
      </div>
    </footer>
  );
} 