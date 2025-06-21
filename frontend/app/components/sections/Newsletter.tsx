"use client";

import React, { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsLoading(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubscribed(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] dark:bg-[#111] border border-black/[.08] dark:border-white/[.145] rounded-lg p-8 md:p-12 shadow-lg">
      <div className="max-w-2xl mx-auto text-center">
        {isSubscribed ? (
          <div className="space-y-4 py-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Thanks for subscribing!</h3>
            <p className="text-foreground/80 max-w-md mx-auto">
              You&apos;ve successfully joined our newsletter. We&apos;ll keep
              you updated with the latest news and announcements.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setEmail("");
                setIsSubscribed(false);
              }}
            >
              Subscribe another email
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-foreground/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Join Our Newsletter
              </h2>
              <p className="text-foreground/80 mb-6 max-w-md mx-auto">
                Stay informed with our latest news, updates, and special offers
                delivered directly to your inbox.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  error={error}
                  fullWidth
                  aria-label="Email address"
                />
              </div>
              <Button
                type="submit"
                isLoading={isLoading}
                className="sm:self-start"
                size="lg"
              >
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-foreground/60 mt-4">
              By subscribing, you agree to our Privacy Policy and consent to
              receive updates from our company.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
