import { useEffect, useState } from "react";

import { createExpense } from "../api/expenses";
import type { ApiError, ExpenseFormInput } from "../types";

const CATEGORY_SUGGESTIONS = [
  "Food",
  "Transport",
  "Housing",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Utilities",
  "Other",
];

const STORAGE_KEYS = {
  draft: "ledger-expense-draft",
  idempotencyKey: "ledger-idempotency-key",
  pendingSubmission: "ledger-pending-submission",
} as const;

const createInitialState = (): ExpenseFormInput => ({
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
});

type ExpenseFormProps = {
  onCreated: () => Promise<void>;
};

type FormErrors = {
  amount?: string;
  category?: string;
  date?: string;
};

function readErrorMessage(error: unknown): string {
  const apiError = error as ApiError | undefined;
  const details = apiError?.error?.details ?? [];
  if (details.length) {
    return details.map((detail) => detail.message).join(" ");
  }
  if (apiError?.error?.code === "request_timeout") {
    return "The server took too long to respond. It may be waking up from an idle state. Your draft is saved and retry will reuse the same request key.";
  }
  if (apiError?.error?.code === "network_error" || error instanceof TypeError) {
    return "Network error. Your draft is still saved, and retry will reuse the same request key.";
  }
  return apiError?.error?.message ?? "Something went wrong.";
}

export function ExpenseForm({ onCreated }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormInput>(createInitialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(STORAGE_KEYS.draft);
    const savedKey = window.localStorage.getItem(STORAGE_KEYS.idempotencyKey);
    const pendingSubmission = window.localStorage.getItem(STORAGE_KEYS.pendingSubmission);

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft) as ExpenseFormInput;
        const restoredForm = {
          amount: parsedDraft.amount ?? "",
          category: parsedDraft.category ?? "",
          description: parsedDraft.description ?? "",
          date: parsedDraft.date ?? createInitialState().date,
        };
        setForm(restoredForm);

        const hasMeaningfulDraft =
          restoredForm.amount || restoredForm.category || restoredForm.description;
        if (hasMeaningfulDraft) {
          setFeedback({
            tone: "success",
            message: "Recovered your draft after refresh. Retry is safe.",
          });
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEYS.draft);
      }
    }

    if (savedKey) {
      setIdempotencyKey(savedKey);
    }

    if (pendingSubmission) {
      setFeedback({
        tone: "success",
        message: "Recovered a pending submission. Retry is safe and will not create duplicates.",
      });
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.idempotencyKey, idempotencyKey);
  }, [idempotencyKey]);

  const updateField = (field: keyof ExpenseFormInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const amount = Number(form.amount);

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = "Amount must be greater than 0";
    }

    if (!form.category.trim()) {
      nextErrors.category = "Required";
    }

    if (!form.date) {
      nextErrors.date = "Required";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setFeedback(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    window.localStorage.setItem(
      STORAGE_KEYS.pendingSubmission,
      JSON.stringify({
        ...form,
        idempotencyKey,
      }),
    );

    try {
      await createExpense(
        {
          ...form,
          amount: Number(form.amount).toFixed(2),
          category: form.category.trim(),
          description: form.description.trim(),
          date: form.date,
        },
        idempotencyKey,
      );

      setForm(createInitialState());
      setErrors({});
      setFeedback({ tone: "success", message: "Expense recorded." });
      setToast("EXPENSE ADDED");
      window.localStorage.removeItem(STORAGE_KEYS.draft);
      window.localStorage.removeItem(STORAGE_KEYS.pendingSubmission);
      const nextKey = crypto.randomUUID();
      setIdempotencyKey(nextKey);
      window.localStorage.setItem(STORAGE_KEYS.idempotencyKey, nextKey);
      await onCreated();
    } catch (submitError) {
      setFeedback({ tone: "error", message: readErrorMessage(submitError) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <aside className="border-b-[1.5px] border-ink p-8 md:border-b-0 md:border-r-[1.5px]">
        <div className="ledger-section-label">New Expense</div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label className="ledger-label" htmlFor="amount">
              Amount (&#8377;)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7870]">
                &#8377;
              </span>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                className={`ledger-input pl-7 ${errors.amount ? "border-[#d94f3a]" : ""}`}
                placeholder="0.00"
                autoComplete="off"
              />
            </div>
            <p className={`text-[10px] tracking-[0.1em] text-[#d94f3a] ${errors.amount ? "block" : "hidden"}`}>
              {errors.amount}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="ledger-label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className={`ledger-select ${errors.category ? "border-[#d94f3a]" : ""}`}
              >
                <option value="">- Pick one -</option>
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p
                className={`text-[10px] tracking-[0.1em] text-[#d94f3a] ${errors.category ? "block" : "hidden"}`}
              >
                {errors.category}
              </p>
            </div>

            <div className="space-y-1">
              <label className="ledger-label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                className={`ledger-input ${errors.date ? "border-[#d94f3a]" : ""}`}
              />
              <p className={`text-[10px] tracking-[0.1em] text-[#d94f3a] ${errors.date ? "block" : "hidden"}`}>
                {errors.date}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="ledger-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="ledger-input min-h-[72px] resize-y"
              placeholder="What was it for..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="mt-2 w-full cursor-pointer border-[1.5px] border-ink bg-ink px-4 py-3 font-display text-[18px] tracking-[0.25em] text-[#f2efe7] transition duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#e8712a] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? "SENDING..." : "ADD EXPENSE"}
          </button>

          {feedback ? (
            <div
              className={`px-3 py-2 text-[11px] tracking-[0.08em] ${
                feedback.tone === "success"
                  ? "border border-[#2d7a2d] bg-[#ebf5eb] text-[#2d7a2d]"
                  : "border border-[#d94f3a] bg-[#fdefed] text-[#d94f3a]"
              }`}
            >
              {feedback.tone === "success" ? "\u2713" : "\u2715"} {feedback.message}
            </div>
          ) : null}
        </form>
      </aside>

      <div
        className={`pointer-events-none fixed bottom-8 right-8 z-50 border-[1.5px] border-ink bg-ink px-5 py-3 text-[11px] tracking-[0.18em] text-[#f2efe7] transition-all duration-200 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
      >
        {toast}
      </div>
    </>
  );
}
