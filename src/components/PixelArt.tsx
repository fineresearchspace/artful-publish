type Rect = { x: number; y: number; w?: number; h?: number; c: string };

export const PIXEL_ART_KEYS = [
  "chart",
  "newspaper",
  "portfolio",
  "thinking",
  "office",
  "coin",
] as const;

export type PixelArtKey = (typeof PIXEL_ART_KEYS)[number];

export const PIXEL_ART_LABELS: Record<PixelArtKey, string> = {
  chart: "Stock chart",
  newspaper: "Newspaper",
  portfolio: "Portfolio",
  thinking: "Person thinking",
  office: "Office building",
  coin: "Coin stack",
};

const INK = "var(--ink)";
const GREEN = "var(--primary)";
const YELLOW = "var(--accent)";
const PAPER = "var(--paper)";
const GREY = "var(--muted-foreground)";

function bars(values: number[], color: string, xStart = 2): Rect[] {
  return values.map((v, i) => ({
    x: xStart + i * 2,
    y: 15 - v,
    w: 1,
    h: v,
    c: color,
  }));
}

const SCENES: Record<PixelArtKey, Rect[]> = {
  chart: [
    ...bars([3, 5, 4, 7, 6, 9, 11], GREEN),
    { x: 2, y: 15, w: 13, h: 1, c: INK },
    { x: 1, y: 3, w: 1, h: 12, c: INK },
    { x: 4, y: 10, c: YELLOW },
    { x: 6, y: 8, c: YELLOW },
    { x: 8, y: 9, c: YELLOW },
    { x: 10, y: 6, c: YELLOW },
    { x: 12, y: 4, c: YELLOW },
    { x: 13, y: 3, c: INK },
    { x: 14, y: 2, c: INK },
  ],
  newspaper: [
    { x: 2, y: 2, w: 12, h: 12, c: PAPER },
    { x: 2, y: 2, w: 12, h: 1, c: INK },
    { x: 2, y: 13, w: 12, h: 1, c: INK },
    { x: 2, y: 2, w: 1, h: 12, c: INK },
    { x: 13, y: 2, w: 1, h: 12, c: INK },
    { x: 4, y: 4, w: 8, h: 1, c: INK },
    { x: 4, y: 6, w: 4, h: 3, c: GREEN },
    { x: 9, y: 6, w: 3, h: 1, c: GREY },
    { x: 9, y: 8, w: 3, h: 1, c: GREY },
    { x: 4, y: 10, w: 8, h: 1, c: GREY },
    { x: 4, y: 11, w: 6, h: 1, c: GREY },
  ],
  portfolio: [
    { x: 2, y: 5, w: 12, h: 9, c: PAPER },
    { x: 2, y: 5, w: 12, h: 1, c: INK },
    { x: 2, y: 13, w: 12, h: 1, c: INK },
    { x: 2, y: 5, w: 1, h: 9, c: INK },
    { x: 13, y: 5, w: 1, h: 9, c: INK },
    { x: 6, y: 3, w: 4, h: 2, c: INK },
    { x: 4, y: 8, w: 3, h: 3, c: GREEN },
    { x: 8, y: 8, w: 2, h: 3, c: YELLOW },
    { x: 11, y: 9, w: 1, h: 2, c: GREY },
  ],
  thinking: [
    { x: 5, y: 7, w: 6, h: 6, c: GREEN },
    { x: 5, y: 6, w: 6, h: 1, c: INK },
    { x: 4, y: 7, w: 1, h: 7, c: INK },
    { x: 11, y: 7, w: 1, h: 7, c: INK },
    { x: 6, y: 9, c: PAPER },
    { x: 9, y: 9, c: PAPER },
    { x: 6, y: 11, w: 4, h: 1, c: INK },
    { x: 11, y: 4, c: INK },
    { x: 12, y: 2, w: 2, h: 2, c: YELLOW },
    { x: 13, y: 1, c: INK },
  ],
  office: [
    { x: 2, y: 6, w: 5, h: 8, c: GREY },
    { x: 8, y: 3, w: 6, h: 11, c: GREEN },
    { x: 2, y: 14, w: 12, h: 1, c: INK },
    { x: 3, y: 8, c: YELLOW },
    { x: 5, y: 8, c: PAPER },
    { x: 3, y: 11, c: PAPER },
    { x: 5, y: 11, c: YELLOW },
    { x: 9, y: 5, c: YELLOW },
    { x: 12, y: 5, c: PAPER },
    { x: 9, y: 8, c: PAPER },
    { x: 12, y: 8, c: YELLOW },
    { x: 9, y: 11, c: YELLOW },
    { x: 12, y: 11, c: PAPER },
  ],
  coin: [
    { x: 4, y: 11, w: 8, h: 2, c: YELLOW },
    { x: 4, y: 11, w: 8, h: 1, c: INK },
    { x: 5, y: 8, w: 7, h: 2, c: YELLOW },
    { x: 5, y: 8, w: 7, h: 1, c: INK },
    { x: 6, y: 5, w: 6, h: 2, c: YELLOW },
    { x: 6, y: 5, w: 6, h: 1, c: INK },
    { x: 8, y: 2, w: 2, h: 2, c: GREEN },
    { x: 4, y: 13, w: 8, h: 1, c: INK },
  ],
};

export function PixelArt({
  variant = "chart",
  className = "",
}: {
  variant?: string;
  className?: string;
}) {
  const key = (PIXEL_ART_KEYS as readonly string[]).includes(variant)
    ? (variant as PixelArtKey)
    : "chart";
  const rects = SCENES[key];

  return (
    <svg
      viewBox="0 0 16 16"
      role="img"
      aria-label={PIXEL_ART_LABELS[key]}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width="16" height="16" fill="var(--muted)" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={i * 2}
          y={0}
          width={1}
          height={16}
          fill="color-mix(in oklab, var(--ink) 4%, transparent)"
        />
      ))}
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w ?? 1}
          height={r.h ?? 1}
          fill={r.c}
        />
      ))}
    </svg>
  );
}
