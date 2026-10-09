import { createFileRoute, Link, Outlet, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  PenLine,
  FileText,
  FolderCog,
  Settings,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Writing Studio — The Context" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Private writing studio for The Context." },
    ],
  }),
  beforeLoad: async () => {
    // Server-side authorization check: verify admin role before rendering any admin content.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw redirect({ to: "/auth" });
    }

    return { user: data.user };
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/write/$id", label: "Write", icon: PenLine, params: { id: "new" } },
  { to: "/admin/articles", label: "Articles", icon: FileText },
  { to: "/admin/categories", label: "Categories", icon: FolderCog },
  { to: "/admin/subscribers", label: "Subscribers", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!loading && user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="pixel-frame max-w-sm p-8 text-center">
          <h1 className="pixel-font text-sm">Not the owner</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This studio belongs to the The Context owner account.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/auth" });
            }}
            className="pixel-frame-sm pixel-font mt-6 px-4 py-2 text-[11px]"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border bg-paper md:w-60 md:shrink-0 md:border-b-0 md:border-r-2">
        <div className="flex items-center gap-3 p-4">
          <Link to="/" className="pixel-font text-xs text-ink">
            The Context Studio
          </Link>
          <button
            className="pixel-panel ml-auto p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle studio menu"
          >
            <Menu className="size-4" />
          </button>
        </div>

        <nav className={`${open ? "block" : "hidden"} px-3 pb-4 md:block`}>
          <Link
            to="/admin/write/$id"
            params={{ id: "new" }}
            onClick={() => setOpen(false)}
            className="pixel-frame-sm pixel-lift pixel-font mb-4 block bg-accent px-3 py-3 text-center text-[11px] text-accent-foreground"
          >
            + New article
          </Link>
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              params={("params" in item ? item.params : {}) as never}
              activeOptions={{ exact: "exact" in item ? item.exact : false }}
              activeProps={{ className: "bg-ink text-background" }}
              onClick={() => setOpen(false)}
              className="pixel-font flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-accent"
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/" });
            }}
            className="pixel-font mt-4 flex w-full items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
