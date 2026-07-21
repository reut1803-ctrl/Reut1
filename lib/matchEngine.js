function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// חישוב דמה של אחוז התאמה, יציב לפי המועמד/ת כך שהתוצאה לא "קופצת" בין רינדורים.
export function computeMatchScore(candidate, answers) {
  let score = 55;
  const [minAge, maxAge] = answers.ageRange;
  if (candidate.age >= minAge && candidate.age <= maxAge) score += 12;
  const [minH, maxH] = answers.heightRange;
  if (candidate.height >= minH && candidate.height <= maxH) score += 10;
  if (answers.regions.length === 0 || answers.regions.includes("לא משנה") || answers.regions.includes(candidate.region)) {
    score += 8;
  }
  if (answers.torahLevel === "לא משנה" || candidate.study === answers.torahLevel) score += 6;
  const sharedTraits = candidate.traits.filter((t) => answers.traits.includes(t)).length;
  score += sharedTraits * 4;
  score += hashString(candidate.id) % 7;
  return Math.max(45, Math.min(99, score));
}

export function getMatches(candidates, answers, minScore = 70) {
  return candidates
    .map((c) => ({ ...c, matchScore: computeMatchScore(c, answers) }))
    .filter((c) => c.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}
