import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { PixelArt } from "@/components/PixelArt";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio sign in — Weekly Wonders" },
      { name: "description", content: "Sign in to the Weekly Wonders writing studio." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Studio sign in — Weekly Wonders" },
      { property: "og:description", content: "Private writing studio for Weekly Wonders." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/admin" });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="pixel-font text-[10px] text-muted-foreground">
          ← Weekly Wonders
        </Link>

        <div className="pixel-frame mt-4 p-8">
          <PixelArt variant="newspaper" className="size-12 border border-border" />
          <h1 className="display-font mt-6 text-3xl text-ink">Writing Studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Private workspace. Only the site owner can publish.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-border bg-paper px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-border bg-paper px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="pixel-frame-sm pixel-lift pixel-font w-full bg-primary px-4 py-3 text-[11px] text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <button
            type="button"
            onClick={onGoogle}
            className="pixel-frame-sm pixel-lift pixel-font mt-3 w-full bg-paper px-4 py-3 text-[11px]"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "First time here? Create the owner account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
