import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface FileUploadProps {
  bankProfileId: string;
  onUploadComplete: () => void;
}

export function FileUpload({ bankProfileId, onUploadComplete }: FileUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFiles = async () => {
    if (!user || files.length === 0) return;

    setUploading(true);

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
        )
      );

      try {
        const filePath = `${user.id}/${bankProfileId}/${Date.now()}-${uploadFile.file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('statements')
          .upload(filePath, uploadFile.file);

        if (uploadError) throw uploadError;

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f))
        );

        // Create statement record
        const { data: statementData, error: statementError } = await supabase
          .from('statements')
          .insert({
            user_id: user.id,
            bank_profile_id: bankProfileId,
            filename: uploadFile.file.name,
            file_path: filePath,
            file_size: uploadFile.file.size,
            status: 'queued',
          })
          .select()
          .single();

        if (statementError) throw statementError;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'processing' as const, progress: 75 } : f
          )
        );

        // Trigger processing via edge function
        const { error: processError } = await supabase.functions.invoke('process-statement', {
          body: { statementId: statementData.id },
        });

        if (processError) {
          console.error('Processing error:', processError);
          // Still mark as completed since the file was uploaded
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'completed' as const, progress: 100 } : f
          )
        );
      } catch (error: any) {
        console.error('Upload error:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'failed' as const, error: error.message }
              : f
          )
        );
      }
    }

    setUploading(false);
    toast.success('Files uploaded successfully');
    onUploadComplete();
  };

  const pendingFiles = files.filter((f) => f.status === 'pending');
  const hasCompletedFiles = files.some((f) => f.status === 'completed');

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-1">
          {isDragActive ? 'Drop your files here' : 'Drag & drop PDF statements'}
        </p>
        <p className="text-sm text-muted-foreground">or click to browse (max 10MB per file)</p>
      </div>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadFile.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={uploadFile.progress} className="h-1.5 flex-1" />
                    <Badge
                      variant={
                        uploadFile.status === 'completed'
                          ? 'default'
                          : uploadFile.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {uploadFile.status === 'pending' && 'Ready'}
                      {uploadFile.status === 'uploading' && 'Uploading...'}
                      {uploadFile.status === 'processing' && 'Processing...'}
                      {uploadFile.status === 'completed' && 'Done'}
                      {uploadFile.status === 'failed' && 'Failed'}
                    </Badge>
                  </div>
                  {uploadFile.error && (
                    <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>
                  )}
                </div>
                {uploadFile.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {uploadFile.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                {uploadFile.status === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
              </div>
            ))}

            {pendingFiles.length > 0 && (
              <Button onClick={uploadFiles} disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
