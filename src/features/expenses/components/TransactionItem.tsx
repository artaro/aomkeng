"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Transaction } from "@/features/expenses/types";
import { AccountType } from "@/features/expenses/types";
import { formatCurrency, formatDate, formatTime } from "@/shared/lib/formatters";
import { useCategories, useAccounts } from "@/features/expenses";

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  showActions = true,
}: TransactionItemProps) {
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const category = categories.find((c) => c.id === transaction.categoryId);
  const account = accounts.find((a) => a.id === transaction.accountId);

  const accountIcon = account?.type === AccountType.CREDIT_CARD ? "💳" : "🏦";

  return (
    <div className="group flex items-center justify-between p-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon (Category or Transfer) */}
        <div
          className="w-11 h-11 flex items-center justify-center text-xl flex-shrink-0 border-2 border-[var(--color-border)]"
          style={{
            backgroundColor:
              transaction.type === "transfer"
                ? "var(--color-surface-2)"
                : category
                  ? `${category.color}20`
                  : "#242424",
            color:
              transaction.type === "transfer"
                ? "var(--color-transfer)"
                : "inherit",
          }}
        >
          {transaction.type === "transfer" ? "🔄" : category?.icon || "📦"}
        </div>

        {/* Main Info */}
        <div className="min-w-0 flex-1">
          {/* Description */}
          <h3 className="font-bold text-[var(--color-text-primary)] text-sm md:text-base mb-1 truncate">
            {transaction.description || "No description"}
          </h3>

          {/* Chips Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category / Transfer Chip */}
            {transaction.type === "transfer" ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  color: "var(--color-transfer)",
                  borderColor: "var(--color-border)",
                }}
              >
                <span className="text-xs">➡️</span>
                {transaction.destinationAccount?.name || "Unknown Account"}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border"
                style={{
                  backgroundColor: category ? `${category.color}15` : "#242424",
                  color: category?.color || "var(--color-text-muted)",
                  borderColor: category
                    ? `${category.color}40`
                    : "var(--color-border)",
                }}
              >
                {category?.icon && (
                  <span className="text-xs">{category.icon}</span>
                )}
                {category?.name || "Uncategorized"}
              </span>
            )}

            {/* Account Chip */}
            {account && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                <span className="text-xs">{accountIcon}</span>
                {account.name}
              </span>
            )}

            {/* Date & Time */}
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
              {formatDate(transaction.transactionDate)}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)]">•</span>
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium tabular-nums">
              {formatTime(transaction.transactionDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-3">
        {/* Amount */}
        <span
          className={`font-bold text-sm md:text-base whitespace-nowrap ${
            transaction.type === "transfer"
              ? "text-[var(--color-transfer)]"
              : transaction.type === "expense"
                ? "text-[var(--color-expense)]"
                : "text-[var(--color-income)]"
          }`}
        >
          {transaction.type === "transfer"
            ? ""
            : transaction.type === "expense"
              ? "-"
              : "+"}
          {formatCurrency(transaction.amount)}
        </span>

        {/* Actions */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
              >
                <Edit2 size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense)]/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
