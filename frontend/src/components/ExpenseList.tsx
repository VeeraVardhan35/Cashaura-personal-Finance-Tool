import type { Expense } from "../types";

type ExpenseListProps = {
  expenses: Expense[];
  loading: boolean;
  emptyMessage?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function LoadingState() {
  return (
    <div className="border-[1.5px] border-ink px-6 py-16 text-center text-[#7a7870]">
      <div className="font-display text-[36px] tracking-[0.2em] text-ink">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse [animation-delay:150ms]">.</span>
        <span className="animate-pulse [animation-delay:300ms]">.</span>
      </div>
      <div className="mt-2 text-[11px] tracking-[0.18em]">Loading your expenses</div>
    </div>
  );
}

export function ExpenseList({
  expenses,
  loading,
  emptyMessage = "Nothing here yet. Add your first expense on the left.",
}: ExpenseListProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (!expenses.length) {
    return (
      <div className="border-[1.5px] border-ink px-6 py-16 text-center text-[#7a7870]">
        <div className="font-display text-[36px] tracking-[0.12em] text-ink">NO ENTRIES</div>
        <div className="mt-2 text-[11px] leading-7 tracking-[0.18em]">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {expenses.map((expense) => (
        <article
          key={expense.id}
          className="-m-px border-[1.5px] border-ink bg-[#f2efe7] p-5 transition-colors duration-150 hover:bg-[#fafaf8]"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#7a7870]">
              {expense.category}
            </span>
            <span className="font-display text-[22px] tracking-[0.05em] text-[#e8712a]">
              &#8377;{currencyFormatter.format(Number(expense.amount))}
            </span>
          </div>

          <div className="mb-3 text-[12px] leading-6 text-ink italic">
            "{expense.description || "No description."}"
          </div>

          <div className="text-[10px] uppercase tracking-[0.2em] text-[#7a7870]">
            {dateFormatter.format(new Date(`${expense.date}T00:00:00`))}
          </div>
        </article>
      ))}
    </div>
  );
}
