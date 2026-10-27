import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loadSettings, saveSettings, type SiteSettings } from "@/lib/site";
import { substackProvider } from "@/lib/publishing/substack";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>({
    substackUrl: "",
    substackSubscribeUrl: "",
  });

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="pixel-font text-lg text-ink">Settings</h1>

      <section className="pixel-frame mt-6 p-6">
        <p className="pixel-font text-[10px] text-primary">Account</p>
        <p className="mt-3 text-sm">
          Signed in as <strong>{user?.email}</strong> (site owner).
        </p>
      </section>

      <section className="pixel-frame mt-6 p-6">
        <p className="pixel-font text-[10px] text-primary">Substack connection</p>
        <p className="mt-3 text-sm text-muted-foreground">{substackProvider.statusNote}</p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="pixel-font text-[10px] text-muted-foreground">
              Publication URL
            </span>
            <input
              value={settings.substackUrl}
              onChange={(e) => setSettings({ ...settings, substackUrl: e.target.value })}
              className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="pixel-font text-[10px] text-muted-foreground">
              Subscribe URL
            </span>
            <input
              value={settings.substackSubscribeUrl}
              onChange={(e) =>
                setSettings({ ...settings, substackSubscribeUrl: e.target.value })
              }
              className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <button
            onClick={() => {
              saveSettings(settings);
              toast.success("Saved on this device");
            }}
            className="pixel-frame-sm pixel-lift pixel-font bg-primary px-4 py-2 text-[11px] text-primary-foreground"
          >
            Save
          </button>
        </div>
      </section>

      <section className="pixel-frame mt-6 p-6">
        <p className="pixel-font text-[10px] text-primary">Publishing providers</p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center justify-between gap-4">
            <span>The Context website</span>
            <span className="pixel-font text-[10px] text-primary">Active</span>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Substack</span>
            <span className="pixel-font text-[10px] text-muted-foreground">Export only</span>
          </li>
          <li className="flex items-center justify-between gap-4 text-muted-foreground">
            <span>Medium · LinkedIn · RSS</span>
            <span className="pixel-font text-[10px]">Slot ready</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
