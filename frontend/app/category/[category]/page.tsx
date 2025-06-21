import React from "react";
import Header from "../../components/ui/Header";
import Footer from "../../components/ui/Footer";
import ArticleGrid from "../../components/sections/ArticleGrid";
import NewsletterForm from "../../components/ui/NewsletterForm";
import { getArticlesByCategory } from "../../lib/articles";

type PageProps = {
  params: Promise<{ category: string }>;
};

function formatCategoryName(category: string): string {
  // Decode URL-encoded strings
  const decoded = decodeURIComponent(category);

  // Split by spaces and capitalize each word
  const words = decoded.split(" ");

  // Special case for "US"
  const formattedWords = words.map((word) => {
    if (word.toUpperCase() === "US") return "US";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(" ");
}

export default async function CategoryPage(props: PageProps) {
  const params = await props.params;
  const articles = await getArticlesByCategory(params.category);
  const categoryName = formatCategoryName(params.category);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8">{categoryName}</h1>

        {/* Articles Grid */}
        <ArticleGrid articles={articles} title={`Latest ${categoryName}`} />

        {/* Newsletter Section */}
        <NewsletterForm />
      </main>

      <Footer />
    </div>
  );
}
