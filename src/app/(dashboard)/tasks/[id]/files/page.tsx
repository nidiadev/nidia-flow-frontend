'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { FileUpload } from '@/components/ui/file-upload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  FileText,
  File,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function TaskFilesPage() {
  const params = useParams();
  const taskId = params.id as string;
  const queryClient = useQueryClient();
  const [previewFile, setPreviewFile] = useState<TaskFile | null>(null);

  // Fetch task files
  const { data, isLoading } = useQuery({
    queryKey: ['task-files', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/files`);
      return response.data;
    },
  });

  const files: TaskFile[] = data?.data || [];

  // Upload files mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post(`/tasks/${taskId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      toast.success('Archivos subidos exitosamente');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al subir archivos'
      );
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/tasks/${taskId}/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      toast.success('Archivo eliminado');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar archivo'
      );
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleDownload = async (file: TaskFile) => {
    try {
      const response = await api.get(file.fileUrl, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error al descargar el archivo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">Archivos de la Tarea</h1>
        <p className="text-muted-foreground">
          Gestiona evidencias y documentos relacionados
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Subir Archivos</h2>
        <FileUpload
          onUpload={(files) => uploadMutation.mutateAsync(files)}
          accept="image/*,application/pdf,.doc,.docx"
          maxSize={10}
          maxFiles={10}
          multiple
        />
      </Card>

      {/* Files Gallery */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Archivos Subidos ({files.length})
          </h2>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Cargando archivos...</p>
          </Card>
        ) : files.length === 0 ? (
          <Card className="p-8 text-center">
            <File className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No hay archivos subidos aún
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                {/* Preview */}
                {file.fileType.startsWith('image/') ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                    {getFileIcon(file.fileType)}
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  <p className="mb-1 truncate font-medium" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>
                      {new Date(file.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Subido por: {file.uploadedBy.firstName}{' '}
                    {file.uploadedBy.lastName}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {file.fileType.startsWith('image/') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewFile(file)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm('¿Estás seguro de eliminar este archivo?')
                        ) {
                          deleteMutation.mutate(file.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="relative">
              <img
                src={previewFile.fileUrl}
                alt={previewFile.fileName}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
