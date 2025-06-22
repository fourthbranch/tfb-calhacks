"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LandingHeader from "../components/ui/LandingHeader";
import LandingFooter from "../components/ui/LandingFooter";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from "../lib/api";
import { motion } from "framer-motion";
import { BarChart, BrainCircuit, Scale } from "lucide-react";

// Helper for animations
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const Feature = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <motion.div
    variants={fadeIn}
    className="bg-white/5 p-6 rounded-lg border border-white/10 text-center"
  >
    <div className="inline-block bg-white/10 p-3 rounded-full mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{children}</p>
  </motion.div>
);

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
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      <LandingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <motion.section
          initial="initial"
          animate="animate"
          className="w-full text-center py-20 md:py-32 flex flex-col items-center justify-center"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%,rgba(120,119,198,0.3), hsla(0, 0%, 100%, 0))`,
          }}
        >
          <motion.h1
            variants={fadeIn}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400"
          >
            Unsilence The Truth.
          </motion.h1>
          <motion.p
            variants={fadeIn}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Tired of biased narratives? Get AI-powered news that shows you every
            angle, personalized to your interests.
          </motion.p>
          <motion.div
            variants={fadeIn}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md mx-auto"
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow bg-white/5 border-white/20 placeholder:text-gray-500 focus:ring-white/50 text-white"
                required
              />
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Get Started"}
              </Button>
            </form>
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial="initial"
          whileInView="animate"
          variants={{ animate: { transition: { staggerChildren: 0.2 } } }}
          viewport={{ once: true, amount: 0.3 }}
          className="container mx-auto px-4 py-2 md:py-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              icon={<BrainCircuit size={24} />}
              title="AI-Personalized Content"
            >
              Our AI learns what you care about and delivers news digests
              tailored specifically to your interests and reading style.
            </Feature>
            <Feature icon={<Scale size={24} />} title="Balanced Perspectives">
              We break you out of the echo chamber by presenting multiple
              viewpoints on the same issue, side-by-side.
            </Feature>
            <Feature icon={<BarChart size={24} />} title="In-Depth Analysis">
              Go beyond the headlines. Our AI agents provide comprehensive
              reports, not just sensationalized summaries.
            </Feature>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
