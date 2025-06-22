"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/ui/Header";
import Footer from "../../components/ui/Footer";
import ArticleGrid from "../../components/sections/ArticleGrid";
import Chatbox from "../../components/sections/Chatbox";
import NewsletterForm from "../../components/ui/NewsletterForm";
import {
  getArticlesExplore,
  getArticlesForYou,
  type Article,
} from "../../lib/articles";

type PageProps = {
  params: Promise<{ category: string }>;
};

function formatCategoryName(category: string): string {
  // Decode URL-encoded strings
  const decoded = decodeURIComponent(category);

  // Special case for "foryou" or "for you"
  if (
    decoded.toLowerCase() === "foryou" ||
    decoded.toLowerCase() === "for you"
  ) {
    return "For You";
  }

  // Split by spaces and capitalize each word
  const words = decoded.split(" ");

  // Special case for "US"
  const formattedWords = words.map((word) => {
    if (word.toUpperCase() === "US") return "US";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(" ");
}

export default function CategoryPage(props: PageProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [hasEmail, setHasEmail] = useState<boolean | null>(null);
  const [decodedCategory, setDecodedCategory] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const params = await props.params;
      const email =
        typeof window !== "undefined"
          ? localStorage.getItem("user_email")
          : null;

      if (!email) {
        router.replace("/landing");
        return;
      }

      setHasEmail(true);
      setCategoryName(formatCategoryName(params.category));

      // Decode the category parameter for comparison
      const decoded = decodeURIComponent(params.category);
      setDecodedCategory(decoded);

      let articlesData = [];
      if (
        decoded.toLowerCase() === "for you" ||
        decoded.toLowerCase() === "foryou"
      ) {
        articlesData = await getArticlesForYou(email);
      } else if (decoded.toLowerCase() === "explore") {
        articlesData = await getArticlesExplore(email);
      } else {
        throw new Error(`Unknown category: ${decoded}`);
      }

      setArticles(articlesData);
    };

    loadData();
  }, [props.params, router]);

  if (hasEmail === null) return null;
  if (!hasEmail) return null;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8">{categoryName}</h1>

        {/* Show Chatbox for "For You" category */}
        {(decodedCategory.toLowerCase() === "for you" ||
          decodedCategory.toLowerCase() === "foryou") && (
          <div className="mb-8">
            <Chatbox />
          </div>
        )}

        {/* Articles Grid */}
        <ArticleGrid articles={articles} title={`Latest ${categoryName}`} />

        {/* Newsletter Section */}
        <NewsletterForm />
      </main>

      <Footer />
    </div>
  );
}
