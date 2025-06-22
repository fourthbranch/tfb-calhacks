"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LandingHeader from "../components/ui/LandingHeader";
import LandingFooter from "../components/ui/LandingFooter";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const userCheck = await api.checkUser(email);
      
      localStorage.setItem("user_email", email);
      const emaill = localStorage.getItem("user_email")
      console.log(emaill)

      if (userCheck.exists && userCheck.onboarding_completed) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      setError("Failed to verify email. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen animated-gradient text-white">
      <LandingHeader />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center bg-black/30 backdrop-blur-xl p-8 sm:p-12 rounded-2xl border border-white/20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Your News, Reimagined.
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl mx-auto">
            Get personalized news digests that match your views, interests, and reading style. Powered by AI.
          </p>
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow bg-white/20 border-white/30 placeholder:text-gray-300 focus:ring-white"
              required
            />
            <Button type="submit" variant="secondary" size="lg" disabled={isLoading}>
              {isLoading ? "Checking..." : "Continue →"}
            </Button>
          </form>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
