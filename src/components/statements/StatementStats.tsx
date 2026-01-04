
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, AlertTriangle } from 'lucide-react';
import { Statement } from '@/types/database';

interface StatementStatsProps {
    statements: Statement[];
}

export function StatementStats({ statements }: StatementStatsProps) {
    const total = statements.length;
    const processing = statements.filter(s => s.status === 'processing' || s.status === 'queued').length;
    const failed = statements.filter(s => s.status === 'failed').length;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Statements</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{total}</div>
                    <p className="text-xs text-muted-foreground">Uploaded to the platform</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processing</CardTitle>
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{processing}</div>
                    <p className="text-xs text-muted-foreground">Processing for insights</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{failed}</div>
                    <p className="text-xs text-muted-foreground text-destructive">Require attention</p>
                </CardContent>
            </Card>
        </div>
    );
}
