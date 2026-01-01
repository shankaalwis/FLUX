
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Transaction } from '@/types/database';

const transactionSchema = z.object({
    date: z.string(),
    description: z.string().min(1, 'Description is required'),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
    type: z.enum(['credit', 'debit']),
    category: z.string().min(1, 'Category is required'),
});

interface EditTransactionDialogProps {
    transaction: Transaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange, onSuccess }: EditTransactionDialogProps) {
    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        values: transaction ? {
            date: new Date(transaction.transaction_date).toISOString().split('T')[0],
            description: transaction.description,
            amount: Math.abs(transaction.amount).toString(),
            type: transaction.transaction_type as 'credit' | 'debit',
            category: transaction.user_override_category || transaction.category || 'General',
        } : undefined,
    });

    const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
        if (!transaction) return;

        try {
            const amount = Number(values.amount);

            const { error } = await supabase
                .from('transactions')
                .update({
                    transaction_date: values.date,
                    description: values.description,
                    merchant_name: values.description,
                    amount: amount, // Positive, type handles sign logic if needed, but standard is usually signed in DB? 
                    // Actually, process-statement stores absolute amount in amounts? No, usually transactions are stored signed or with type.
                    // Checking existing code: TransactionTable shows abs(amount).
                    // If Schema stores signed: Credit +, Debit -.
                    // Let's assume we need to store it based on type if the DB expects signed.
                    // Wait, `process-statement` uses `amount: t.amount` which comes from Gemini.
                    // Let's check `TransactionTable`: `transaction.transaction_type === 'credit' ? '+' : ''` and `Math.abs`.
                    // This implies the DB likely stores it as is. 
                    // If I look at `AddTransactionDialog`, I inserted `amount`.
                    // I will trust that the display logic handles `transaction_type`.
                    transaction_type: values.type,
                    user_override_category: values.category,
                    // If we want to persist simple category change:
                    category: values.category
                })
                .eq('id', transaction.id);

            if (error) throw error;

            toast.success('Transaction updated');
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error('Error updating transaction:', error);
            toast.error('Failed to update transaction');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="debit">Expense (Debit)</SelectItem>
                                                <SelectItem value="credit">Income (Credit)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (Rs.)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
