import { useEffect, useState } from "react";

import { fetchExpenses } from "../api/expenses";
import type { ApiError, Expense, ExpenseSort } from "../types";

type UseExpensesResult = {
  expenses: Expense[];
  total: string;
  loading: boolean;
  error: string | null;
  category: string;
  sort: ExpenseSort;
  categories: string[];
  setCategory: (value: string) => void;
  setSort: (value: ExpenseSort) => void;
  reload: () => Promise<void>;
};

function formatApiError(error: unknown): string {
  const apiError = error as ApiError | undefined;
  return apiError?.error?.message ?? "Unable to load expenses right now.";
}

export function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ExpenseSort>("date_desc");

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchExpenses(category || undefined, sort);
      setExpenses(response.expenses);
      setTotal(response.total);
    } catch (loadError) {
      setError(formatApiError(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, [category, sort]);

  const categories = [...new Set(expenses.map((expense) => expense.category))].sort();

  return {
    expenses,
    total,
    loading,
    error,
    category,
    sort,
    categories,
    setCategory,
    setSort,
    reload: loadExpenses,
  };
}
