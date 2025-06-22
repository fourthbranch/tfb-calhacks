import React, { useState } from "react";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import Button from "../ui/Button";
import { getArticleBySlug } from "../../lib/articles";

interface ArticleLink {
  id: string;
  slug: string;
  title: string;
}

const Chatbox: React.FC = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [articles, setArticles] = useState<ArticleLink[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowResult(false);
    setArticles([]);
    if (!input.trim()) {
      setError("Please enter a topic or question.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/gen_news_with_request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_request: input }),
      });
      if (!res.ok) throw new Error("Failed to generate stories.");
      const data = await res.json();
      const ids: string[] = data.article_ids || [];
      if (ids.length === 0) throw new Error("No stories generated.");
      // Fetch articles by ID
      const fetched = await Promise.all(
        ids.map(async (id) => {
          const article = await getArticleBySlug(id);
          return article
            ? { id: article.id, slug: article.slug, title: article.title }
            : null;
        })
      );
      setArticles(fetched.filter(Boolean) as ArticleLink[]);
      setShowResult(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mb-8 p-8 bg-gradient-to-br from-gray-50 to-gray-200 rounded-2xl shadow-lg border border-gray-200">
      <form onSubmit={handleAsk} className="flex flex-col gap-4">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask our AI agent about any topic..."
          className="min-h-[120px] text-base resize-none"
          disabled={loading}
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={loading} size="md" className="min-w-[120px]">Ask</Button>
        </div>
      </form>
      <div className="mt-3 text-xs text-gray-500">This may take up to 1 minute to generate new stories.</div>
      {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}
      <div className="mt-6 min-h-[40px]">
        {showResult && articles.length > 0 && (
          <ul className="space-y-3 animate-fade-in">
            {articles.map(article => (
              <li key={article.id}>
                <a
                  href={`/articles/${article.slug}`}
                  className="text-blue-600 hover:underline text-base"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        )}
        {showResult && articles.length === 0 && !error && (
          <div className="text-gray-600">No stories found.</div>
        )}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Chatbox; 