
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
import { Transaction, BankProfile } from '@/types/database';
import { Loader2 } from 'lucide-react';

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
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;
  const profileMap = bankProfiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {} as Record<string, BankProfile>);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            {showAccount && <TableHead>Account</TableHead>}
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTransactions.map((transaction) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
