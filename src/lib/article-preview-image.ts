/** Prefer the selected cover, then the first photo already in the article. */
export function articlePreviewImage(cover: string | null | undefined, content = ""): string | null {
  const htmlImage = content.match(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  const markdownImage = content.match(/!\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+["'][^"']*["'])?\s*\)/);
  const source = cover?.trim() || htmlImage?.[1] || htmlImage?.[2] || htmlImage?.[3] || markdownImage?.[1];
  if (!source) return null;
  const decoded = source.replace(/&amp;/g, "&");
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  try {
    const url = new URL(decoded);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // Legacy editor images used expiring signed links for this now-public bucket.
    if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/sign/article-images/")) {
      url.pathname = url.pathname.replace("/object/sign/", "/object/public/");
      url.search = "";
    }
    return url.toString();
  } catch {
    return null;
  }
}