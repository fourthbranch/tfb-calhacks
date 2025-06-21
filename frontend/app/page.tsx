import React from "react";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";
import FeaturedArticle from "./components/ui/FeaturedArticle";
import ArticleGrid from "./components/sections/ArticleGrid";
import NewsletterForm from "./components/ui/NewsletterForm";
import { getFeaturedArticles, getRecentArticles } from "./lib/articles";

export default async function Home() {
  const featuredArticles = await getFeaturedArticles();
  const recentArticles = await getRecentArticles(50);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Featured Articles */}
        <section className="mb-12">
          <div className="grid grid-cols-1 gap-6">
            {featuredArticles.length > 0 && (
              <FeaturedArticle article={featuredArticles[0]} />
            )}

            {featuredArticles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredArticles.slice(1).map((article) => (
                  <FeaturedArticle
                    key={article.id}
                    article={article}
                    className="relative aspect-[16/7]"
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Latest News */}
        <ArticleGrid articles={recentArticles} title="Latest News" />

        {/* Newsletter Section */}
        <NewsletterForm />
      </main>

      <Footer />
    </div>
  );
}
