import { supabase } from "@/integrations/supabase/client";
import type { Article, Category } from "./articles";

export async function fetchAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function fetchArticle(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Article | null;
}

export async function createArticle(values: Partial<Article>): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .insert(values as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Article;
}

export async function updateArticle(
  id: string,
  values: Partial<Article>,
): Promise<Article> {
  const { data, error } = await supabase
    .from("articles")
    .update(values as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Article;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Category[];
}
