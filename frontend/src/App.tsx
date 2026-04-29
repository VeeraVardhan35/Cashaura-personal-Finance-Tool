import { CategorySummary } from "./components/CategorySummary";
import { ExpenseFilter } from "./components/ExpenseFilter";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { TotalBar } from "./components/TotalBar";
import { useExpenses } from "./hooks/useExpenses";

export default function App() {
  const {
    expenses,
    allExpenses,
    total,
    loading,
    loadingMessage,
    error,
    category,
    sort,
    categories,
    setCategory,
    setSort,
    reload,
  } = useExpenses();

  return (
    <div className="min-h-screen bg-[#f2efe7] text-ink">
      <nav className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b-[1.5px] border-ink bg-[#f2efe7] px-4 sm:px-8">
        <div className="font-display text-[22px] tracking-[0.18em]">CASHAURA</div>
        <div className="border-[1.5px] border-ink px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-[#d94f3a]">
          PERSONAL FINANCE
        </div>
      </nav>

      <header className="border-b-[1.5px] border-ink px-4 py-16 text-center sm:px-8 sm:py-20">
        <div className="text-[11px] uppercase tracking-[0.4em] text-[#d94f3a]">Cashaura Money Log</div>
        <h1 className="mt-4 font-display text-[56px] leading-[0.9] tracking-[0.08em] sm:text-[84px] lg:text-[100px]">
          WHERE DOES
          <br />
          IT ALL GO?
        </h1>
        <p className="mx-auto mt-5 max-w-[460px] text-[12px] leading-7 tracking-[0.08em] text-[#7a7870]">
          Record your expenses. See the truth. No excuses, no hiding - just honest numbers.
        </p>
      </header>

      <main className="grid min-h-[calc(100vh-240px)] grid-cols-1 md:grid-cols-[380px_1fr]">
        <ExpenseForm onCreated={reload} />

        <section className="p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="ledger-section-label mb-0 border-b-0 pb-0">All Expenses</div>
            <ExpenseFilter
              categories={categories}
              category={category}
              sort={sort}
              onCategoryChange={setCategory}
              onSortChange={setSort}
            />
          </div>

          {error ? (
            <div className="mb-6 flex flex-col gap-3 border-[1.5px] border-[#d94f3a] bg-[#fdefed] px-6 py-4 text-[11px] tracking-[0.08em] text-[#d94f3a] sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void reload()}
                className="w-fit bg-[#d94f3a] px-4 py-2 text-[11px] tracking-[0.2em] text-[#fafaf8]"
              >
                RETRY
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="mb-6 border-[1.5px] border-ink bg-[#fafaf8] px-6 py-4 text-[11px] tracking-[0.08em] text-[#7a7870]">
              Waiting for the server to respond. If the backend was idle, it may take a minute to wake up.
            </div>
          ) : null}

          <TotalBar total={total} count={expenses.length} />
          <CategorySummary expenses={allExpenses} />
          <ExpenseList
            expenses={expenses}
            loading={loading}
            loadingMessage={loadingMessage}
            emptyMessage={
              category
                ? "Nothing matches this filter. Try another category or add a new expense."
                : "Nothing here yet. Add your first expense on the left."
            }
          />
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t-[1.5px] border-ink px-4 py-6 text-[10px] uppercase tracking-[0.3em] text-[#7a7870] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>Cashaura v1.0</span>
        <span>Built for personal finance tracking</span>
      </footer>
    </div>
  );
}
