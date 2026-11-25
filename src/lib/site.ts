export const SITE = {
  name: "The Context",
  tagline: "Daily market moves.\nThe stories behind them.\nAnd the ideas worth understanding.",
  /** Update these in Admin → Settings if your Substack address changes. */
  substackUrl: "https://survivingthe20s.substack.com",
  substackSubscribeUrl: "https://survivingthe20s.substack.com/subscribe",
} as const;

const SETTINGS_KEY = "weekly-wonders-settings";

export type SiteSettings = {
  substackUrl: string;
  substackSubscribeUrl: string;
};

export function loadSettings(): SiteSettings {
  if (typeof window === "undefined") {
    return {
      substackUrl: SITE.substackUrl,
      substackSubscribeUrl: SITE.substackSubscribeUrl,
    };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return {
    substackUrl: SITE.substackUrl,
    substackSubscribeUrl: SITE.substackSubscribeUrl,
  };
}

export function saveSettings(settings: SiteSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
