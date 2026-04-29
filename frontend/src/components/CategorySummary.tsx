import type { Expense } from "../types";

type CategorySummaryProps = {
  expenses: Expense[];
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function CategorySummary({ expenses }: CategorySummaryProps) {
  const grouped = expenses.reduce<Map<string, number>>((accumulator, expense) => {
    const current = accumulator.get(expense.category) ?? 0;
    accumulator.set(expense.category, current + Number(expense.amount));
    return accumulator;
  }, new Map());

  const rows = [...grouped.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([category, amount]) => ({
      category,
      amount,
    }));

  if (!rows.length) {
    return null;
  }

  return (
    <section className="mb-6 border-[1.5px] border-ink bg-[#fafaf8] px-6 py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-[#7a7870]">
            Summary View
          </div>
          <h2 className="mt-1 font-display text-[28px] tracking-[0.08em] text-ink">
            Totals By Category
          </h2>
        </div>
        <div className="text-[11px] tracking-[0.08em] text-[#7a7870]">
          {rows.length} {rows.length === 1 ? "category" : "categories"}
        </div>
      </div>

      <div className="grid gap-px border-[1.5px] border-ink bg-ink/15 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.category} className="bg-[#f2efe7] px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#7a7870]">
              {row.category}
            </div>
            <div className="mt-2 font-display text-[24px] tracking-[0.06em] text-[#e8712a]">
              &#8377;{currencyFormatter.format(row.amount)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
