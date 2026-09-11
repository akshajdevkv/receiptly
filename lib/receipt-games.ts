export type GameItem = { name: string; quantity: number; price: number };

export function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function pickDifferentItem(items: GameItem[], previousName?: string): GameItem | null {
  const eligible = items.filter((item) => item.name.trim());
  if (!eligible.length) return null;
  const alternatives = eligible.filter((item) => item.name !== previousName);
  const pool = alternatives.length ? alternatives : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildMissingOptions(correct: string, candidateNames: string[], count = 4): string[] {
  const normalizedCorrect = correct.trim().toLocaleLowerCase();
  const unique = [...new Map(candidateNames
    .filter((name) => name.trim() && name.trim().toLocaleLowerCase() !== normalizedCorrect)
    .map((name) => [name.trim().toLocaleLowerCase(), name.trim()])).values()];
  return shuffle([correct, ...shuffle(unique).slice(0, Math.max(2, count - 1))]);
}

function currencyDecimals(currency: string): number {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions().maximumFractionDigits; }
  catch { return 2; }
}

export function buildPriceOptions(price: number, currency: string, count = 4): number[] {
  if (!Number.isFinite(price) || price < 0) return [];
  const decimals = Math.max(currencyDecimals(currency || "USD"), String(price).split(".")[1]?.length || 0);
  const factor = 10 ** Math.min(decimals, 3);
  const round = (value: number) => Math.round(value * factor) / factor;
  const baseStep = price < 1 ? 0.05 : price < 10 ? 0.5 : price < 100 ? 5 : price < 1000 ? 10 : 50;
  const proportionalStep = Math.max(baseStep, round(price * 0.08));
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, -1.5, 1.5, -0.5, 0.5]);
  const options = new Set<number>([round(price)]);
  for (const offset of offsets) {
    if (options.size >= count) break;
    const candidate = round(price + proportionalStep * offset);
    if (candidate >= 0) options.add(candidate);
  }
  for (let multiplier = 1; options.size < count && multiplier < 10; multiplier++) {
    options.add(round(price + proportionalStep * multiplier));
  }
  return shuffle([...options].slice(0, count));
}
