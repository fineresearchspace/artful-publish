import type { Article } from "@/lib/articles";

/**
 * Generic publishing layer.
 *
 * Every external destination (Substack, Medium, LinkedIn, RSS…) implements
 * this interface, so new destinations can be added without touching the app.
 */
export type PublishResult =
  | { ok: true; externalId?: string; externalUrl?: string; message: string }
  | { ok: false; error: string };

export type ProviderCapabilities = {
  /** True only when the platform exposes an official, documented publishing API. */
  canPublish: boolean;
  canUpdate: boolean;
  canSync: boolean;
  /** Manual copy/export fallback is always available. */
  canExport: boolean;
};

export interface PublishingProvider {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  /** Human-readable explanation of the current integration status. */
  statusNote: string;
  createPost?(article: Article): Promise<PublishResult>;
  updatePost?(article: Article): Promise<PublishResult>;
  publishPost?(article: Article): Promise<PublishResult>;
  getPost?(externalId: string): Promise<PublishResult>;
  syncPosts?(): Promise<PublishResult>;
  /** Always implemented: produce paste-ready output for the platform. */
  exportPost(article: Article): {
    markdown: string;
    html: string;
    title: string;
    subtitle: string;
    excerpt: string;
    tags: string;
  };
}
