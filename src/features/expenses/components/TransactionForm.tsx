"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { TransactionType, AccountType } from "@/features/expenses/types";
import {
  Account,
  Category,
  CreateTransactionInput,
} from "@/features/expenses/types";
import { useTranslation } from "@/shared/lib/i18n";
import { format } from "date-fns";
import { toLocalDateString, formatTime, toLocalISOString } from "@/shared/lib/formatters";

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionInput) => void | Promise<void>;
  accounts: Account[];
  categories: Category[];
  initialData?: Partial<CreateTransactionInput>;
  loading?: boolean;
  isEdit?: boolean;
}

export default function TransactionForm({
  open,
  onClose,
  onSubmit,
  accounts,
  categories,
  initialData,
  loading = false,
  isEdit = false,
}: TransactionFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: TransactionType.EXPENSE,
    accountId: "",
    categoryId: "",
    destinationAccountId: "",
    transactionDate: "",
    transactionTime: "00:00",
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        // eslint-disable-next-line
        setFormData({
          description: initialData.description || "",
          amount: initialData.amount?.toString() || "",
          type: initialData.type || TransactionType.EXPENSE,
          accountId: initialData.accountId || "",
          categoryId: initialData.categoryId || "",
          destinationAccountId: initialData.destinationAccountId || "",
          transactionDate: initialData.transactionDate
            ? toLocalDateString(initialData.transactionDate)
            : format(new Date(), "yyyy-MM-dd"),
          transactionTime: initialData.transactionDate
            ? formatTime(initialData.transactionDate)
            : "00:00",
        });
      } else {
        setFormData({
          description: "",
          amount: "",
          type: TransactionType.EXPENSE,
          accountId: accounts.length > 0 ? accounts[0].id : "",
          categoryId: "",
          destinationAccountId: "",
          transactionDate: format(new Date(), "yyyy-MM-dd"),
          transactionTime: "00:00",
        });
      }
    }
  }, [open, initialData, accounts]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { transactionTime: _time, ...rest } = formData;
    const transactionDate = toLocalISOString(formData.transactionDate, _time);
    onSubmit({
      ...rest,
      amount: Number(rest.amount),
      transactionDate,
      destinationAccountId:
        rest.type === TransactionType.TRANSFER
          ? rest.destinationAccountId
          : null,
      categoryId:
        rest.type === TransactionType.TRANSFER ? null : rest.categoryId,
    });
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-primary)] w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-[var(--color-border)]">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-[var(--font-brand)] uppercase tracking-wider">
            {isEdit ? t("txForm.editTransaction") : t("txForm.newTransaction")}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        {/* content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <fieldset disabled={loading} className={`space-y-5 ${loading ? "opacity-60" : ""}`}>
          {/* Type Toggle */}
          <div className="flex border-2 border-[var(--color-border)]">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  type: TransactionType.EXPENSE,
                  categoryId: "",
                  destinationAccountId: "",
                })
              }
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                formData.type === TransactionType.EXPENSE
                  ? "bg-[var(--color-expense)] text-[var(--color-text-inverse)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {t("transactions.expense")}
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  type: TransactionType.INCOME,
                  categoryId: "",
                  destinationAccountId: "",
                })
              }
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-all border-l-2 border-[var(--color-border)] ${
                formData.type === TransactionType.INCOME
                  ? "bg-[var(--color-income)] text-[var(--color-text-inverse)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {t("transactions.income")}
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  type: TransactionType.TRANSFER,
                  categoryId: "",
                  destinationAccountId: "",
                })
              }
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-all border-l-2 border-[var(--color-border)] ${
                formData.type === TransactionType.TRANSFER
                  ? "bg-[var(--color-transfer)] text-[var(--color-text-inverse)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {t("transactions.transfer")}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
              {t("txForm.amount")}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">
                <DollarSign size={18} />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="brutal-input w-full pl-10 pr-4 py-3 text-lg"
                required
                autoFocus={!isEdit}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
              {t("txForm.description")}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <FileText size={18} />
              </div>
              <input
                type="text"
                placeholder={t("txForm.descriptionPlaceholder")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="brutal-input w-full pl-10 pr-4 py-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category (Hidden for Transfers) */}
            {formData.type !== TransactionType.TRANSFER && (
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
                  {t("txForm.category")}
                </label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="brutal-input w-full pl-3 pr-8 py-2.5 appearance-none font-medium text-sm truncate cursor-pointer bg-[var(--color-surface)]"
                    required
                  >
                    <option value="" disabled>
                      {t("txForm.selectCategory")}
                    </option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
                {t("txForm.date")}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  <CalendarIcon size={16} />
                </div>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionDate: e.target.value,
                    })
                  }
                  className="brutal-input w-full pl-9 pr-3 py-2.5 font-medium text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Time (optional, default 00:00) */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
              {t("txForm.time")}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <Clock size={16} />
              </div>
              <input
                type="time"
                value={formData.transactionTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transactionTime: e.target.value || "00:00",
                  })
                }
                className="brutal-input w-full pl-9 pr-3 py-2.5 font-medium text-sm"
              />
            </div>
          </div>

          {/* Account Selections */}
          <div
            className={`grid gap-4 ${formData.type === TransactionType.TRANSFER ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
                {formData.type === TransactionType.TRANSFER
                  ? t("txForm.fromAccount")
                  : t("txForm.account")}
              </label>
              <div className="relative">
                <select
                  value={formData.accountId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })
                  }
                  className="brutal-input w-full pl-3 pr-8 py-3 appearance-none font-medium text-sm bg-[var(--color-surface)] cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    {t("txForm.selectAccount")}
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type === "bank" ? "🏦" : "💳"} {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {formData.type === TransactionType.TRANSFER && (
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
                  {t("txForm.toAccount")}
                </label>
                <div className="relative">
                  <select
                    value={formData.destinationAccountId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destinationAccountId: e.target.value,
                      })
                    }
                    className="brutal-input w-full pl-3 pr-8 py-3 appearance-none font-medium text-sm bg-[var(--color-surface)] cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      {t("txForm.selectAccount")}
                    </option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.type === "bank" ? "🏦" : "💳"} {a.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                    size={20}
                  />
                </div>
              </div>
            )}
          </div>

          {formData.type === TransactionType.TRANSFER &&
            formData.accountId === formData.destinationAccountId &&
            formData.accountId !== "" && (
              <p className="text-sm font-medium text-[var(--color-expense)] mt-1 ml-1">
                {t("txForm.sameAccountError")}
              </p>
            )}

          {formData.type === TransactionType.TRANSFER &&
            formData.destinationAccountId &&
            formData.accountId !== formData.destinationAccountId &&
            accounts.find((a) => a.id === formData.destinationAccountId)?.type === AccountType.CREDIT_CARD && (
              <p className="text-xs font-bold text-[var(--color-transfer)] mt-1 ml-1 flex items-center gap-1">
                💳 {t("txForm.creditCardPayment")}
              </p>
            )}

          </fieldset>

          {/* Actions — outside fieldset so buttons stay interactive */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-[var(--color-border)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] transition-colors uppercase tracking-wider"
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.amount ||
                !formData.accountId ||
                (formData.type !== TransactionType.TRANSFER &&
                  !formData.categoryId) ||
                (formData.type === TransactionType.TRANSFER &&
                  (!formData.destinationAccountId ||
                    formData.accountId === formData.destinationAccountId))
              }
              className="brutal-btn px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("common.saving") : t("txForm.saveTransaction")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
