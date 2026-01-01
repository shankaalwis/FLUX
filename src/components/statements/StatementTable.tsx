
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
}

export function StatementTable({ statements, loading, bankProfiles, onRetry, onDelete }: StatementTableProps) {
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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {statements.map((statement) => (
                        <TableRow key={statement.id}>
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
    );
}
