import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllArticles } from "@/lib/admin-articles";
import { formatDate, STATUS_SHORT } from "@/lib/articles";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: fetchAllArticles,
  });

  const drafts = articles.filter((a) => a.status === "draft");
  const ready = articles.filter((a) => a.status === "ready");
  const published = articles.filter((a) =>
    ["published_web", "exported_substack"].includes(a.status),
  );
  const onSubstack = articles.filter((a) => a.status === "exported_substack");
  const views = articles.reduce((sum, a) => sum + a.view_count, 0);
  const mostRead = [...articles].sort((a, b) => b.view_count - a.view_count)[0];

  const stats = [
    { label: "Total articles", value: articles.length },
    { label: "Drafts", value: drafts.length },
    { label: "Ready", value: ready.length },
    { label: "Published", value: published.length },
    { label: "On Substack", value: onSubstack.length },
    { label: "Total views", value: views },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="pixel-font text-lg text-ink">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Write → preview → save → publish.
          </p>
        </div>
        <Link
          to="/admin/write/$id"
          params={{ id: "new" }}
          className="pixel-frame-sm pixel-lift pixel-font bg-primary px-4 py-3 text-[11px] text-primary-foreground"
        >
          + New article
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="pixel-panel p-4">
            <p className="pixel-font text-xl text-ink">{s.value}</p>
            <p className="pixel-font mt-2 text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {mostRead ? (
        <div className="pixel-frame mt-8 p-6">
          <p className="pixel-font text-[10px] text-primary">Most read</p>
          <h2 className="mt-3 font-serif text-xl">{mostRead.title}</h2>
          <p className="pixel-font mt-2 text-[10px] text-muted-foreground">
            {mostRead.view_count} views · {STATUS_SHORT[mostRead.status]}
          </p>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="pixel-font text-sm">Recent articles</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="mt-4 divide-y-2 divide-ink border border-border bg-paper">
            {articles.slice(0, 8).map((a) => (
              <li key={a.id}>
                <Link
                  to="/admin/write/$id"
                  params={{ id: a.id }}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent"
                >
                  <span className="font-serif text-base">{a.title}</span>
                  <StatusBadge status={a.status} />
                  <span className="pixel-font ml-auto text-[10px] text-muted-foreground">
                    {formatDate(a.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
            {articles.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No articles yet — start your first wonder.
              </li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}
