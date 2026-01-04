
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BankProfile, Statement } from '@/types/database';
import { StatementStats } from '@/components/statements/StatementStats';
import { StatementTable } from '@/components/statements/StatementTable';
import { StatementUploadDialog } from '@/components/statements/StatementUploadDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Upload, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface OutletContext {
    bankProfiles: BankProfile[];
}

export default function Statements() {
    const { user } = useAuth();
    const { bankProfiles } = useOutletContext<OutletContext>();
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProfile, setFilterProfile] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStatements();
        }
    }, [user]);

    const fetchStatements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('statements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching statements:', error);
            toast.error('Failed to load statements');
        } else {
            setStatements(data as Statement[]);
        }
        setLoading(false);
    };

    const handleRetry = async (id: string) => {
        try {
            const { error } = await supabase
                .from('statements')
                .update({ status: 'queued', error_message: null })
                .eq('id', id);

            if (error) throw error;

            toast.success('Queued for retry');
            // Trigger processing
            const { error: invokeError } = await supabase.functions.invoke('process-statement', {
                body: { statementId: id }
            });

            if (invokeError) {
                await supabase.from('statements').update({ status: 'failed', error_message: 'Retry trigger failed' }).eq('id', id);
                toast.error('Retry processing failed');
            }

            fetchStatements();
        } catch (error) {
            console.error(error);
            toast.error('Failed to retry');
        }
    };

    const handleDelete = async (id: string, path: string) => {
        try {
            const { error: storageError } = await supabase.storage.from('statements').remove([path]);
            if (storageError) throw storageError;

            const { error: dbError } = await supabase.from('statements').delete().eq('id', id);
            if (dbError) throw dbError;

            setStatements(prev => prev.filter(s => s.id !== id));
            toast.success('Statement deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete statement');
        }
    };

    const filteredStatements = statements.filter(s => {
        const matchesSearch = s.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProfile = filterProfile === 'all' || s.bank_profile_id === filterProfile;
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchesSearch && matchesProfile && matchesStatus;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Statements</h1>
                    <p className="text-muted-foreground">Manage your financial documents to unlock insights</p>
                </div>
                <Button onClick={() => setShowUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Statement
                </Button>
            </div>

            <StatementStats statements={statements} />

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by filename..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={filterProfile} onValueChange={setFilterProfile}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Accounts</SelectItem>
                            {bankProfiles.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="queued">Queued</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <StatementTable
                statements={filteredStatements}
                loading={loading}
                bankProfiles={bankProfiles}
                onRetry={handleRetry}
                onDelete={handleDelete}
            />

            <StatementUploadDialog
                open={showUpload}
                onOpenChange={setShowUpload}
                bankProfiles={bankProfiles}
                onUploadComplete={fetchStatements}
            />
        </div>
    );
}
