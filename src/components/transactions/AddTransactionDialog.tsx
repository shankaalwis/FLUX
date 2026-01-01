
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus } from 'lucide-react';
import { BankProfile } from '@/types/database';

const transactionSchema = z.object({
    date: z.string(),
    description: z.string().min(1, 'Description is required'),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
    type: z.enum(['credit', 'debit']),
    category: z.string().min(1, 'Category is required'),
    bankProfileId: z.string().min(1, 'Account is required'),
});

interface AddTransactionDialogProps {
    bankProfiles: BankProfile[];
    defaultProfileId?: string;
    onSuccess: () => void;
}

export function AddTransactionDialog({ bankProfiles, defaultProfileId, onSuccess }: AddTransactionDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: '',
            type: 'debit',
            category: 'General',
            bankProfileId: defaultProfileId || (bankProfiles.length > 0 ? bankProfiles[0].id : ''),
        },
    });

    const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
        if (!user) return;

        try {
            const amount = Number(values.amount);

            // Insert transaction
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                bank_profile_id: values.bankProfileId,
                transaction_hash: `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                transaction_date: values.date,
                description: values.description,
                original_description: values.description, // Manual entry same as original
                amount: amount, // Stored as positive absolute value usually, or type handles it?
                // Wait, schema usually expects absolute amount and a type column, OR signed amount?
                // process-statement logic: amount: Math.abs(tx.amount), transaction_type: type
                transaction_type: values.type,
                category: values.category,
                merchant_name: values.description, // Simplified
                is_recurring: false,
            });

            if (error) throw error;

            toast.success('Transaction added');
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error: any) {
            console.error('Error adding transaction:', error);
            toast.error('Failed to add transaction');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Manual Transaction</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="bankProfileId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!defaultProfileId}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {bankProfiles.map((profile) => (
                                                <SelectItem key={profile.id} value={profile.id}>
                                                    {profile.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                        <Input placeholder="e.g. Grocery Store" {...field} />
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
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                                            <Input placeholder="e.g. Food" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit">Save Transaction</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
