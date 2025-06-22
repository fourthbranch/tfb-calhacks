import { createAuthHeaders, getApiKey } from "./auth";

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  categories: string[];
  date: string;
  bias?: string;
  featured?: boolean;
  opposite_view?: string;
}

interface BackendArticle {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  content?: string;
  image?: string;
  relevant_topics?: string[];
  created_at?: string;
  opposite_view?: string;
  bias?: string;
}

// Backend API base URL
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
).replace(/\/$/, "");

export async function getAllArticlesDisplay(
  userEmail: string | null
): Promise<{ foryou: Article[]; explore: Article[] }> {
  // Get user email from localStorage
  // const userEmail = localStorage.getItem('user_email');

  const res = await fetch(`${API_BASE}/articles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      user_email: userEmail || "", // Pass user email in the header
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) return { foryou: [], explore: [] };

  const data = await res.json();

  // Map backend data to frontend Article structure
  const foryou = data.user_preferred.map(
    (item: BackendArticle): Article => ({
      id: item.id || "",
      slug: item.slug || item.id?.toString() || "",
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      image:
        item.image ||
        `/image/politics_${Math.floor(Math.random() * 2) + 1}.jpg`,
      categories: item.relevant_topics || ["US"],
      date: item.created_at || "",
      featured: false,
      opposite_view: item.opposite_view || "",
      bias: item.bias || "",
    })
  );

  const explore = data.explore.map(
    (item: BackendArticle): Article => ({
      id: item.id || "",
      slug: item.slug || item.id?.toString() || "",
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      image:
        item.image ||
        `/image/politics_${Math.floor(Math.random() * 2) + 1}.jpg`,
      categories: item.relevant_topics || ["US"],
      date: item.created_at || "",
      featured: false,
      opposite_view: item.opposite_view || "",
      bias: item.bias || "",
    })
  );
  return { foryou, explore };
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | undefined> {
  const res = await fetch(`${API_BASE}/articles/${slug}`, {
    headers: createAuthHeaders(),
  });
  if (!res.ok) return undefined;
  const item: BackendArticle = await res.json();
  return {
    id: item.id || "",
    slug: item.slug || item.id?.toString() || "",
    title: item.title || "",
    summary: item.summary || "",
    content: item.content || "",
    image:
      item.image || `/image/politics_${Math.floor(Math.random() * 3) + 1}.jpg`,
    categories: item.relevant_topics || [],
    date: item.created_at || "",
    featured: false,
    bias: item.bias || "",
    opposite_view: item.opposite_view || "",
  };
}

export async function getImpactAnalysis(
  articleId: string,
  userEmail: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE}/articles/${articleId}/impact-analysis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
          article_id: parseInt(articleId),
          user_email: userEmail,
        }),
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch impact analysis:", res.status);
      return null;
    }

    const data = await res.json();
    return data.impact_analysis;
  } catch (error) {
    console.error("Error fetching impact analysis:", error);
    return null;
  }
}

export async function getArticlesForYou(
  userEmail: string | null
): Promise<Article[]> {
  const all = await getAllArticlesDisplay(userEmail);
  const articles = all.foryou;
  return articles;
}

export async function getArticlesExplore(
  userEmail: string | null
): Promise<Article[]> {
  const all = await getAllArticlesDisplay(userEmail);
  const articles = all.explore;
  return articles;
}
