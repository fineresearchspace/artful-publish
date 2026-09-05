import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Save, Upload, Star } from "lucide-react";
import {
  createArticle,
  fetchArticle,
  fetchCategories,
  updateArticle,
} from "@/lib/admin-articles";
import {
  estimateReadingTime,
  formatDate,
  slugify,
  STATUS_LABELS,
  type Article,
  type ArticleStatus,
} from "@/lib/articles";
import { Markdown, renderMarkdown } from "@/components/Markdown";
import { PixelArt, PIXEL_ART_KEYS, PIXEL_ART_LABELS } from "@/components/PixelArt";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RichEditor } from "@/components/admin/RichEditor";
import { SubstackPanel } from "@/components/admin/SubstackPanel";


export const Route = createFileRoute("/_authenticated/admin/write/$id")({
  component: WritePage,
});

type Draft = Partial<Article>;

const EMPTY: Draft = {
  title: "",
  subtitle: "",
  excerpt: "",
  content: "",
  category: "Ideas",
  tags: [],
  status: "draft",
  pixel_art_image: "chart",
  reading_time: 1,
  featured: false,
};

function WritePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [articleId, setArticleId] = useState<string | null>(isNew ? null : id);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [substackOpen, setSubstackOpen] = useState(false);

  const dirtyRef = useRef(false);


  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: loaded } = useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchArticle(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (loaded) {
      setDraft(loaded);
      setArticleId(loaded.id);
      setTagInput((loaded.tags ?? []).join(", "));
    }
  }, [loaded]);

  const set = useCallback((patch: Draft) => {
    dirtyRef.current = true;
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const payload = useMemo(() => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      title: draft.title?.trim() || "Untitled",
      slug: draft.slug?.trim() || slugify(draft.title || `untitled-${Date.now()}`),
      subtitle: draft.subtitle ?? "",
      excerpt: draft.excerpt ?? "",
      content: draft.content ?? "",
      cover_image: draft.cover_image || null,
      pixel_art_image: draft.pixel_art_image ?? "chart",
      category: draft.category ?? "Ideas",
      tags,
      status: (draft.status ?? "draft") as ArticleStatus,
      reading_time: draft.reading_time || estimateReadingTime(draft.content ?? ""),
      featured: draft.featured ?? false,
      published_at: draft.published_at ?? null,
      substack_url: draft.substack_url || null,
    };
  }, [draft, tagInput]);

  const save = useCallback(
    async (extra: Partial<Article> = {}, options: { silent?: boolean } = {}) => {
      setSaving(true);
      try {
        const values = { ...payload, ...extra };
        let saved: Article;
        if (articleId) {
          saved = await updateArticle(articleId, values);
        } else {
          saved = await createArticle(values);
          setArticleId(saved.id);
          void navigate({
            to: "/admin/write/$id",
            params: { id: saved.id },
            replace: true,
          });
        }
        setDraft(saved);
        setTagInput((saved.tags ?? []).join(", "));
        setLastSaved(new Date().toLocaleTimeString());
        dirtyRef.current = false;
        void queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
        if (!options.silent) toast.success("Saved");
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Save failed";
        toast.error(message);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [payload, articleId, navigate, queryClient],
  );

  // Autosave every 20s while there are unsaved changes and a title exists.
  useEffect(() => {
    const timer = setInterval(() => {
      if (dirtyRef.current && (draft.title ?? "").trim().length > 2) {
        void save({}, { silent: true }).catch(() => undefined);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [save, draft.title]);

  async function setStatus(status: ArticleStatus) {
    setPublishError(null);
    try {
      const extra: Partial<Article> = { status };
      if (
        (status === "published_web" || status === "exported_substack") &&
        !draft.published_at
      ) {
        extra.published_at = new Date().toISOString();
      }
      await save(extra);
      toast.success(`Status: ${STATUS_LABELS[status]}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setPublishError(message);
      if (articleId) {
        await updateArticle(articleId, { status: "failed" }).catch(() => undefined);
        setDraft((d) => ({ ...d, status: "failed" }));
      }
      return false;
    }
  }

  async function publishEverywhere() {
    const ok = await setStatus("published_web");
    if (ok) setSubstackOpen(true);
  }


  const editorHtml = useMemo(() => renderMarkdown(draft.content ?? ""), [draft.content]);


  const status = (draft.status ?? "draft") as ArticleStatus;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="pixel-font text-lg text-ink">{isNew ? "Write" : "Edit"}</h1>
        <StatusBadge status={status} />
        {lastSaved ? (
          <span className="pixel-font text-[9px] text-muted-foreground">
            Autosaved {lastSaved}
          </span>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="pixel-frame-sm pixel-lift pixel-font flex items-center gap-2 bg-paper px-3 py-2 text-[11px]"
          >
            <Eye className="size-3.5" /> {showPreview ? "Editor" : "Preview"}
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="pixel-frame-sm pixel-lift pixel-font flex items-center gap-2 bg-paper px-3 py-2 text-[11px] disabled:opacity-60"
          >
            <Save className="size-3.5" /> Save draft
          </button>
          <button
            onClick={() => void setStatus("published_web")}
            className="pixel-frame-sm pixel-lift pixel-font flex items-center gap-2 bg-paper px-3 py-2 text-[11px]"
          >
            <Upload className="size-3.5" /> Website only
          </button>
          <button
            onClick={() => void publishEverywhere()}
            className="pixel-frame-sm pixel-lift pixel-font flex items-center gap-2 bg-primary px-3 py-2 text-[11px] text-primary-foreground"
          >
            <Send className="size-3.5" /> Publish everywhere
          </button>

        </div>
      </header>

      {publishError ? (
        <div className="pixel-frame-sm mt-4 bg-paper border-destructive bg-destructive/10 p-4 text-sm">
          <p className="pixel-font text-[10px] text-destructive">Publishing failed</p>
          <p className="mt-2">{publishError}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="min-w-0">
          <input
            value={draft.title ?? ""}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Article title"
            className="w-full border border-border bg-paper px-4 py-3 font-serif text-2xl outline-none focus:border-primary"
          />
          <input
            value={draft.subtitle ?? ""}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="Subtitle / deck"
            className="mt-3 w-full border border-border bg-paper px-4 py-2 font-serif text-lg outline-none focus:border-primary"
          />
          <textarea
            value={draft.excerpt ?? ""}
            onChange={(e) => set({ excerpt: e.target.value })}
            placeholder="Short excerpt shown on cards and in previews"
            rows={2}
            className="mt-3 w-full border border-border bg-paper px-4 py-2 text-sm outline-none focus:border-primary"
          />

          {showPreview ? (
            <div className="pixel-frame mt-4 p-6">
              <p className="pixel-font text-[10px] text-primary">
                Live preview — exactly as it appears on the site
              </p>
              <h2 className="mt-4 font-serif text-3xl">{draft.title || "Untitled"}</h2>
              {draft.subtitle ? (
                <p className="mt-2 font-serif text-lg text-muted-foreground">
                  {draft.subtitle}
                </p>
              ) : null}
              <p className="pixel-font mt-3 text-[10px] text-muted-foreground">
                {draft.category} ·{" "}
                {draft.reading_time || estimateReadingTime(draft.content ?? "")} min read ·{" "}
                {formatDate(draft.published_at ?? new Date().toISOString())}
              </p>
              <div className="crt pixel-panel mt-5 aspect-[16/7] overflow-hidden">
                {draft.cover_image ? (
                  <img
                    src={draft.cover_image}
                    alt=""
                    className="pixelated size-full object-cover"
                  />
                ) : (
                  <PixelArt variant={draft.pixel_art_image ?? "chart"} className="size-full" />
                )}
              </div>
              <Markdown content={draft.content ?? ""} className="mt-6" />
            </div>
          ) : (
            <div className="mt-4">
              <RichEditor
                content={editorHtml}
                onChange={(html) => set({ content: html })}
              />
              <p className="pixel-font mt-2 text-[9px] text-muted-foreground">
                Rich text mode · {estimateReadingTime(draft.content ?? "")} min read estimate
              </p>
            </div>

          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="pixel-panel space-y-3 p-4">
            <p className="pixel-font text-[10px] text-primary">Article details</p>

            <label className="block">
              <span className="pixel-font text-[9px] text-muted-foreground">Category</span>
              <select
                value={draft.category ?? "Ideas"}
                onChange={(e) => set({ category: e.target.value })}
                className="mt-1 w-full border border-border bg-paper px-2 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="pixel-font text-[9px] text-muted-foreground">Slug</span>
              <input
                value={draft.slug ?? ""}
                onChange={(e) => set({ slug: slugify(e.target.value) })}
                placeholder={slugify(draft.title ?? "")}
                className="mt-1 w-full border border-border bg-paper px-2 py-1.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="pixel-font text-[9px] text-muted-foreground">
                Tags (comma separated)
              </span>
              <input
                value={tagInput}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setTagInput(e.target.value);
                }}
                className="mt-1 w-full border border-border bg-paper px-2 py-1.5 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="pixel-font text-[9px] text-muted-foreground">Read (min)</span>
                <input
                  type="number"
                  min={1}
                  value={draft.reading_time ?? 1}
                  onChange={(e) => set({ reading_time: Number(e.target.value) })}
                  className="mt-1 w-full border border-border bg-paper px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="pixel-font text-[9px] text-muted-foreground">Publish date</span>
                <input
                  type="date"
                  value={draft.published_at ? draft.published_at.slice(0, 10) : ""}
                  onChange={(e) =>
                    set({
                      published_at: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                  className="mt-1 w-full border border-border bg-paper px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => set({ featured: !draft.featured })}
              className={`pixel-font flex w-full items-center justify-center gap-2 border border-border px-3 py-2 text-[10px] ${
                draft.featured ? "bg-accent text-accent-foreground" : "bg-paper"
              }`}
            >
              <Star className="size-3.5" /> {draft.featured ? "Featured wonder" : "Mark featured"}
            </button>
          </div>

          <div className="pixel-panel space-y-3 p-4">
            <p className="pixel-font text-[10px] text-primary">Artwork</p>
            <label className="block">
              <span className="pixel-font text-[9px] text-muted-foreground">
                Cover image URL (optional)
              </span>
              <input
                value={draft.cover_image ?? ""}
                onChange={(e) => set({ cover_image: e.target.value })}
                placeholder="https://…"
                className="mt-1 w-full border border-border bg-paper px-2 py-1.5 text-sm"
              />
            </label>
            <span className="pixel-font text-[9px] text-muted-foreground">
              Pixel illustration
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PIXEL_ART_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  title={PIXEL_ART_LABELS[key]}
                  onClick={() => set({ pixel_art_image: key })}
                  className={`border-2 p-1 ${
                    draft.pixel_art_image === key ? "border-primary" : "border-border"
                  }`}
                >
                  <PixelArt variant={key} className="aspect-square w-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-panel space-y-2 p-4">
            <p className="pixel-font text-[10px] text-primary">Publishing status</p>
            {(
              ["draft", "ready", "published_web", "exported_substack"] as ArticleStatus[]
            ).map((s) => (
              <button
                key={s}
                onClick={() => void setStatus(s)}
                className={`pixel-font block w-full border border-border px-3 py-2 text-left text-[10px] ${
                  status === s ? "bg-ink text-background" : "bg-paper hover:bg-accent"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
            <label className="block pt-2">
              <span className="pixel-font text-[9px] text-muted-foreground">
                Substack URL (once posted)
              </span>
              <input
                value={draft.substack_url ?? ""}
                onChange={(e) => set({ substack_url: e.target.value })}
                placeholder="https://…substack.com/p/…"
                className="mt-1 w-full border border-border bg-paper px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <SubstackPanel
            draft={{ ...(payload as Article), id: articleId ?? "" }}
            onSent={() => void setStatus("exported_substack")}
          />

        </aside>
      </div>
    </div>
  );
}