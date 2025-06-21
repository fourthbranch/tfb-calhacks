import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/app/lib/articles";

interface ArticleCardProps {
  article: Article;
  className?: string;
}

export default function ArticleCard({
  article,
  className = "",
}: ArticleCardProps) {
  return (
    <div
      className={`group flex flex-col h-full overflow-hidden border-b border-black/[.08] dark:border-white/[.145] pb-6 ${className}`}
    >
      <Link
        href={`/articles/${article.slug}`}
        className="block overflow-hidden rounded-lg mb-4 aspect-[16/9] relative"
      >
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={article.featured}
        />
      </Link>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium px-2 py-1 bg-foreground/5 rounded-full">
            {article.categories[0] || "Uncategorized"}
          </span>
          <span className="text-xs text-foreground/60">{article.date}</span>
        </div>

        <Link
          href={`/articles/${article.slug}`}
          className="block group-hover:underline"
        >
          <h3 className="text-xl font-bold mb-2 line-clamp-2">
            {article.title}
          </h3>
        </Link>

        <p className="text-foreground/80 mb-3 line-clamp-3 text-sm">
          {article.summary}
        </p>
      </div>
    </div>
  );
}
