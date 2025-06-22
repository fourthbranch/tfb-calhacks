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
 const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
 
 
 export async function getAllArticlesDisplay(userEmail: string | null): Promise<{ foryou: Article[]; explore: Article[] }> {
  // Get user email from localStorage
  //const userEmail = localStorage.getItem('user_email');
 
  console.log("inside getAllArticlesDisplay")
  const res = await fetch(`${API_BASE}/articles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "user_email": userEmail || "", // Pass user email in the header
    },
    next: { revalidate: 60 },
  });
 
 
  if (!res.ok) return { foryou: [], explore: [] };
 
 
  console.log("dsffsfds")
  console.log("Explore articles:", res);
 
 
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
  const res = await fetch(`${API_BASE}/articles/${slug}`);
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
 
 
 export async function getArticlesForYou(userEmail: string | null): Promise<Article[]> {
  console.log("inside getArticlesForYou")
  const all = await getAllArticlesDisplay(userEmail);
  const articles = all.foryou
 
 
    // Debugging output
  console.log("Articles for you:", articles);
 
 
  return articles;
 }
 
 
 export async function getArticlesExplore(userEmail: string | null): Promise<Article[]> {
  const all = await getAllArticlesDisplay(userEmail);
  const articles = all.explore
 
 
  console.log("Explore articles:", articles);
  return articles;
 }
 
 
 
 
 // export async function getArticlesByCategory(
 //   category: string
 // ): Promise<Article[]> {
 //   const all = await getAllArticles();
 
 
 //   // log categories
 //   console.log("categories:", all[0].categories);
 
 
 //   return all.filter((article) =>
 //     article.categories.some(
 //       (cat) => cat.toLowerCase() === category.toLowerCase()
 //     )
 //   );
 // }
 
 
 // export async function getFeaturedArticles(): Promise<Article[]> {
 //   // For now, just return the first 2 as featured
 //   const all = await getAllArticles();
 //   return all.slice(0, 3);
 // }
 
 
 // export async function getRecentArticles(count: number = 4): Promise<Article[]> {
 //   const all = await getAllArticles();
 //   return all.slice(0, count);
 // }
 
 
 // export function getRelatedArticles(
 //   currentSlug: string,
 //   count: number = 3
 // ): Article[] {
 //   const currentArticle = getArticleBySlug(currentSlug);
 //   if (!currentArticle) return [];
 
 
 //   return articles
 //     .filter(
 //       (article) =>
 //         article.slug !== currentSlug &&
 //         (article.category === currentArticle.category ||
 //           article.title.includes(currentArticle.title.substring(0, 10)))
 //     )
 //     .slice(0, count);
 // }
 