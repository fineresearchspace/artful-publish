import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, CheckCircle2, Layers3, Target, WalletCards } from "lucide-react";
import { ArticleCard } from "@/components/site/ArticleCard";
import { SiteShell } from "@/components/site/SiteShell";
import { listPublishedCfaArticles } from "@/lib/public-articles.functions";

const CFA_TOPICS = [
  {
    title: "Start with the basics",
    description: "Understand what the CFA Program covers, who it is for, and what each level expects.",
    icon: BookOpen,
  },
  {
    title: "Know the three levels",
    description: "Build from investment tools at Level I to analysis at Level II and portfolio decisions at Level III.",
    icon: Layers3,
  },
  {
    title: "Plan your study time",
    description: "Turn the curriculum into a realistic weekly plan with revision and practice built in.",
    icon: CalendarDays,
  },
  {
    title: "Learn the curriculum",
    description: "Get clear explanations of ethics, economics, financial statements, valuation and portfolio management.",
    icon: Target,
  },
  {
    title: "Prepare to register",
    description: "Review eligibility, exam windows, fees and the practical steps to register before committing.",
    icon: WalletCards,
  },
  {
    title: "Be ready for exam day",
    description: "Use mock exams, review weak areas and know what to expect at the test centre.",
    icon: CheckCircle2,
  },
] as const;

async function loadCfaArticles() {
  try {
    return await listPublishedCfaArticles();
  } catch (error) {
    console.error("CFA Exam articles request failed", error);
    return { articles: [] };
  }
}

export const Route = createFileRoute("/cfa-exam")({
  loader: loadCfaArticles,
  head: () => ({
    meta: [
      { title: "CFA Exam Guide & Articles — The Context" },
      {
        name: "description",
        content:
          "Clear CFA exam guides covering the basics, three levels, curriculum, registration, study planning and exam-day preparation.",
      },
      { property: "og:title", content: "CFA Exam Guide & Articles — The Context" },
      {
        property: "og:description",
        content: "Understand the CFA exam and prepare with practical, focused guidance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/cfa-exam" }],
  }),
  component: CfaExamPage,
});

function CfaExamPage() {
  const { articles } = Route.useLoaderData();

  return (
    <SiteShell>
      <section className="border-b border-border bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-editorial-ui text-[11px] font-semibold uppercase text-primary">
            CFA Exam
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <h1 className="display-font max-w-3xl text-5xl leading-none text-ink sm:text-7xl">
              The CFA journey,
              <br />
              <span className="italic text-primary">made clearer.</span>
            </h1>
            <p className="max-w-xl font-serif text-xl leading-relaxed text-muted-foreground">
              Practical articles for understanding the exam, choosing your study approach and
              building the foundations you need before test day.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-editorial-ui text-[11px] font-semibold uppercase text-primary">
              Where to begin
            </p>
            <h2 className="display-font mt-2 text-3xl text-ink sm:text-4xl">
              What you need to know
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            A simple map of the decisions and subjects every new CFA candidate meets.
          </p>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {CFA_TOPICS.map(({ title, description, icon: Icon }, index) => (
            <article key={title} className="min-h-52 bg-paper p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span className="font-editorial-ui text-[10px] font-semibold text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="font-serif mt-8 text-xl text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-editorial-ui text-[11px] font-semibold uppercase text-primary">
                CFA Exam blog
              </p>
              <h2 className="display-font mt-2 text-3xl text-ink sm:text-4xl">
                Guides for candidates
              </h2>
            </div>
            <Link to="/articles" className="text-sm font-semibold text-primary hover:underline">
              Browse all articles →
            </Link>
          </div>

          {articles.length ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border-l-2 border-primary py-3 pl-5">
              <p className="font-serif text-xl text-ink">The first CFA Exam guide is coming soon.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New articles published under the CFA Exam category will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}