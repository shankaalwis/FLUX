// src/hooks/useTransactions.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
import { toast } from 'sonner';

export const TRANSACTIONS_QUERY_KEY = 'transactions';

/**
 * Fetch transactions with React Query caching
 */
export function useTransactions(bankProfileId?: string | null) {
    return useQuery({
        queryKey: [TRANSACTIONS_QUERY_KEY, bankProfileId],
        queryFn: async () => {
            let query = supabase
                .from('transactions')
                .select('*')
                .order('transaction_date', { ascending: false });

            if (bankProfileId) {
                query = query.eq('bank_profile_id', bankProfileId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Transaction[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    });
}

/**
 * Update transaction mutation
 */
export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
            const { data, error } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
            toast.success('Transaction updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update: ${error.message}`);
        },
    });
}

/**
 * Delete transaction mutation
 */
export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
            toast.success('Transaction deleted');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete: ${error.message}`);
        },
    });
}

/**
 * Bulk update transactions mutation
 */
export function useBulkUpdateTransactions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Transaction> }) => {
            const { data, error } = await supabase
                .from('transactions')
                .update(updates)
                .in('id', ids)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
            toast.success(`${data ? data.length : 'Transactions'} transactions updated successfully`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to update: ${error.message}`);
        },
    });
}
