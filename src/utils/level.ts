export const LEVELS = [
  { name: "Semilla Verde", threshold: 0 },
  { name: "Guardian Verde", threshold: 500 },
  { name: "Defensor Ambiental", threshold: 2000 },
  { name: "Heroe Ecologico", threshold: 5000 },
] as const;

export function getLevelProgress(points: number) {
  let currentIndex = 0;

  for (let index = 0; index < LEVELS.length; index += 1) {
    if (points >= LEVELS[index].threshold) {
      currentIndex = index;
    }
  }

  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1];

  if (!next) {
    return {
      current,
      next: null,
      progress: 1,
      pointsToNext: 0,
      levelNumber: currentIndex + 1,
    };
  }

  const span = next.threshold - current.threshold;
  const progress = Math.min(1, Math.max(0, (points - current.threshold) / span));

  return {
    current,
    next,
    progress,
    pointsToNext: Math.max(0, next.threshold - points),
    levelNumber: currentIndex + 1,
  };
}
