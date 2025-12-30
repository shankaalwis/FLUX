import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileUpload } from '@/components/ui/file-upload';
import { StatementCard } from './StatementCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload as UploadIcon } from 'lucide-react';

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

interface StatementUploadProps {
    profileId: string;
}

export function StatementUpload({ profileId }: StatementUploadProps) {
    const { user } = useAuth();
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        setUploading(true);

        for (const file of selectedFiles) {
            try {
                // Upload to Supabase Storage
                const filePath = `${user!.id}/${profileId}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('statements')
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                // Create statement record
                const { data: insertData, error: insertError } = await supabase
                    .from('statements')
                    .insert({
                        bank_profile_id: profileId,
                        user_id: user!.id,
                        filename: file.name,
                        file_path: filePath,
                        file_size: file.size,
                        file_size: file.size,
                        status: 'queued',
                    })
                    .select();

                if (insertError) {
                    throw insertError;
                }

                toast.success(`${file.name} uploaded successfully`);

                // Trigger processing
                const { error: invokeError } = await supabase.functions.invoke('process-statement', {
                    body: { statementId: insertData[0].id }
                });

                if (invokeError) {
                    console.error('Error invoking function:', invokeError);
                    toast.error('Failed to start processing');

                    // Update status to failed so user knows
                    await supabase
                        .from('statements')
                        .update({
                            status: 'failed',
                            error_message: invokeError.message || 'Failed to trigger processing'
                        })
                        .eq('id', insertData[0].id);

                    // Refresh list to show failed status
                    fetchStatements();
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setUploading(false);
        setSelectedFiles([]);
        fetchStatements();
    };

    const handleDelete = async (statementId: string, filePath: string) => {
        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('statements')
                .remove([filePath]);

            if (storageError) {
                throw storageError;
            }

            // Delete from database
            const { error: dbError } = await supabase
                .from('statements')
                .delete()
                .eq('id', statementId);

            if (dbError) {
                throw dbError;
            }

            setStatements(statements.filter(s => s.id !== statementId));
            toast.success('Statement deleted');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete statement');
        }
    };

    const handleRetry = async (statementId: string) => {
        try {
            const { error } = await supabase
                .from('statements')
                .update({ status: 'queued', error_message: null })
                .eq('id', statementId);

            if (error) {
                throw error;
            }

            toast.success('Statement queued for reprocessing');

            // Trigger processing
            const { error: invokeError } = await supabase.functions.invoke('process-statement', {
                body: { statementId }
            });

            if (invokeError) {
                console.error('Error invoking function:', invokeError);
                toast.error('Failed to start processing');

                // Update status to failed
                await supabase
                    .from('statements')
                    .update({
                        status: 'failed',
                        error_message: invokeError.message || 'Failed to trigger processing'
                    })
                    .eq('id', statementId);
            }

            fetchStatements();
        } catch (error) {
            console.error('Retry error:', error);
            toast.error('Failed to retry processing');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Statements</CardTitle>
                    <CardDescription>
                        Upload PDF bank statements to extract and analyze transactions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FileUpload
                        onFilesSelected={setSelectedFiles}
                        disabled={uploading}
                    />
                    {selectedFiles.length > 0 && (
                        <Button onClick={handleUpload} disabled={uploading} className="w-full">
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="h-4 w-4 mr-2" />
                                    Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Statements List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                    Uploaded Statements ({statements.length})
                </h3>
                {statements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No statements uploaded yet. Upload your first statement to get started.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {statements.map((statement) => (
                            <StatementCard
                                key={statement.id}
                                statement={statement}
                                onDelete={() => handleDelete(statement.id, statement.file_path)}
                                onRetry={() => handleRetry(statement.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
