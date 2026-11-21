import { TriangleAlert } from "lucide-react";
import { QuestionReview } from "@/lib/types";
import { RichText } from "@/components/RichText";

const titles: Record<QuestionReview["flag"], string> = {
  disputed: "Answer key may be wrong. Double-check.",
  uncertain: "Outdated or debatable question. Double-check."
};

const badges: Record<QuestionReview["flag"], string> = {
  disputed: "Key disputed",
  uncertain: "Outdated / debatable"
};

const levels: Record<QuestionReview["confidence"], number> = { low: 1, medium: 2, high: 3 };

/** Small chip shown before the answer is revealed. It says the question is flagged without giving away the answer. */
export function ReviewBadge({ review }: { review: QuestionReview }) {
  return <span title="Flagged by an AI audit. Verify against the AWS docs." className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-700 dark:text-amber-300"><TriangleAlert size={11}/>{badges[review.flag]}</span>;
}

/** Signal-bar meter: 1 to 3 filled bars for low, medium and high confidence. */
export function ConfidenceMeter({ confidence }: { confidence: QuestionReview["confidence"] }) {
  const filled = levels[confidence];
  const label = `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
  return <span title={label} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 align-middle text-amber-700 dark:text-amber-300">
    <svg viewBox="0 0 18 14" width="24" height="18" aria-hidden="true">
      {[0, 1, 2].map(i => <rect key={i} x={i * 6.5} y={9 - i * 4.5} width="4.5" height={5 + i * 4.5} rx="1.2" fill="currentColor" opacity={i < filled ? 1 : 0.22}/>)}
    </svg>
    <span className="text-xs font-medium">{label}</span>
  </span>;
}

const letters = (ids: string[]) => ids.map(id => <kbd key={id} className="mx-0.5 inline-grid min-w-6 place-items-center rounded-md border border-black/15 bg-white/70 px-1.5 font-mono text-xs font-semibold not-italic dark:border-white/15 dark:bg-white/10">{id.toUpperCase()}</kbd>);

/** Full AI audit notice, shown after the answer is revealed. */
export function ReviewNotice({ review, keyIds }: { review: QuestionReview; keyIds: string[] }) {
  return <div role="note" className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/[.07] p-4 text-sm leading-7 text-black/75 sm:p-5 dark:text-white/75">
    <div className="flex items-center gap-2 text-[15px] font-semibold text-amber-700 dark:text-amber-300"><TriangleAlert size={17}/>{titles[review.flag]}</div>
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="flex items-center gap-1"><span className="mr-1 text-black/50 dark:text-white/50">Answer key</span>{letters(keyIds)}</span>
      <span className="flex items-center gap-1"><span className="mr-1 text-black/50 dark:text-white/50">AI answer</span>{letters(review.aiAnswer)}<span className="ml-1.5"><ConfidenceMeter confidence={review.confidence}/></span></span>
    </div>
    {review.note && <div className="rich mt-3"><RichText text={review.note} kind="explanation"/></div>}
    {review.aiExplanation && <div className="mt-4 border-t border-amber-500/20 pt-4"><b className="mb-2 block text-xs uppercase tracking-[.14em] text-amber-700 dark:text-amber-300">AI explanation</b><div className="rich"><RichText text={review.aiExplanation} kind="explanation"/></div></div>}
    <p className="mt-3 text-xs text-black/45 dark:text-white/45">AI-generated. It can be wrong too, so verify against the AWS docs.</p>
  </div>;
}
