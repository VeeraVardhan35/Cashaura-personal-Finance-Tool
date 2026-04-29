import type { ExpenseSort } from "../types";

type ExpenseFilterProps = {
  categories: string[];
  category: string;
  sort: ExpenseSort;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: ExpenseSort) => void;
};

export function ExpenseFilter({
  categories,
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: ExpenseFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="ledger-select w-auto min-w-[180px] px-3 py-[7px] text-[11px] uppercase tracking-[0.1em]"
      >
        <option value="">ALL CATEGORIES</option>
        {categories.map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as ExpenseSort)}
        className="ledger-select w-auto min-w-[180px] px-3 py-[7px] text-[11px] uppercase tracking-[0.1em]"
      >
        <option value="date_desc">NEWEST FIRST</option>
        <option value="date_asc">OLDEST FIRST</option>
      </select>
    </div>
  );
}
