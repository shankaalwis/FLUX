import { BankProfile } from '@/types/database';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Eye, Trash2, FileText, ArrowUpDown } from 'lucide-react';
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

interface AccountCardProps {
    profile: BankProfile & {
        statements?: { count: number }[];
        transactions?: { count: number }[];
    };
    onView: () => void;
    onDelete: () => void;
}

export function AccountCard({ profile, onView, onDelete }: AccountCardProps) {
    const statementCount = profile.statements?.[0]?.count || 0;
    const transactionCount = profile.transactions?.[0]?.count || 0;

    const getAccountTypeColor = (type: string) => {
        switch (type) {
            case 'checking':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
            case 'savings':
                return 'bg-green-500/10 text-green-700 dark:text-green-400';
            case 'credit':
                return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
            case 'investment':
                return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
            default:
                return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
        }
    };

    const getAccountTypeIcon = (type: string) => {
        switch (type) {
            case 'credit':
                return <CreditCard className="h-4 w-4" />;
            default:
                return <Building2 className="h-4 w-4" />;
        }
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            {getAccountTypeIcon(profile.account_type)}
                            {profile.bank_name}
                        </CardDescription>
                    </div>
                    <Badge className={`${getAccountTypeColor(profile.account_type)} capitalize`} variant="secondary">
                        {profile.account_type}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{statementCount} statement{statementCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowUpDown className="h-4 w-4" />
                        <span>{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                {profile.updated_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                        Updated {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button onClick={onView} className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete "{profile.name}" and all associated statements and transactions.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
