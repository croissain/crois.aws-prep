import { Exam, Question } from "./types";

export const MIN_MULTIPLE_ANSWER = 5;

export const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

/** Splits `total` across weights using the largest-remainder method so the parts always sum to `total`. */
function apportion(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const exact = weights.map(weight => (weight / sum) * total);
  const parts = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest);
  for (let i = 0; parts.reduce((a, b) => a + b, 0) < total; i++) parts[order[i % order.length].index]++;
  return parts;
}

/**
 * Builds a mock exam that follows the exam's domain weighting (by each question's first tag)
 * and contains at least MIN_MULTIPLE_ANSWER multiple-answer questions when the bank has them.
 * Questions whose domain is not listed (e.g. "Architecture Design") fill any domain shortfall.
 */
export function generateMockExam(exam: Exam, pool: Question[]): Question[] {
  const count = Math.min(exam.questionCount, pool.length);
  const shuffled = shuffle(pool);
  const picked = new Set<Question>();
  const domains = exam.domains?.length ? exam.domains : [];
  const domainOf = (q: Question) => domains.findIndex(domain => domain.tag === q.tags[0]);
  const quotas = domains.length ? apportion(count, domains.map(domain => domain.weight)) : [];
  const take = (q: Question) => { picked.add(q); const d = domainOf(q); if (d >= 0) quotas[d]--; };

  // 1. Seed multiple-answer questions, respecting domain quotas where possible.
  const multiples = shuffled.filter(q => q.multiple);
  const minMultiple = Math.min(MIN_MULTIPLE_ANSWER, multiples.length, count);
  for (const q of multiples) {
    if (picked.size >= minMultiple) break;
    const d = domainOf(q);
    if (!domains.length || (d >= 0 && quotas[d] > 0)) take(q);
  }
  for (const q of multiples) { if (picked.size >= minMultiple) break; if (!picked.has(q)) take(q); }

  // 2. Fill each domain up to its quota.
  domains.forEach((_, d) => {
    for (const q of shuffled) { if (quotas[d] <= 0 || picked.size >= count) break; if (!picked.has(q) && domainOf(q) === d) take(q); }
  });

  // 3. Fill any remaining slots (unlisted domains first, then anything).
  for (const q of shuffled) { if (picked.size >= count) break; if (!picked.has(q) && domainOf(q) < 0) take(q); }
  for (const q of shuffled) { if (picked.size >= count) break; if (!picked.has(q)) take(q); }

  return shuffle([...picked]);
}
