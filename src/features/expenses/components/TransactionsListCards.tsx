"use client";

import React, { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Transaction, Category, Account } from "@/features/expenses/types";
import { formatCurrency, formatDate, formatTime } from "@/shared/lib/formatters";
import { useTranslation } from "@/shared/lib/i18n";
import { ConfirmDialog } from "@/shared/components";

interface TransactionsListCardsProps {
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  categories: Category[];
  accounts: Account[];
  selectedType: "income" | "expense" | null;
}

export default function TransactionsListCards({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  categories,
  accounts,
  selectedType,
}: TransactionsListCardsProps) {
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "single";
    id: string;
  } | null>(null);

  const handleDeleteSingleRequest = (id: string) =>
    setDeleteConfirm({ type: "single", id });

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    onDeleteTransaction(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const getDeleteMessage = () => {
    if (!deleteConfirm) return "";
    const tx = transactions.find((t) => t.id === deleteConfirm.id);
    return t("import.deleteMsg", {
      name: tx?.description || "",
      amount: formatCurrency(tx?.amount || 0),
    });
  };

  return (
    <div>
      {/* Transaction rows */}
      <div className="space-y-0.5">
        {transactions.map((tx) => {
          const cat = categories.find((c) => c.id === tx.categoryId);
          const account = accounts.find((a) => a.id === tx.accountId);

          const isOtherType = selectedType && selectedType !== tx.type;
          const blurClass = isOtherType
            ? "blur-[2px] opacity-40 pointer-events-none grayscale"
            : "";

          return (
            <div
              key={tx.id}
              className={`
                group grid grid-cols-[auto_1fr_auto_auto] md:flex md:items-center gap-x-3 gap-y-1 px-3 py-2 border-2 border-transparent transition-all duration-150
                hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]
                ${blurClass}
              `}
            >
              {/* Category / Transfer icon */}
              <div className="row-span-2 md:row-span-1 flex-shrink-0">
                <div
                  className="w-9 h-9 flex items-center justify-center text-lg border-2 border-[var(--color-border)]"
                  style={{
                    backgroundColor:
                      tx.type === "transfer"
                        ? "var(--color-surface-2)"
                        : cat
                          ? `${cat.color}20`
                          : "#242424",
                    color:
                      tx.type === "transfer"
                        ? "var(--color-transfer)"
                        : "inherit",
                  }}
                >
                  {tx.type === "transfer" ? "🔄" : cat?.icon || "📦"}
                </div>
              </div>

              {/* Description + account */}
              <div className="col-start-2 md:col-auto md:flex-1 min-w-0 flex flex-col justify-center">
                <div className="w-full text-sm font-bold text-[var(--color-text-primary)] truncate tracking-tight">
                  {tx.description || t("txForm.description")}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)] truncate uppercase tracking-wider">
                    {tx.type === "transfer"
                      ? `To: ${tx.destinationAccount?.name || "Unknown"}`
                      : account?.name}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    •
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                    {formatDate(tx.transactionDate)}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    •
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)] tabular-nums">
                    {formatTime(tx.transactionDate)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div
                className={`col-start-3 md:col-auto justify-self-end text-sm font-bold whitespace-nowrap text-right min-w-[70px] ${
                  tx.type === "transfer"
                    ? "text-[var(--color-transfer)]"
                    : tx.type === "expense"
                      ? "text-[var(--color-expense)]"
                      : "text-[var(--color-income)]"
                }`}
              >
                {tx.type === "transfer"
                  ? ""
                  : tx.type === "expense"
                    ? "-"
                    : "+"}
                {formatCurrency(tx.amount)}
              </div>

              {/* Actions */}
              <div className="col-start-4 row-span-2 md:row-span-1 md:col-auto flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity justify-self-end">
                <button
                  onClick={() => onEditTransaction(tx)}
                  disabled={!!isOtherType}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/20 transition-colors disabled:opacity-0"
                  title={t("common.edit")}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDeleteSingleRequest(tx.id)}
                  disabled={!!isOtherType}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense)]/20 transition-colors disabled:opacity-0"
                  title={t("common.delete")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
