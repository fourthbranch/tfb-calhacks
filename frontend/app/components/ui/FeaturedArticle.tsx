import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "../../lib/articles";

interface FeaturedArticleProps {
  article: Article;
  className?: string;
}

export default function FeaturedArticle({
  article,
  className = "",
}: FeaturedArticleProps) {
  return (
    <div className={`group relative overflow-hidden rounded-lg ${className}`}>
      <div className="aspect-[16/9] md:aspect-[21/9] relative">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium px-2 py-1 bg-white/20 text-white rounded-full backdrop-blur-sm">
            {article.categories[0] || "Uncategorized"}
          </span>
          <span className="text-xs text-white/80">{article.date}</span>
        </div>

        <Link
          href={`/articles/${article.slug}`}
          className="block group-hover:underline"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            {article.title}
          </h2>
        </Link>

        <p className="text-white/90 mb-4 max-w-2xl line-clamp-2 md:line-clamp-3">
          {article.summary}
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={`/articles/${article.slug}`}
            className="ml-auto text-white bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full text-sm backdrop-blur-sm"
          >
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
}
