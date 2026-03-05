import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Transaction } from "@/features/expenses/types";
import { formatCurrency, formatDate, formatTime } from "@/shared/lib/formatters";
import { useCategories } from "@/features/expenses";

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export default function TransactionRow({
  transaction,
  onEdit,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
}: TransactionRowProps) {
  const { data: categories = [] } = useCategories();
  const category = categories.find((c) => c.id === transaction.categoryId);

  return (
    <div
      className={`group flex items-center justify-between p-4 bg-[var(--color-surface)] border-2 transition-all duration-200 ${
        selected
          ? "border-[var(--color-primary)] shadow-[4px_4px_0px_0px_var(--color-primary)] bg-[var(--color-primary)]/10"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-[4px_4px_0px_0px_var(--color-primary)] hover:-translate-y-1 hover:-translate-x-1"
      }`}
    >
      <div className="flex items-center gap-4">
        {selectable && onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(transaction.id)}
            className="w-5 h-5 border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all cursor-pointer"
          />
        )}

        {/* Icon (Category or Transfer) */}
        <div
          className="w-12 h-12 border-2 border-[var(--color-border)] flex items-center justify-center text-2xl"
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

        <div>
          <h3 className="font-bold text-[var(--color-text-primary)] text-sm md:text-base mb-0.5">
            {transaction.description}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-bold">
            <span className="uppercase tracking-wider">
              {transaction.type === "transfer"
                ? `To: ${transaction.destinationAccount?.name || "Unknown"}`
                : category?.name || "Uncategorized"}
            </span>
            <span className="text-[10px]">•</span>
            <span className="font-medium tracking-wide">
              {formatDate(transaction.transactionDate)}
            </span>
            <span className="text-[10px]">•</span>
            <span className="font-medium tracking-wide tabular-nums">
              {formatTime(transaction.transactionDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <span
          className={`font-bold text-sm md:text-base tracking-tight ${
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

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-primary)]/20 border-2 border-transparent hover:border-[var(--color-border)] transition-colors"
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
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-expense)] hover:bg-[var(--color-expense)]/20 border-2 border-transparent hover:border-[var(--color-border)] transition-colors"
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
