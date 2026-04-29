import { useEffect, useState } from "react";

import { fetchExpenses } from "../api/expenses";
import type { ApiError, Expense, ExpenseSort } from "../types";

type UseExpensesResult = {
  expenses: Expense[];
  allExpenses: Expense[];
  total: string;
  loading: boolean;
  loadingMessage: string;
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
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Waiting for the server to respond. Free-tier backends may take up to a minute to wake up.",
  );
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ExpenseSort>("date_desc");

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    setLoadingMessage(
      "Waiting for the server to respond. Free-tier backends may take up to a minute to wake up.",
    );

    try {
      const [filteredResponse, allExpensesResponse] = await Promise.all([
        fetchExpenses(category || undefined, sort),
        category ? fetchExpenses(undefined, "date_desc") : Promise.resolve(null),
      ]);

      setExpenses(filteredResponse.expenses);
      setTotal(filteredResponse.total);

      const categorySource = allExpensesResponse?.expenses ?? filteredResponse.expenses;
      setAllExpenses(categorySource);
      setCategories(
        [...new Set(categorySource.map((expense) => expense.category))].sort(),
      );
    } catch (loadError) {
      setError(formatApiError(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, [category, sort]);

  return {
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
    reload: loadExpenses,
  };
}
