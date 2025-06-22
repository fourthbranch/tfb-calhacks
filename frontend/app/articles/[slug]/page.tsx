"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/ui/Header";
import Footer from "../../components/ui/Footer";
import ArticleCard from "../../components/ui/ArticleCard";
import PodcastPlayer from "../../components/ui/PodcastPlayer";
import {
  getArticleBySlug,
  getImpactAnalysis,
  getPodcastAudio,
  type Article,
} from "../../lib/articles";
import { formatDate } from "../../lib/utils";

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ArticlePage(props: PageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<string | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [podcastAudio, setPodcastAudio] = useState<{ audio_data: string; transcript: string; duration_estimate: number } | null>(null);
  const [loadingPodcast, setLoadingPodcast] = useState(false);
  const [showPodcast, setShowPodcast] = useState(false);
  const [params, setParams] = useState<{ slug: string } | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      const resolvedParams = await props.params;
      setParams(resolvedParams);

      const articleData = await getArticleBySlug(resolvedParams.slug);
      if (!articleData) {
        notFound();
      }
      setArticle(articleData);

      // Get user email and fetch impact analysis and podcast audio
      const userEmail = localStorage.getItem("user_email");
      if (userEmail && articleData.id) {
        // Load impact analysis
        setLoadingImpact(true);
        try {
          const analysis = await getImpactAnalysis(articleData.id, userEmail);
          setImpactAnalysis(analysis);
        } catch (error) {
          console.error("Error loading impact analysis:", error);
        } finally {
          setLoadingImpact(false);
        }

        // Load podcast audio
        setLoadingPodcast(true);
        try {
          const audio = await getPodcastAudio(articleData.id, userEmail);
          setPodcastAudio(audio);
        } catch (error) {
          console.error("Error loading podcast audio:", error);
        } finally {
          setLoadingPodcast(false);
        }
      }
    };

    loadArticle();
  }, [props.params]);

  if (!article || !params) {
    return <div>Loading...</div>;
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
                <div
                  key={idx}
                  className="relative group mb-4 flex flex-col items-start"
                >
                  {/* Block Text */}
                  <span>{block.text}</span>

                  {/* Source Information */}
                  {(block.sourceUrl || block.note) && (
                    <div className="mt-2 bg-yellow-100 dark:bg-yellow-700 text-xs px-2 py-1 rounded shadow max-w-xs">
                      {block.sourceUrl && (
                        <a
                          href={block.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 dark:text-blue-400 block"
                        >
                          Source
                        </a>
                      )}
                      {block.note && (
                        <span className="italic text-gray-600 dark:text-gray-300 block">
                          <span className="font-medium">AI reasoning:</span>{" "}
                          {block.note}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </aside>
          )}

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
                {["liberal", "neutral", "conservative"].map((bias) => {
                  console.log("Current article.bias:", article.bias); // Debugging output
                  return (
                    <div
                      key={bias}
                      className={`px-4 py-2 text-sm font-medium cursor-pointer ${
                        article.bias === bias.toLowerCase()
                          ? "bg-gray-700 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                      style={{
                        transition:
                          "background-color 0.3s ease, color 0.3s ease",
                      }}
                    >
                      {bias}
                    </div>
                  );
                })}
              </div>

              <p className="text-xl text-foreground/80 mb-6 font-serif">
                {article.summary}
              </p>

              {/* Podcast Player Section */}
              {podcastAudio && (
                <div className="mb-6">
                  <PodcastPlayer
                    audioData={podcastAudio.audio_data}
                    transcript={podcastAudio.transcript}
                    durationEstimate={podcastAudio.duration_estimate}
                  />
                </div>
              )}

              {loadingPodcast && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 p-6 rounded-xl shadow-lg mb-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-purple-800 dark:text-purple-200">
                      Generating podcast audio...
                    </span>
                  </div>
                </div>
              )}

              {/* Impact Analysis Section */}
              {impactAnalysis && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    How will this impact you?
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {impactAnalysis}
                  </p>
                </div>
              )}

              {loadingImpact && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    How will this impact you?
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    Analyzing personal impact...
                  </p>
                </div>
              )}
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
