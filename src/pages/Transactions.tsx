
import { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Transaction, BankProfile } from '@/types/database';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download } from 'lucide-react';

interface OutletContext {
    bankProfiles: BankProfile[];
    selectedProfileId: string | null;
}

export default function Transactions() {
    const { user } = useAuth();
    const { bankProfiles, selectedProfileId } = useOutletContext<OutletContext>();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user, sortOrder, selectedProfileId]);

    const fetchTransactions = async () => {
        setLoading(true);
        let query = supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: sortOrder === 'asc' });

        if (selectedProfileId) {
            query = query.eq('bank_profile_id', selectedProfileId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
        } else {
            setTransactions(data as Transaction[]);
        }
        setLoading(false);
    };

    const toggleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-muted-foreground">
                        {selectedProfileId
                            ? `Viewing transactions for ${bankProfiles.find(p => p.id === selectedProfileId)?.name || 'Account'}`
                            : 'All transactions across all accounts'}
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={toggleSort}>
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <TransactionTable
                transactions={transactions}
                loading={loading}
                showAccount={!selectedProfileId}
                bankProfiles={bankProfiles}
                initialCategory={searchParams.get('category') || 'all'}
                initialSearch={searchParams.get('search') || ''}
            />
        </div>
    );
}
