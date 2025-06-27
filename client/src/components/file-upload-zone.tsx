import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FileText, Image, FileX, Check, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

interface UploadedFile extends File {
  id?: string;
  status?: 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error';
  progress?: number;
}

export function FileUploadZone() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentsData } = useQuery({
    queryKey: ['/api/documents'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const response = await apiRequest('POST', '/api/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Files uploaded successfully",
        description: "Your documents are being processed by AI",
      });
      setUploadingFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingFiles([]);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate file types
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/plain', 'application/pdf'];
    const invalidFiles = acceptedFiles.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file types",
        description: "Only PNG, JPG, PDF, and TXT files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "Files too large",
        description: "Files must be smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(acceptedFiles.map(file => ({ ...file, status: 'uploading', progress: 0 })));
    uploadMutation.mutate(acceptedFiles);
  }, [toast, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 10
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="text-blue-600 text-sm" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="text-red-600 text-sm" />;
    } else {
      return <FileText className="text-gray-600 text-sm" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <Check className="text-success-green text-sm" />;
      case 'processing':
        return <Clock className="text-blue-600 text-sm animate-spin" />;
      case 'error':
        return <FileX className="text-red-600 text-sm" />;
      default:
        return <Clock className="text-gray-400 text-sm" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-50 text-success-green';
      case 'processing':
        return 'bg-blue-50 text-blue-600';
      case 'error':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const documents = documentsData?.documents || [];
  const allFiles = [...uploadingFiles, ...documents];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload School Communications</h2>
          <span className="text-sm text-gray-500">PNG, JPG, PDF, TXT</span>
        </div>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive ? 'border-google-blue bg-blue-50' : 'border-gray-300 hover:border-google-blue'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <CloudUpload className="text-google-blue text-xl" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Support for images, PDFs, and text documents</p>
            </div>
            <Button className="bg-google-blue hover:bg-blue-700">
              <CloudUpload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </div>

        {/* File List */}
        {allFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadingFiles.map((file, index) => (
              <div key={`uploading-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadMutation.isPending && (
                    <div className="flex items-center space-x-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-google-blue border-t-transparent"></div>
                      <span className="text-xs text-gray-500">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {documents.map((doc: Document) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                    <p className="text-xs text-gray-500">{(doc.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(doc.status)}`}>
                    {doc.status === 'processed' ? 'Processed' : 
                     doc.status === 'processing' ? 'Processing...' : 
                     doc.status === 'error' ? 'Error' : 'Uploaded'}
                  </span>
                  {getStatusIcon(doc.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
