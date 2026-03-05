'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { transactionRepository } from '@/features/expenses/api';
import { queryKeys } from '@/config/query';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from '@/features/expenses/types';
import { useAuthStore } from '@/shared/stores';

export function useTransactions(filter?: TransactionFilter) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.transactions.list(filter as Record<string, unknown> || {}),
    queryFn: () => transactionRepository.getAll(userId!, filter),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionRepository.getById(id),
    enabled: !!id,
  });
}

export function useTransactionSummary(startDate?: string, endDate?: string) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: queryKeys.transactions.summary({ startDate, endDate }),
    queryFn: () => transactionRepository.getSummary(userId!, startDate, endDate),
    enabled: !!userId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      transactionRepository.create(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useCreateTransactionsBulk() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (inputs: CreateTransactionInput[]) =>
      transactionRepository.createBulk(userId!, inputs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      transactionRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useDeleteAllTransactions() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: () => transactionRepository.deleteAll(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
