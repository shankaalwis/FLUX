import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
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

interface Statement {
    id: string;
    filename: string;
    file_size: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    error_message: string | null;
    created_at: string;
    processed_at: string | null;
    statement_start_date: string | null;
    statement_end_date: string | null;
}

interface StatementCardProps {
    statement: Statement;
    onDelete: () => void;
    onRetry: () => void;
}

export function StatementCard({ statement, onDelete, onRetry }: StatementCardProps) {
    const getStatusBadge = () => {
        switch (statement.status) {
            case 'completed':
                return (
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'processing':
                return (
                    <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            case 'queued':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Queued
                    </Badge>
                );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{statement.filename}</h4>
                                {getStatusBadge()}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Size: {formatFileSize(statement.file_size)}</p>
                                <p>Uploaded: {formatDate(statement.created_at)}</p>
                                {statement.statement_start_date && statement.statement_end_date && (
                                    <p>
                                        Period: {formatDate(statement.statement_start_date)} - {formatDate(statement.statement_end_date)}
                                    </p>
                                )}
                                {statement.processed_at && (
                                    <p>Processed: {formatDate(statement.processed_at)}</p>
                                )}
                                {statement.error_message && (
                                    <p className="text-destructive">Error: {statement.error_message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        {statement.status === 'failed' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Statement?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete "{statement.filename}" and all associated transactions.
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
