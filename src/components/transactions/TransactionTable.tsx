import { useState } from 'react';
import { Transaction, TRANSACTION_CATEGORIES } from '@/types/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown,
  Edit2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export function TransactionTable({ transactions, onUpdate }: TransactionTableProps) {
  const { user } = useAuth();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      category: transaction.user_override_category || transaction.category || '',
      notes: transaction.notes || '',
    });
  };

  const handleSave = async () => {
    if (!editingTransaction || !user) return;

    setSaving(true);
    
    // Log the audit trail
    if (editForm.category !== (editingTransaction.user_override_category || editingTransaction.category)) {
      await supabase.from('transaction_audit_log').insert({
        user_id: user.id,
        transaction_id: editingTransaction.id,
        field_changed: 'category',
        old_value: editingTransaction.user_override_category || editingTransaction.category,
        new_value: editForm.category,
      });
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        user_override_category: editForm.category,
        notes: editForm.notes,
      })
      .eq('id', editingTransaction.id);

    setSaving(false);

    if (error) {
      toast.error('Failed to update transaction');
      return;
    }

    toast.success('Transaction updated');
    setEditingTransaction(null);
    onUpdate();
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (confidence === null) return null;
    const percent = Math.round(confidence * 100);
    let variant: 'default' | 'secondary' | 'outline' = 'default';
    if (percent < 70) variant = 'outline';
    else if (percent < 90) variant = 'secondary';
    return (
      <Badge variant={variant} className="text-xs ml-1">
        {percent}%
      </Badge>
    );
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[80px]">Flags</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="font-medium truncate">{transaction.description}</p>
                      {transaction.original_description !== transaction.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground truncate cursor-help">
                              {transaction.original_description}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{transaction.original_description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="text-sm">
                        {transaction.user_override_category || transaction.category || 'Uncategorized'}
                      </span>
                      {transaction.user_override_category && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Edit2 className="h-3 w-3 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>User override</TooltipContent>
                        </Tooltip>
                      )}
                      {!transaction.user_override_category && getConfidenceBadge(transaction.category_confidence)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.merchant_name || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium",
                      transaction.transaction_type === 'credit' ? 'text-primary' : 'text-foreground'
                    )}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}
                      ${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {transaction.is_recurring && (
                        <Tooltip>
                          <TooltipTrigger>
                            <RefreshCw className="h-4 w-4 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Recurring: {transaction.recurring_frequency}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {transaction.is_anomaly && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {transaction.anomaly_reason}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(transaction)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium">{editingTransaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(editingTransaction.transaction_date), 'MMMM d, yyyy')} • 
                  ${Math.abs(editingTransaction.amount).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingTransaction.category && editingTransaction.category_confidence && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    AI suggested: {editingTransaction.category} ({Math.round(editingTransaction.category_confidence * 100)}% confidence)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Add notes about this transaction..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTransaction(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
