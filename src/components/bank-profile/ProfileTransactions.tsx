
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Loader2 } from 'lucide-react';

interface ProfileTransactionsProps {
    profileId: string;
}

export function ProfileTransactions({ profileId }: ProfileTransactionsProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, [profileId]);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('bank_profile_id', profileId)
            .order('transaction_date', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setTransactions(data as Transaction[]);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <TransactionTable
            transactions={transactions}
            loading={loading}
            showAccount={false}
            bankProfiles={[]}
        />
    );
}
