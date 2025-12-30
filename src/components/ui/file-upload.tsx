import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    disabled?: boolean;
}

export function FileUpload({
    onFilesSelected,
    accept = { 'application/pdf': ['.pdf'] },
    maxSize = 10 * 1024 * 1024, // 10MB default
    multiple = true,
    disabled = false,
}: FileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedFiles(acceptedFiles);
        onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple,
        disabled,
    });

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-3">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    {isDragActive ? (
                        <p className="text-sm font-medium">Drop the files here...</p>
                    ) : (
                        <>
                            <p className="text-sm font-medium">
                                Drag & drop PDF files here, or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Maximum file size: {(maxSize / 1024 / 1024).toFixed(0)}MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {fileRejections.length > 0 && (
                <div className="text-sm text-destructive">
                    {fileRejections.map(({ file, errors }) => (
                        <div key={file.name}>
                            {file.name}: {errors.map(e => e.message).join(', ')}
                        </div>
                    ))}
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files:</p>
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                            <div className="flex items-center gap-3">
                                <File className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
