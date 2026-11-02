import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Subscriber = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  created_at: string;
};

async function fetchSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("id,email,status,source,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const Route = createFileRoute("/_authenticated/admin/subscribers")({
  head: () => ({
    meta: [
      { title: "Subscribers — The Context Studio" },
      { name: "description", content: "Private newsletter subscriber list for The Context." },
      { property: "og:title", content: "Subscribers — The Context Studio" },
      { property: "og:description", content: "Private newsletter subscriber list for The Context." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubscribersPage,
});

function SubscribersPage() {
  const { data: subscribers = [], isLoading, error } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: fetchSubscribers,
  });
  const activeCount = subscribers.filter((subscriber) => subscriber.status === "active").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-font text-4xl text-ink">Subscribers</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your private newsletter audience.</p>
        </div>
        <div className="pixel-panel flex items-center gap-3 px-4 py-3">
          <Users className="size-4 text-primary" />
          <span className="pixel-font text-[10px]">{activeCount} active</span>
        </div>
      </header>

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Loading…</p> : null}
      {error ? <p className="mt-8 text-sm text-destructive">The subscriber list could not be loaded.</p> : null}

      {!isLoading && !error ? (
        <div className="mt-8 overflow-x-auto border border-border bg-paper">
          <table className="w-full min-w-[620px] text-left">
            <thead className="border-b border-border bg-accent/50">
              <tr className="pixel-font text-[9px] text-muted-foreground">
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Source</th>
                <th className="px-4 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className="px-4 py-3 text-sm text-ink">{subscriber.email}</td>
                  <td className="px-4 py-3">
                    <span className="pixel-font text-[9px] text-primary">{subscriber.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {subscriber.source ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                      new Date(subscriber.created_at),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscribers.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">No subscribers yet.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}