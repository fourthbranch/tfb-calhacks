"use client";

import React from "react";
import { createAuthHeaders } from "../../lib/auth";

export default function NewsletterForm() {
  return (
    <section
      id="newsletter"
      className="my-12 bg-[#f9f9f9] dark:bg-[#111] border border-black/[.08] dark:border-white/[.145] rounded-lg p-8"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Stay Informed</h2>
        <p className="text-foreground/80 mb-6">
          Subscribe to our newsletter to receive the latest news and updates
          directly in your inbox.
        </p>

        <form
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const email = (form.elements.namedItem("email") as HTMLInputElement)
              .value;

            try {
              const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
              const url = `${baseUrl}/subscribe`.replace(/([^:]\/)\/+/g, "$1");
              const response = await fetch(url, {
                method: "POST",
                headers: createAuthHeaders(),
                body: JSON.stringify({ email }),
                credentials: "include",
                mode: "cors",
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.detail || "Failed to subscribe");
              }

              alert("Successfully subscribed!");
              form.reset();
            } catch (error) {
              alert(
                error instanceof Error ? error.message : "Failed to subscribe"
              );
            }
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Your email address"
            className="flex-1 px-4 py-2 rounded-md border border-black/[.08] dark:border-white/[.145] bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/20"
            required
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          />
          <button
            type="submit"
            className="bg-foreground text-background px-4 py-2 rounded-md font-medium hover:bg-foreground/90 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
