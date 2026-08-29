import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type NewsItem = {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  category: string;
  relevanceScore: number;
  tags: string[];
  url: string;
};

const inputSchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const getMarketNews = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<{ news: NewsItem[] }> => {
    const { loadMarketNews } = await import("./news/read.server");
    return loadMarketNews(data.category, data.limit);
  });
