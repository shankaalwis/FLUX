
import * as React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction, BankProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';
import { AddTransactionDialog } from './AddTransactionDialog';
import { EditTransactionDialog } from './EditTransactionDialog';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  limit?: number;
  showAccount?: boolean;
  bankProfiles?: BankProfile[];
}

export function TransactionTable({
  transactions,
  loading,
  limit,
  showAccount = false,
  bankProfiles = [],
}: TransactionTableProps) {
  // State for filters
  const [search, setSearch] = React.useState('');
  const [minAmount, setMinAmount] = React.useState('');
  const [maxAmount, setMaxAmount] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: 'date' | 'amount'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);

  // Derive unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(transactions.map(t => t.user_override_category || t.category || 'Uncategorized'));
    return ['all', ...Array.from(cats)].sort();
  }, [transactions]);

  // Filter and Sort
  const filteredTransactions = React.useMemo(() => {
    let result = [...transactions];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(t =>
        (t.description || '').toLowerCase().includes(lower) ||
        (t.merchant_name || '').toLowerCase().includes(lower)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(t => (t.user_override_category || t.category || 'Uncategorized') === selectedCategory);
    }

    if (minAmount) result = result.filter(t => Math.abs(t.amount) >= Number(minAmount));
    if (maxAmount) result = result.filter(t => Math.abs(t.amount) <= Number(maxAmount));

    result.sort((a, b) => {
      const valA = sortConfig.key === 'date' ? new Date(a.transaction_date).getTime() : Math.abs(a.amount);
      const valB = sortConfig.key === 'date' ? new Date(b.transaction_date).getTime() : Math.abs(b.amount);
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [transactions, search, selectedCategory, sortConfig, minAmount, maxAmount]);

  const displayTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions;
  const profileMap = bankProfiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, BankProfile>);

  const toggleSort = (key: 'date' | 'amount') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }



  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-[250px]"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Min Amount"
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-[120px]"
            />
            <Input
              placeholder="Max Amount"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-[120px]"
            />
          </div>
        </div>

        <AddTransactionDialog
          bankProfiles={bankProfiles}
          onSuccess={() => window.location.reload()} // Simple reload to refresh data
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] cursor-pointer hover:text-primary" onClick={() => toggleSort('date')}>
                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              {showAccount && <TableHead>Account</TableHead>}
              <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => toggleSort('amount')}>
                Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAccount ? 6 : 5} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              displayTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{transaction.merchant_name || transaction.description}</span>
                      {transaction.merchant_name && transaction.merchant_name !== transaction.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={transaction.description}>
                          {transaction.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.user_override_category || transaction.category ? (
                      <Badge variant="outline">
                        {transaction.user_override_category || transaction.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  {showAccount && (
                    <TableCell>
                      {profileMap[transaction.bank_profile_id] ? (
                        <div className="text-sm">
                          {profileMap[transaction.bank_profile_id].name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unknown</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className={`text-right ${transaction.transaction_type === 'credit' ? 'text-green-600 font-medium' : ''}`}>
                    {transaction.transaction_type === 'credit' ? '+' : ''}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'LKR',
                    }).format(Math.abs(transaction.amount))}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(transaction)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditTransactionDialog
        transaction={editingTransaction}
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
