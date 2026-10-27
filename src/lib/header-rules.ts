export function shouldCollapseHeader(scrollY: number) {
  return scrollY > 100;
}

export function yieldChangePercent(current: number | undefined, changeBps: number | null | undefined) {
  if (current === undefined || !Number.isFinite(current) || changeBps == null || !Number.isFinite(changeBps)) return null;
  const previous = current - changeBps / 100;
  return previous > 0 ? (current - previous) / previous * 100 : null;
}