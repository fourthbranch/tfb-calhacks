"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";
import ArticleGrid from "./components/sections/ArticleGrid";
import NewsletterForm from "./components/ui/NewsletterForm";
import { getArticlesForYou, type Article } from "./lib/articles";
import Chatbox from "./components/sections/Chatbox";

export default function Home() {
  const router = useRouter();
  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [articles, setarticles] = useState<Article[]>([]);

  useEffect(() => {
    const email =
      typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
    if (!email) {
      router.replace("/landing");
    } else {
      setHasEmail(true);
      (async () => {
        setarticles(await getArticlesForYou(email));
      })();
    }
  }, [router]);

  if (hasEmail === null) return null;
  if (!hasEmail) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Chatbox />
        {articles.length > 0 && <ArticleGrid articles={articles} />}
        <NewsletterForm />
      </main>
      <Footer />
    </div>
  );
}
