
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
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { BankProfile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StatementUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bankProfiles: BankProfile[];
    onUploadComplete: () => void;
}

export function StatementUploadDialog({ open, onOpenChange, bankProfiles, onUploadComplete }: StatementUploadDialogProps) {
    const { user } = useAuth();
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

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

        for (const file of files) {
            try {
                // Upload to Storage
                const filePath = `${user!.id}/${selectedProfileId}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('statements')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Create record
                const { data, error: dbError } = await supabase
                    .from('statements')
                    .insert({
                        bank_profile_id: selectedProfileId,
                        user_id: user!.id,
                        filename: file.name,
                        file_path: filePath,
                        file_size: file.size,
                        status: 'queued'
                    })
                    .select()
                    .single();

                if (dbError) throw dbError;

                // Trigger processing
                const { error: invokeError } = await supabase.functions.invoke('process-statement', {
                    body: { statementId: data.id }
                });

                if (invokeError) {
                    console.error('Processing trigger failed:', invokeError);
                    // Mark as failed but don't stop loop
                    await supabase
                        .from('statements')
                        .update({ status: 'failed', error_message: 'Failed to start processing' })
                        .eq('id', data.id);
                }

                toast.success(`${file.name} uploaded successfully`);

            } catch (error) {
                console.error('Upload failed:', error);
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setUploading(false);
        setFiles([]);
        onOpenChange(false);
        onUploadComplete();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Statements</DialogTitle>
                    <DialogDescription>
                        Select a bank account and upload your PDF statements.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Bank Account</Label>
                        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
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
                        <Label>Files</Label>
                        <FileUpload onFilesSelected={setFiles} />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload {files.length > 0 ? `(${files.length})` : ''}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
