// ─── Expenses Feature Barrel ──────────────────────────────────────────────────
// Re-exports all hooks for backward compatibility with barrel imports

export { useTransactions, useTransaction, useTransactionSummary, useCreateTransaction, useCreateTransactionsBulk, useUpdateTransaction, useDeleteTransaction, useDeleteAllTransactions } from './hooks/useTransactions';
export { useAccounts, useAccount, useCreateAccount, useUpdateAccount, useDeleteAccount } from './hooks/useAccounts';
export { useCategories, useCategory, useCreateCategory, useUpdateCategory, useDeleteCategory, useTogglePinCategory, useIncrementCategoryUseCount } from './hooks/useCategories';
