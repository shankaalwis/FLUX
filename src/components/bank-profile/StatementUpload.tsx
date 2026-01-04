
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { BankProfile } from '@/types/database';
import { StatementTable } from '@/components/statements/StatementTable';
import { StatementUploadDialog } from '@/components/statements/StatementUploadDialog';

interface Statement {
    id: string;
    filename: string;
    file_path: string;
    file_size: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    error_message: string | null;
    created_at: string;
    processed_at: string | null;
    statement_start_date: string | null;
    statement_end_date: string | null;
    bank_profile_id: string;
}

interface StatementUploadProps {
    profileId: string;
}

export function StatementUpload({ profileId }: StatementUploadProps) {
    const { user } = useAuth();
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [profile, setProfile] = useState<BankProfile | null>(null);

    // Fetch profile details to pass to dialog (needed for 'bankProfiles' array prop of Dialog)
    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase.from('bank_profiles').select('*').eq('id', profileId).single();
            if (data) setProfile(data as BankProfile);
        };
        fetchProfile();
    }, [profileId]);

    useEffect(() => {
        fetchStatements();
    }, [profileId]);

    const fetchStatements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('statements')
            .select('*')
            .eq('bank_profile_id', profileId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching statements:', error);
            toast.error('Failed to load statements');
        } else {
            setStatements(data as Statement[]);
        }
        setLoading(false);
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

    const handleDeleteMany = async (items: { id: string, path: string }[]) => {
        try {
            const paths = items.map(i => i.path);
            const ids = items.map(i => i.id);

            const { error: storageError } = await supabase.storage.from('statements').remove(paths);
            if (storageError) throw storageError;

            const { error: dbError } = await supabase.from('statements').delete().in('id', ids);
            if (dbError) throw dbError;

            setStatements(prev => prev.filter(s => !ids.includes(s.id)));
            toast.success(`${ids.length} statements deleted`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete statements');
        }
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

    if (loading && !profile) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Statements</h3>
                <Button onClick={() => setShowUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Statement
                </Button>
            </div>

            <StatementTable
                statements={statements}
                loading={loading}
                bankProfiles={profile ? [profile] : []}
                onRetry={handleRetry}
                onDelete={handleDelete}
                onDeleteMany={handleDeleteMany}
            />

            {profile && (
                <StatementUploadDialog
                    open={showUpload}
                    onOpenChange={setShowUpload}
                    bankProfiles={[profile]}
                    defaultProfileId={profile.id}
                    onUploadComplete={fetchStatements}
                />
            )}
        </div>
    );
}
