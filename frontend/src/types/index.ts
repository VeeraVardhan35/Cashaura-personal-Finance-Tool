export type Expense = {
  id: string;
  amount: string;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
};

export type ExpenseListResponse = {
  expenses: Expense[];
  total: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string | null;
      message: string;
    }> | null;
  };
};

export type ExpenseFormInput = {
  amount: string;
  category: string;
  description: string;
  date: string;
};

export type ExpenseSort = "date_desc" | "date_asc";
