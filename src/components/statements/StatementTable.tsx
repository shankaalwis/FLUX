import { useState } from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, RefreshCw, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Statement, BankProfile } from '@/types/database';

interface StatementTableProps {
    statements: Statement[];
    loading: boolean;
    bankProfiles: BankProfile[];
    onRetry: (id: string) => void;
    onDelete: (id: string, path: string) => void;
    onDeleteMany?: (items: { id: string; path: string }[]) => void;
}

export function StatementTable({ statements, loading, bankProfiles, onRetry, onDelete, onDeleteMany }: StatementTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const profileMap = bankProfiles.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
    }, {} as Record<string, BankProfile>);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(statements.map(s => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        if (!onDeleteMany) return;
        const itemsToDelete = statements
            .filter(s => selectedIds.has(s.id))
            .map(s => ({ id: s.id, path: s.file_path }));
        onDeleteMany(itemsToDelete);
        setSelectedIds(new Set());
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (statements.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                No statements found. Upload a statement to get started.
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'processing':
                return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
            case 'failed':
                return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            case 'queued':
                return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md border">
                    <span className="text-sm font-medium pl-2">{selectedIds.size} selected</span>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete {selectedIds.size} Statements?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the selected statements and their extracted data.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete All
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={statements.length > 0 && selectedIds.size === statements.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Filename</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {statements.map((statement) => (
                            <TableRow key={statement.id} data-state={selectedIds.has(statement.id) ? "selected" : undefined}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(statement.id)}
                                        onCheckedChange={(checked) => handleSelectOne(statement.id, checked as boolean)}
                                        aria-label={`Select ${statement.filename}`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{statement.filename}</span>
                                        {statement.error_message && (
                                            <span className="text-xs text-destructive truncate max-w-[200px]" title={statement.error_message}>
                                                {statement.error_message}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {profileMap[statement.bank_profile_id]?.name || 'Unknown Account'}
                                </TableCell>
                                <TableCell>{getStatusBadge(statement.status)}</TableCell>
                                <TableCell>{format(new Date(statement.created_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {statement.status === 'failed' && (
                                            <Button variant="ghost" size="icon" onClick={() => onRetry(statement.id)} title="Retry Processing">
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Statement?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete "{statement.filename}" and its extracted data.
                                                        This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(statement.id, statement.file_path)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
