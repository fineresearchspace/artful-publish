import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Article, Category } from "./articles";
import { ARTICLE_LIST_FIELDS } from "./articles";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Input validation schemas
const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export type ArticleListItem = Omit<Article, "content" | "created_at" | "substack_post_id">;

export const listPublishedArticles = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ articles: ArticleListItem[]; categories: Category[] }> => {
    const supabase = publicClient();
    const [articlesRes, categoriesRes] = await Promise.all([
      supabase
        .from("articles")
        .select(ARTICLE_LIST_FIELDS)
        .in("status", ["published_web", "exported_substack"])
        .order("published_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

    return {
      articles: (articlesRes.data ?? []) as unknown as ArticleListItem[],
      categories: (categoriesRes.data ?? []) as unknown as Category[],
    };
  },
);

export const getPublishedArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    // Validate input with Zod before processing
    return slugSchema.parse(data.slug);
  })
  .handler(
    async ({ data }): Promise<{ article: Article | null; related: ArticleListItem[] }> => {
      const supabase = publicClient();
      const { data: article } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", data)
        .in("status", ["published_web", "exported_substack"])
        .maybeSingle();

      if (!article) return { article: null, related: [] };

      const { data: related } = await supabase
        .from("articles")
        .select(ARTICLE_LIST_FIELDS)
        .in("status", ["published_web", "exported_substack"])
        .eq("category", (article as Article).category)
        .neq("slug", data)
        .order("published_at", { ascending: false })
        .limit(3);

      return {
        article: article as unknown as Article,
        related: (related ?? []) as unknown as ArticleListItem[],
      };
    },
  );

export const registerArticleView = createServerFn({ method: "POST" })
  .inputValidator((data: { slug: string }) => {
    return slugSchema.parse(data.slug);
  })
  .handler(async ({ data }) => {
    const supabase = publicClient();
    await supabase.rpc("increment_article_view", { _slug: data });
    return { ok: true };
  });