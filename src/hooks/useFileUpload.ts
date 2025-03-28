import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UseFileUploadOptions {
  bucket: 'documents' | 'recordings';
  allowedTypes: string[];
  maxSizeMB?: number;
}

export const useFileUpload = ({ bucket, allowedTypes, maxSizeMB = 50 }: UseFileUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File, userId: string) => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      const fileName = `${userId}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [bucket, allowedTypes, maxSizeMB]);

  return {
    upload,
    isUploading,
    progress
  };
};
