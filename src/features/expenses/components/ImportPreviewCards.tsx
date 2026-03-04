"use client";

import React, { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Category } from "@/features/expenses/types";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { useTranslation } from "@/shared/lib/i18n";
import { ConfirmDialog } from "@/shared/components";
import { ParsedLLMTransaction } from "../hooks/useStatementImport";

const ROWS_PER_PAGE = 20;

interface ImportPreviewCardsProps {
  transactions: ParsedLLMTransaction[];
  onTransactionsChange: (transactions: ParsedLLMTransaction[]) => void;
  categories: Category[];
  selectedIndices: Set<number>;
  onSelectOne: (index: number) => void;
  onSelectAllOfType: (type: "income" | "expense", indices: number[]) => void;
  selectedType: "income" | "expense" | null;
}

export default function ImportPreviewCards({
  transactions,
  onTransactionsChange,
  categories,
  selectedIndices,
  onSelectOne,
  onSelectAllOfType,
  selectedType,
}: ImportPreviewCardsProps) {
  const { t } = useTranslation();
  const [expensePage, setExpensePage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "single";
    index: number;
  } | null>(null);

  const expenseTransactions = useMemo(
    () =>
      transactions
        .map((tx, idx) => ({ tx, idx }))
        .filter(({ tx }) => tx.type === "expense"),
    [transactions],
  );
  const incomeTransactions = useMemo(
    () =>
      transactions
        .map((tx, idx) => ({ tx, idx }))
        .filter(({ tx }) => tx.type === "income"),
    [transactions],
  );

  const expenseTotal = expenseTransactions.reduce(
    (sum, { tx }) => sum + tx.amount,
    0,
  );
  const incomeTotal = incomeTransactions.reduce(
    (sum, { tx }) => sum + tx.amount,
    0,
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );

  const expensePageCount = Math.ceil(
    expenseTransactions.length / ROWS_PER_PAGE,
  );
  const incomePageCount = Math.ceil(incomeTransactions.length / ROWS_PER_PAGE);

  const pagedExpenses = expenseTransactions.slice(
    (expensePage - 1) * ROWS_PER_PAGE,
    expensePage * ROWS_PER_PAGE,
  );
  const pagedIncomes = incomeTransactions.slice(
    (incomePage - 1) * ROWS_PER_PAGE,
    incomePage * ROWS_PER_PAGE,
  );

  const updateTransaction = (
    index: number,
    field: keyof ParsedLLMTransaction,
    value: string | number,
  ) => {
    const next = [...transactions];
    next[index] = { ...next[index], [field]: value };
    onTransactionsChange(next);
  };

  const handleDeleteSingleRequest = (index: number) =>
    setDeleteConfirm({ type: "single", index });

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const next = transactions.filter((_, i) => i !== deleteConfirm.index);
    onTransactionsChange(next);
    setDeleteConfirm(null);
  };

  const getDeleteMessage = () => {
    if (!deleteConfirm) return "";
    const tx = transactions[deleteConfirm.index];
    return t("import.deleteMsg", {
      name: tx?.description || "",
      amount: formatCurrency(tx?.amount || 0),
    });
  };

  const renderRow = (
    tx: ParsedLLMTransaction,
    globalIndex: number,
    typedCategories: Category[],
  ) => {
    const isSelected = selectedIndices.has(globalIndex);
    const cat = categories.find((c) => c.id === tx.category);

    const isOtherType = selectedType && selectedType !== tx.type;

    const blurClass = isOtherType
      ? "blur-[2px] opacity-40 pointer-events-none grayscale"
      : "";

    return (
      <div
        key={globalIndex}
        className={`
          group grid grid-cols-[auto_auto_1fr_auto] md:flex md:items-center gap-x-3 gap-y-1.5 px-4 py-3 border-2 transition-all duration-200
          ${isSelected ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]" : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"}
          ${blurClass}
        `}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectOne(globalIndex)}
          disabled={!!isOtherType}
          className="row-span-2 md:row-span-1 w-4 h-4 border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Category Select */}
        <div className="row-span-2 md:row-span-1 flex-shrink-0 relative group/cat">
          <div
            className="w-10 h-10 border-2 border-[var(--color-border)] flex items-center justify-center text-xl transition-colors"
            style={{ backgroundColor: cat ? `${cat.color}20` : "#242424" }}
          >
            {cat?.icon || "📦"}
          </div>
          <select
            value={tx.category || ""}
            onChange={(e) =>
              updateTransaction(globalIndex, "category", e.target.value)
            }
            disabled={!!isOtherType}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            title={t("txForm.selectCategory")}
          >
            <option value="">{t("import.uncategorized")}</option>
            {typedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <input
          value={tx.description}
          onChange={(e) =>
            updateTransaction(globalIndex, "description", e.target.value)
          }
          placeholder={t("txForm.description")}
          disabled={!!isOtherType}
          className="col-start-3 md:col-auto w-full md:flex-1 min-w-0 bg-transparent border-b-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none py-1 text-sm font-bold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] truncate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Amount */}
        <div
          className={`col-start-4 md:col-auto justify-self-end md:justify-self-auto text-sm font-bold whitespace-nowrap text-right min-w-[80px] md:min-w-[90px] tracking-tight ${
            tx.type === "expense"
              ? "text-[var(--color-expense)]"
              : "text-[var(--color-income)]"
          }`}
        >
          {tx.type === "expense" ? "-" : "+"}
          {formatCurrency(tx.amount)}
        </div>

        {/* Date & Time */}
        <div className="col-start-3 md:col-auto flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0 justify-start md:justify-center w-full md:w-24 flex-shrink-0 text-left md:text-right">
          <span className="text-xs font-bold text-[var(--color-text-secondary)] whitespace-nowrap">
            {formatDate(tx.date)}
          </span>
          {tx.time && (
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold whitespace-nowrap md:mt-0.5">
              {tx.time}
            </span>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => handleDeleteSingleRequest(globalIndex)}
          disabled={!!isOtherType}
          className="col-start-4 md:col-auto justify-self-end md:justify-self-auto p-2 text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense)]/20 border-2 border-transparent hover:border-[var(--color-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={t("common.delete")}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  };

  const renderSectionHeader = (
    allItems: { idx: number }[],
    pagedItems: { idx: number }[],
    pageCount: number,
    page: number,
    onPageChange: (p: number) => void,
    label: string,
    type: "income" | "expense",
  ) => {
    const allIndices = allItems.map((i) => i.idx);
    const allSelected =
      allIndices.length > 0 && allIndices.every((i) => selectedIndices.has(i));
    const pageIndices = pagedItems.map((i) => i.idx);
    const allPageSelected =
      pageIndices.length > 0 &&
      pageIndices.every((i) => selectedIndices.has(i));

    const isOtherType = selectedType && selectedType !== type;

    return (
      <div
        className={`flex items-center justify-between mb-2 px-4 transition-opacity duration-200 ${isOtherType ? "opacity-30 pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onSelectAllOfType(type, allIndices)}
              disabled={!!isOtherType}
              className="w-4 h-4 border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] disabled:cursor-not-allowed group-hover:border-[var(--color-primary)] transition-colors"
            />
            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              {t("common.selectAll")} {label} ({allItems.length})
            </span>
          </label>
          {pageCount > 1 && (
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={() => onSelectAllOfType(type, pageIndices)}
                disabled={!!isOtherType}
                className="w-4 h-4 border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] disabled:cursor-not-allowed group-hover:border-[var(--color-primary)] transition-colors"
              />
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                {t("common.thisPage")}
              </span>
            </label>
          )}
        </div>

        {/* Pagination — right-aligned, same level as checkboxes */}
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 border-2 border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold hover:bg-[var(--color-surface-2)] disabled:opacity-50 uppercase tracking-wider transition-colors bg-[var(--color-surface)]"
            >
              {t("common.prev")}
            </button>
            <span className="text-xs font-bold py-1 px-2 text-[var(--color-text-primary)] tracking-widest">
              {page} / {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 border-2 border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold hover:bg-[var(--color-surface-2)] disabled:opacity-50 uppercase tracking-wider transition-colors bg-[var(--color-surface)]"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`pb-24 ${selectedIndices.size > 0 ? "mb-16" : ""}`}>
      {/* Income */}
      {incomeTransactions.length > 0 && (
        <div
          className={`mb-6 transition-all duration-300 ${selectedType === "expense" ? "grayscale opacity-50" : ""}`}
        >
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-none bg-[var(--color-income)]" />
              <h3 className="font-bold text-[var(--color-text-primary)] font-[var(--font-brand)] tracking-wide">
                {t("transactions.income")} ({incomeTransactions.length})
              </h3>
            </div>
            <span className="px-2 py-0.5 border-2 border-[var(--color-income)] bg-[var(--color-income)]/10 text-[var(--color-income)] text-xs font-bold tracking-widest shadow-[2px_2px_0px_0px_var(--color-income)]">
              +{formatCurrency(incomeTotal)}
            </span>
          </div>
          {renderSectionHeader(
            incomeTransactions,
            pagedIncomes,
            incomePageCount,
            incomePage,
            setIncomePage,
            t("transactions.income").toLowerCase(),
            "income",
          )}
          <div className="space-y-4">
            {pagedIncomes.map(({ tx, idx }) =>
              renderRow(tx, idx, incomeCategories),
            )}
          </div>
        </div>
      )}

      {/* Expenses */}
      {expenseTransactions.length > 0 && (
        <div
          className={`mb-6 transition-all duration-300 ${selectedType === "income" ? "grayscale opacity-50" : ""}`}
        >
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-none bg-[var(--color-expense)]" />
              <h3 className="font-bold text-[var(--color-text-primary)] font-[var(--font-brand)] tracking-wide">
                {t("transactions.expense")} ({expenseTransactions.length})
              </h3>
            </div>
            <span className="px-2 py-0.5 border-2 border-[var(--color-expense)] bg-[var(--color-expense)]/10 text-[var(--color-expense)] text-xs font-bold tracking-widest shadow-[2px_2px_0px_0px_var(--color-expense)]">
              -{formatCurrency(expenseTotal)}
            </span>
          </div>
          {renderSectionHeader(
            expenseTransactions,
            pagedExpenses,
            expensePageCount,
            expensePage,
            setExpensePage,
            t("transactions.expense").toLowerCase(),
            "expense",
          )}
          <div className="space-y-4">
            {pagedExpenses.map(({ tx, idx }) =>
              renderRow(tx, idx, expenseCategories),
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title={t("confirm.delete")}
        message={getDeleteMessage()}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
