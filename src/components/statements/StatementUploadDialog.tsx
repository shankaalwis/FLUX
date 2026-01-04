
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { BankProfile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { extractTextFromPdf } from '@/lib/pdf-utils';
import { formatCurrency } from '@/lib/formatters';

interface StatementUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bankProfiles: BankProfile[];
    onUploadComplete: () => void;
    defaultProfileId?: string;
}

export function StatementUploadDialog({ open, onOpenChange, bankProfiles, onUploadComplete, defaultProfileId }: StatementUploadDialogProps) {
    const { user } = useAuth();
    const [selectedProfileId, setSelectedProfileId] = useState<string>(defaultProfileId || '');
    const [files, setFiles] = useState<File[]>([]);
    const [password, setPassword] = useState('');
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const handleUpload = async () => {
        if (!selectedProfileId) {
            toast.error('Please select a bank account');
            return;
        }
        if (files.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        setUploading(true);
        const newResults: any[] = [];

        for (const file of files) {
            try {
                // 1. Extract Text Client-Side (handles password)
                const textContent = await extractTextFromPdf(file, password);

                // 2. Upload to Storage
                const filePath = `${user!.id}/${selectedProfileId}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('statements')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 3. Create record
                const { data: statementData, error: dbError } = await supabase
                    .from('statements')
                    .insert({
                        bank_profile_id: selectedProfileId,
                        user_id: user!.id,
                        filename: file.name,
                        file_path: filePath,
                        file_size: file.size,
                        status: 'processing' // Optimistically set processing
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                // 4. Trigger processing with TEXT CONTENT
                const { data: processedData, error: invokeError } = await supabase.functions.invoke('process-statement', {
                    body: {
                        statementId: statementData.id,
                        textContent: textContent,
                        saveToDb: true
                    }
                });

                if (invokeError) {
                    await supabase.from('statements').update({ status: 'failed', error_message: 'Processing failed' }).eq('id', statementData.id);
                    throw invokeError;
                }

                if (!processedData.success) {
                    await supabase.from('statements').update({ status: 'failed', error_message: processedData.error }).eq('id', statementData.id);
                    throw new Error(processedData.error);
                }

                newResults.push({
                    filename: file.name,
                    status: 'success',
                    summary: processedData.summary
                });
                toast.success(`${file.name} processed successfully`);

            } catch (error: any) {
                console.error('Upload/Process failed:', error);
                newResults.push({
                    filename: file.name,
                    status: 'error',
                    error: error.message
                });
                toast.error(`Failed to process ${file.name}`);
            }
        }

        setResults(newResults);
        setUploading(false);
        setFiles([]);
        setPassword('');
        onUploadComplete();
    };

    const handleClose = () => {
        setResults([]);
        setFiles([]);
        setPassword('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Statements</DialogTitle>
                    <DialogDescription>
                        Select a bank account and upload your PDF statements.
                    </DialogDescription>
                </DialogHeader>

                {results.length > 0 ? (
                    <div className="space-y-4 py-4">
                        <h3 className="font-semibold text-lg">Processing complete</h3>
                        <div className="space-y-3">
                            {results.map((res, idx) => (
                                <div key={idx} className="border rounded-lg p-4 bg-card/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        {res.status === 'success' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        <span className="font-medium">{res.filename}</span>
                                    </div>

                                    {res.status === 'success' && res.summary && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">

                                            <div>
                                                <div className="text-muted-foreground text-xs">Total Debits</div>
                                                <div className="font-mono text-red-500">{formatCurrency(res.summary.total_debits || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-xs">Total Credits</div>
                                                <div className="font-mono text-green-500">{formatCurrency(res.summary.total_credits || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-xs">Opening Balance</div>
                                                <div className="font-mono">{formatCurrency(res.summary.opening_balance || 0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground text-xs">Closing Balance</div>
                                                <div className="font-mono">{formatCurrency(res.summary.closing_balance || 0)}</div>
                                            </div>
                                        </div>
                                    )}
                                    {res.status === 'error' && (
                                        <p className="text-sm text-destructive mt-1">{res.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleClose}>Done</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bank Account</Label>
                                    <Select
                                        value={selectedProfileId}
                                        onValueChange={setSelectedProfileId}
                                        disabled={!!defaultProfileId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankProfiles.map(profile => (
                                                <SelectItem key={profile.id} value={profile.id}>
                                                    {profile.name} ({profile.bank_name})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>PDF Password (Optional)</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="If files are encrypted"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Files</Label>
                                <FileUpload onFilesSelected={setFiles} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload & Process {files.length > 0 ? `(${files.length})` : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
