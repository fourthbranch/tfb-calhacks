import React from "react";
import ArticleCard from "../ui/ArticleCard";
import { Article } from "@/app/lib/articles";

interface ArticleGridProps {
  articles: Article[];
  title?: string;
  className?: string;
}

export default function ArticleGrid({
  articles,
  title,
  className = "",
}: ArticleGridProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-black/[.08] dark:border-white/[.145]">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
