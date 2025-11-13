'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  onUpload,
  accept = 'image/*,application/pdf,.doc,.docx',
  maxSize = 10,
  maxFiles = 10,
  multiple = true,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`;
    }

    // Check file type
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const fileExtension = `.${file.name.split('.').pop()}`;
      const mimeType = file.type;

      const isAccepted = acceptedTypes.some(
        (type) =>
          type === mimeType ||
          type === fileExtension ||
          (type.endsWith('/*') && mimeType.startsWith(type.replace('/*', '')))
      );

      if (!isAccepted) {
        return `El tipo de archivo ${file.name} no está permitido`;
      }
    }

    return null;
  };

  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Calculate new dimensions (max 1920x1920)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create a new File from the blob
                const compressedFile = new (File as any)([blob], file.name, {
                  type: 'image/jpeg',
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles = Array.from(fileList);

      // Check max files limit
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Solo puedes subir un máximo de ${maxFiles} archivos`);
        return;
      }

      // Validate and compress files
      const validatedFiles: UploadedFile[] = [];
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          continue;
        }

        // Compress images
        const processedFile = await compressImage(file);

        // Create preview for images
        let preview: string | undefined;
        if (processedFile.type.startsWith('image/')) {
          preview = URL.createObjectURL(processedFile);
        }

        validatedFiles.push({
          file: processedFile,
          preview,
          progress: 0,
          status: 'pending',
        });
      }

      setFiles((prev) => [...prev, ...validatedFiles]);

      // Upload files
      try {
        await onUpload(validatedFiles.map((f) => f.file));
        setFiles((prev) =>
          prev.map((f) =>
            validatedFiles.includes(f) ? { ...f, status: 'success', progress: 100 } : f
          )
        );
        toast.success('Archivos subidos exitosamente');
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            validatedFiles.includes(f)
              ? { ...f, status: 'error', error: 'Error al subir archivo' }
              : f
          )
        );
        toast.error('Error al subir algunos archivos');
      }
    },
    [files.length, maxFiles, onUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8" />;
    }
    return <File className="h-8 w-8" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          'cursor-pointer border-2 border-dashed p-8 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          'hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-2 text-sm font-medium">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-muted-foreground">
          Tamaño máximo: {maxSize}MB por archivo. Máximo {maxFiles} archivos.
        </p>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-4">
                {/* Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-muted-foreground">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progress */}
                  {uploadedFile.status === 'uploading' && (
                    <Progress value={uploadedFile.progress} className="mt-2" />
                  )}

                  {/* Error */}
                  {uploadedFile.status === 'error' && (
                    <p className="mt-1 text-xs text-red-500">
                      {uploadedFile.error}
                    </p>
                  )}

                  {/* Success */}
                  {uploadedFile.status === 'success' && (
                    <p className="mt-1 text-xs text-green-600">
                      Subido exitosamente
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'success' && uploadedFile.preview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(uploadedFile.preview, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
