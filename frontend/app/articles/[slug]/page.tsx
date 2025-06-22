import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/app/components/ui/Header";
import Footer from "@/app/components/ui/Footer";
import ArticleCard from "@/app/components/ui/ArticleCard";
import { getArticleBySlug, type Article } from "@/app/lib/articles";

// Format date to be human readable
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// Helper to parse content blocks for source URLs and notes
function parseArticleContent(content: string) {
  // Remove <p> tags, split by newlines
  const blocks = content
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const sourceMatch = block.match(/\((https?:\/\/[^\s)]+)\)/);
    const noteMatch = block.match(/<([^>]+)>/);
    const text = block
      .replace(/\(https?:\/\/[^\s)]+\)/, "")
      .replace(/<[^>]+>/, "")
      .trim();
    return {
      text,
      sourceUrl: sourceMatch ? sourceMatch[1] : undefined,
      note: noteMatch ? noteMatch[1] : undefined,
    };
  });
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage(props: PageProps) {
  const params = await props.params;
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles: Article[] = [];

  return (
    <div className="min-h-screen">
      <Header />
  
      <main className="container mx-auto px-4 py-8">
      <div
        className={`flex ${
          article.opposite_view ? "flex-row" : "flex-col"
        } gap-8`}
      >
          {/* Optional Side Panel */}
          {article.opposite_view && (
          <aside 
            className="w-1/4 bg-gray-100 p-4 rounded-lg shadow sticky self-start"
            style={{
               top: "15rem", // Stick 32px from top when scrolling
               maxHeight: "calc(100vh - 4rem)", // Limit height to viewport minus top offset
              overflowY: "auto", // Only scroll if content is too long
            }}
          >
            <h2 className="text-xl font-bold mb-4">Different Perspectives</h2>

            {parseArticleContent(article.opposite_view).map((block, idx) => (
              <div key={idx} className="relative group mb-4 flex flex-col items-start">
                {/* Block Text */}
                <span>{block.text}</span>

                {/* Source Information */}
                {(block.sourceUrl || block.note) && (
                  <div className="mt-2 bg-yellow-100 text-xs px-2 py-1 rounded shadow max-w-xs">
                    {block.sourceUrl && (
                      <a
                        href={block.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600 block"
                      >
                        Source
                      </a>
                    )}
                    {block.note && (
                      <span className="italic text-gray-600 block">
                        <span className="font-medium">AI reasoning:</span> {block.note}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </aside>)}

          {/* Main Article Content */}
          <article
          className={`${
            article.opposite_view ? "w-3/4" : "max-w-4xl mx-auto"
          }`}
          >

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href={`/category/${
                    article.categories[0]?.toLowerCase() || "uncategorized"
                  }`}
                  className="text-sm font-medium px-3 py-1 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors"
                >
                  {article.categories[0] || "Uncategorized"}
                </Link>
                <span className="text-sm text-foreground/60">
                  {formatDate(article.date)}
                </span>
              </div>
  
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                {article.title}
              </h1>

              {/* Political Bias Section */}
<div className="flex items-start gap-4 mb-6">
  {["Left", "Neutral", "Right"].map((bias) => (
    <div
      key={bias}
      className={`px-4 py-2 text-sm font-medium cursor-pointer ${
        article.bias === bias.toLowerCase()
          ? "bg-gray-700 text-white"
          : "bg-gray-200 text-gray-600"
      }`}
      style={{
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {bias}
    </div>
  ))}
</div>
  
              <p className="text-xl text-foreground/80 mb-6 font-serif">
                {article.summary}
              </p>
            </header>
  
            {/* Featured Image */}
            <div className="aspect-[16/9] relative rounded-lg overflow-hidden mb-8">
              <Image
                src={article.image}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                className="object-cover"
                priority
              />
            </div>
  
            {/* Article Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-lg">
              {parseArticleContent(article.content).map((block, idx) => (
                <div key={idx} className="relative group mb-4 flex items-start">
                  <span>{block.text}</span>
                  {(block.sourceUrl || block.note) && (
                    <span className="ml-2 align-top inline-block bg-yellow-100 text-xs px-2 py-1 rounded shadow max-w-xs">
                      {block.sourceUrl && (
                        <a
                          href={block.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 mr-2"
                        >
                          Source
                        </a>
                      )}
                      {block.note && (
                        <span className="italic text-gray-600">
                          <span className="font-medium">AI reasoning:</span>{" "}
                          {block.note}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
  
            {/* Article Footer */}
            <div className="mt-12 pt-8 border-t border-black/[.08] dark:border-white/[.145]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-medium">Share this article:</span>
                  <div className="flex gap-4 mt-2">
                    <button
                      className="text-foreground/60 hover:text-foreground transition-colors"
                      aria-label="Share on Twitter"
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </button>
                    <button
                      className="text-foreground/60 hover:text-foreground transition-colors"
                      aria-label="Share on Facebook"
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>
                    <button
                      className="text-foreground/60 hover:text-foreground transition-colors"
                      aria-label="Share on LinkedIn"
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </button>
                  </div>
                </div>
  
                <Link
                  href="/"
                  className="text-sm font-medium px-4 py-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </article>
      </div>
  
        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
  
      <Footer />
    </div>
  );
}