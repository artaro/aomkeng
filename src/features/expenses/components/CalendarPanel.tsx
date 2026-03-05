"use client";

import React, { useState, useMemo } from "react";
import { Transaction } from "@/features/expenses/types";
import { TransactionType } from "@/features/expenses/types";
import { formatCurrency, toLocalDateString } from "@/shared/lib/formatters";
import { useTranslation } from "@/shared/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isSameDay } from "date-fns";

interface CalendarPanelProps {
  transactions: Transaction[];
}

type ViewType = "expense" | "income" | "total";

export default function CalendarPanel({ transactions }: CalendarPanelProps) {
  const { t, language } = useTranslation();
  const [view, setView] = useState<ViewType>("total");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const viewLabels: Record<ViewType, string> = {
    total: t("calendar.total"),
    expense: t("calendar.expense"),
    income: t("calendar.income"),
  };

  const weekdays =
    language === "th"
      ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: { date: Date | null; dayNum: number }[] = [];

    // Pad previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, dayNum: 0 });
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), dayNum: i });
    }

    return days;
  }, [year, month]);

  // Aggregate data by date
  const dailyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    transactions.forEach((t) => {
      const dateKey = toLocalDateString(t.transactionDate);
      const entry = map.get(dateKey) || { income: 0, expense: 0 };

      if (t.type === TransactionType.INCOME) {
        entry.income += t.amount;
      } else {
        entry.expense += t.amount;
      }
      map.set(dateKey, entry);
    });

    return map;
  }, [transactions]);

  const getDayValue = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const data = dailyData.get(key) || { income: 0, expense: 0 };

    if (view === "expense") return data.expense;
    if (view === "income") return data.income;
    return data.income - data.expense;
  };

  const getDayColor = (value: number) => {
    if (value === 0) return "transparent";
    if (view === "expense")
      return `rgba(214, 48, 49, ${Math.min(value / 2000, 1)})`; // Red opacity based on value
    if (view === "income")
      return `rgba(0, 184, 148, ${Math.min(value / 2000, 1)})`; // Green
    // Total view: Green for positive, Red for negative
    return value >= 0
      ? `rgba(0, 184, 148, ${Math.min(value / 2000, 1)})`
      : `rgba(214, 48, 49, ${Math.min(Math.abs(value) / 2000, 1)})`;
  };

  return (
    <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-primary)] p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] min-w-[140px] text-center font-[var(--font-brand)] tracking-wide">
            {currentDate.toLocaleDateString(
              language === "th" ? "th-TH" : "en-US",
              { month: "long", year: "numeric" },
            )}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex border-2 border-[var(--color-border)]">
          {(["total", "expense", "income"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border-r-2 border-[var(--color-border)] last:border-r-0 ${
                view === v
                  ? "bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-[var(--color-text-muted)] uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          if (!item.date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const value = getDayValue(item.date);
          const isTodayDate = isSameDay(item.date, new Date());
          const intensity = Math.min(Math.abs(value) / 2000, 1);
          const isDarkBackground = intensity > 0.6;

          return (
            <div
              key={item.date.toISOString()}
              className={`
                    relative aspect-square p-1 border-2 flex flex-col items-center justify-center transition-all group
                    ${isTodayDate ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"}
                    ${value !== 0 ? "hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[3px_3px_0px_0px_var(--color-text-primary)] hover:z-10" : ""}
                `}
              style={{
                backgroundColor:
                  value !== 0 ? getDayColor(value) : "transparent",
              }}
            >
              <span
                className={`text-[10px] ${
                  value !== 0
                    ? isDarkBackground
                      ? "text-[#0D0D0D]"
                      : "text-[var(--color-text-primary)]"
                    : isTodayDate
                      ? "font-bold text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)]"
                }`}
              >
                {item.dayNum}
              </span>

              {value !== 0 && (
                <>
                  <span
                    className={`text-[9px] font-bold mt-0.5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-0.5 ${
                      isDarkBackground
                        ? "text-[#0D0D0D]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {Math.abs(value) >= 1000
                      ? `${(Math.abs(value) / 1000).toFixed(1)}k`
                      : Math.abs(value).toFixed(0)}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text-primary)] text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-bold shadow-[2px_2px_0px_0px_var(--color-primary)]">
                    {formatCurrency(value)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
