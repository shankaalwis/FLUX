import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileUpload } from '@/components/ui/file-upload';
import { StatementCard } from './StatementCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload as UploadIcon } from 'lucide-react';
import { extractTextFromPDF } from '@/utils/pdf-extractor';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

    // Password handling state
    const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    // Summary calculation state
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryData, setSummaryData] = useState({ count: 0, totalAmount: 0 });

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

    const processFile = async (file: File, password?: string): Promise<boolean> => {
        try {
            toast.info(`Extracting text from ${file.name}...`);
            const textContent = await extractTextFromPDF(file, password);

            if (!textContent || textContent.length < 50) {
                throw new Error('No text content extracted from PDF. Is it a scanned image?');
            }

            toast.info(`Extracted ${textContent.length} characters. Analyzing...`);
            toast.info(`Processing ${file.name} with AI...`);

            // Create a "log" record without the actual file
            const { data: insertData, error: insertError } = await supabase
                .from('statements')
                .insert({
                    bank_profile_id: profileId,
                    user_id: user!.id,
                    filename: file.name,
                    file_path: 'PRIVACY_MODE_NO_STORAGE',
                    file_size: file.size,
                    status: 'processing',
                })
                .select();

            if (insertError) throw insertError;
            const statementId = insertData[0].id;

            // Send text directly to Edge Function
            const { error: invokeError, data: invokeData } = await supabase.functions.invoke('process-statement', {
                body: {
                    statementId,
                    textContent,
                    saveToDb: true
                }
            });

            if (invokeError) {
                throw invokeError;
            }

            if (!invokeData.success) {
                throw new Error(invokeData.error || 'Unknown error from processing function');
            }

            setSummaryData({
                count: invokeData.count,
                totalAmount: invokeData.totalAmount || 0
            });
            setSummaryOpen(true);
            toast.success(`${file.name} processed successfully`);
            return true;

        } catch (error: any) {
            if (error.message === 'PASSWORD_REQUIRED') {
                setPendingFile(file);
                setPasswordPromptOpen(true);
                setPasswordInput('');
                return false;
            }

            console.error('Processing error:', error);
            toast.error(`Failed to process ${file.name}: ${error.message}`);
            return false;
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        setUploading(true);

        for (const file of selectedFiles) {
            const success = await processFile(file);
            if (!success && pendingFile) {
                // Stopped for password, break loop to handle dialog
                // Note: logic implies only 1 password file handled at a time for simplicity
                setUploading(false);
                return;
            }
        }

        setUploading(false);
        setSelectedFiles([]);
        fetchStatements();
    };

    const handlePasswordSubmit = async () => {
        if (!pendingFile) return;

        setPasswordPromptOpen(false);
        setUploading(true);

        const success = await processFile(pendingFile, passwordInput);

        setUploading(false);

        if (success) {
            setPendingFile(null);
            // Remove the processed file from selection
            const remaining = selectedFiles.filter(f => f !== pendingFile);
            setSelectedFiles(remaining);
            if (remaining.length === 0) {
                fetchStatements();
            } else {
                // Optionally continue? For now user clicks upload again for remaining
                toast.info('Password accepted. You can continue uploading other files if any.');
                fetchStatements();
            }
        }
    };

    const handleDelete = async (statementId: string, filePath: string) => {
        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('statements')
                .remove([filePath]);

            // Note: failing storage delete is expected for privacy mode files (path doesn't exist)
            // So we generally ignore logging that error or treat as warning
            // if (storageError) throw storageError;

            // Delete associated transactions first (Manual Cascade)
            const { error: txError } = await supabase
                .from('transactions')
                .delete()
                .eq('statement_id', statementId);

            if (txError) {
                console.error('Error deleting transactions:', txError);
                // We proceed to delete statement even if tx delete fails (orphan cleanup potential), 
                // but ideally this should block. However, for UX we try to clean as much as possible.
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
                        Upload financial documents to reveal spending trends and insights
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
                            No financial data added yet. Upload documents to start tracking.
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

            {/* Password Prompt Dialog */}
            <Dialog open={passwordPromptOpen} onOpenChange={setPasswordPromptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Password Required</DialogTitle>
                        <DialogDescription>
                            The file "{pendingFile?.name}" is password protected. Please enter the password to continue.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="pdf-password">PDF Password</Label>
                        <Input
                            id="pdf-password"
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePasswordSubmit();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setPasswordPromptOpen(false);
                            setPendingFile(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handlePasswordSubmit}>
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Summary Dialog */}
            <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Processing Complete</DialogTitle>
                        <DialogDescription>
                            Successfully extracted transactions from the statement.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Transactions Extracted</span>
                            <span className="text-2xl font-bold">{summaryData.count}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Total Value</span>
                            <span className="text-2xl font-bold text-primary">Rs. {summaryData.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setSummaryOpen(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
