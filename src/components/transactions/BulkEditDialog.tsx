import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBulkUpdateTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: string[];
    mode: 'category' | 'date' | null;
    onSuccess?: () => void;
    existingCategories?: string[];
}

export function BulkEditDialog({
    open,
    onOpenChange,
    selectedIds,
    mode,
    onSuccess,
    existingCategories = []
}: BulkEditDialogProps) {
    const [newValue, setNewValue] = useState('');
    const [loading, setLoading] = useState(false);
    const bulkUpdate = useBulkUpdateTransactions();

    const handleSubmit = async () => {
        if (!newValue) {
            toast.error('Please enter a value');
            return;
        }

        setLoading(true);
        try {
            const updates: any = {};
            if (mode === 'category') {
                updates.user_override_category = newValue;
                updates.category = newValue; // Update both for consistency
            } else if (mode === 'date') {
                updates.transaction_date = newValue;
            }

            await bulkUpdate.mutateAsync({
                ids: selectedIds,
                updates
            });

            setNewValue('');
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            // Error handled by hook
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Edit {mode === 'category' ? 'Category' : 'Date'}</DialogTitle>
                    <DialogDescription>
                        Updating {selectedIds.length} transactions. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="value">
                            {mode === 'category' ? 'New Category' : 'New Date'}
                        </Label>
                        {mode === 'category' ? (
                            <div className="relative">
                                <Input
                                    list="categories"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="Enter or select category"
                                />
                                <datalist id="categories">
                                    {existingCategories.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>
                        ) : (
                            <Input
                                id="value"
                                type="date"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Transactions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
