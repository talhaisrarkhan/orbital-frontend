import { useState, useCallback } from 'react';
import axios, {  endpoints } from 'src/utils/axios';


import type { IChatMessage } from 'src/types/chat';

// ----------------------------------------------------------------------

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

interface UseChatFileUploadReturn {
    uploadFile: (file: File, roomId: string, type?: 'file' | 'image') => Promise<IChatMessage>;
    uploads: UploadProgress[];
    isUploading: boolean;
    cancelUpload: (fileName: string) => void;
}

export function useChatFileUpload(): UseChatFileUploadReturn {
    const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
    const [cancelTokens] = useState<Map<string, AbortController>>(new Map());

    const uploadFile = useCallback(
        async (file: File, roomId: string, type: 'file' | 'image' = 'file'): Promise<IChatMessage> => {
            const uploadId = `${Date.now()}-${file.name}`;
            const controller = new AbortController();
            cancelTokens.set(uploadId, controller);

            // Initialize upload tracking
            setUploads((prev) => {
                const updated = new Map(prev);
                updated.set(uploadId, {
                    fileName: file.name,
                    progress: 0,
                    status: 'uploading',
                });
                return updated;
            });

            // Determine type based on file MIME type if not explicitly set
            const finalType = type === 'image' || file.type.startsWith('image/') ? 'image' : 'file';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('roomId', roomId);
            formData.append('type', finalType);
            formData.append('content', file.name);

            try {
                const response = await axios.post<{ message: IChatMessage }>(
                    endpoints.chat.upload,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                        signal: controller.signal,
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);

                                setUploads((prev) => {
                                    const updated = new Map(prev);
                                    const current = updated.get(uploadId);
                                    if (current) {
                                        updated.set(uploadId, { ...current, progress });
                                    }
                                    return updated;
                                });
                            }
                        },
                    }
                );

                // Mark as success
                setUploads((prev) => {
                    const updated = new Map(prev);
                    const current = updated.get(uploadId);
                    if (current) {
                        updated.set(uploadId, { ...current, status: 'success', progress: 100 });
                    }
                    return updated;
                });

                // Remove from tracking after 2 seconds
                setTimeout(() => {
                    setUploads((prev) => {
                        const updated = new Map(prev);
                        updated.delete(uploadId);
                        return updated;
                    });
                    cancelTokens.delete(uploadId);
                }, 2000);

                return response.data.message;
            } catch (error: any) {
                // Mark as error
                setUploads((prev) => {
                    const updated = new Map(prev);
                    const current = updated.get(uploadId);
                    if (current) {
                        updated.set(uploadId, {
                            ...current,
                            status: 'error',
                            error: error.response?.data?.message || error.message || 'Upload failed',
                        });
                    }
                    return updated;
                });

                // Remove error after 5 seconds
                setTimeout(() => {
                    setUploads((prev) => {
                        const updated = new Map(prev);
                        updated.delete(uploadId);
                        return updated;
                    });
                    cancelTokens.delete(uploadId);
                }, 5000);

                throw error;
            }
        },
        [cancelTokens]
    );

    const cancelUpload = useCallback(
        (fileName: string) => {
            // Find the upload by filename
            const entry = Array.from(uploads.entries()).find(([_, upload]) => upload.fileName === fileName);

            if (entry) {
                const [uploadId] = entry;
                const controller = cancelTokens.get(uploadId);

                if (controller) {
                    controller.abort();
                    cancelTokens.delete(uploadId);
                }

                setUploads((prev) => {
                    const updated = new Map(prev);
                    updated.delete(uploadId);
                    return updated;
                });
            }
        },
        [uploads, cancelTokens]
    );

    const isUploading = Array.from(uploads.values()).some((upload) => upload.status === 'uploading');

    return {
        uploadFile,
        uploads: Array.from(uploads.values()),
        isUploading,
        cancelUpload,
    };
}
