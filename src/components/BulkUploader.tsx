"use client";

import { useState, useRef, useCallback } from "react";
import {
  imagesApi,
  uploadFileToPresignedUrl,
  getImageDimensions,
  PresignedUpload,
} from "@/lib/api";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  presigned?: PresignedUpload;
}

interface BulkUploaderProps {
  eventId: string;
  onUploadComplete: () => void;
  onClose: () => void;
}

export default function BulkUploader({
  eventId,
  onUploadComplete,
  onClose,
}: BulkUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter((file) =>
      file.type.startsWith("image/")
    );

    const uploadFiles: UploadFile[] = imageFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const startUpload = async () => {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    setOverallProgress(0);

    const pendingFiles = files.filter((f) => f.status === "pending");
    const batchSize = 10; // Process 10 files at a time

    // Get presigned URLs in batches
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);

      // Get presigned URLs
      const { data, error } = await imagesApi.getPresignedUrls(
        eventId,
        batch.map((f) => ({
          filename: f.file.name,
          contentType: f.file.type,
        }))
      );

      if (error || !data) {
        batch.forEach((f) => {
          setFiles((prev) =>
            prev.map((pf) =>
              pf.id === f.id ? { ...pf, status: "error" } : pf
            )
          );
        });
        continue;
      }

      // Upload files in parallel
      const uploadPromises = batch.map(async (uploadFile, index) => {
        const presigned = data.uploads[index];

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "uploading", presigned }
              : f
          )
        );

        const success = await uploadFileToPresignedUrl(
          uploadFile.file,
          presigned.uploadUrl,
          (progress) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, progress } : f
              )
            );
          }
        );

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: success ? "success" : "error", progress: 100 }
              : f
          )
        );

        return { uploadFile, presigned, success };
      });

      const results = await Promise.all(uploadPromises);

      // Confirm successful uploads
      const successfulUploads = results.filter((r) => r.success);
      if (successfulUploads.length > 0) {
        const imagesToConfirm = await Promise.all(
          successfulUploads.map(async (r) => {
            try {
              const dimensions = await getImageDimensions(r.uploadFile.file);
              return {
                url: r.presigned.publicUrl,
                key: r.presigned.key,
                width: dimensions.width,
                height: dimensions.height,
                size: r.uploadFile.file.size,
              };
            } catch {
              return {
                url: r.presigned.publicUrl,
                key: r.presigned.key,
                size: r.uploadFile.file.size,
              };
            }
          })
        );

        await imagesApi.confirmUploads(eventId, imagesToConfirm);
      }

      // Update overall progress
      const totalProcessed = Math.min(i + batchSize, pendingFiles.length);
      setOverallProgress(Math.round((totalProcessed / pendingFiles.length) * 100));
    }

    setUploading(false);
    onUploadComplete();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Upload Photos</h3>
            <p className="text-muted text-sm mt-1">
              Select files or a folder to upload
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drop Zone */}
        {!uploading && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-6 hover:border-primary/50 transition-colors"
          >
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-foreground font-medium mb-2">
              Drag and drop photos here
            </p>
            <p className="text-muted text-sm mb-4">or</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary !w-auto !px-6 !py-2"
              >
                Select Files
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="btn btn-secondary !w-auto !px-6 !py-2"
              >
                Select Folder
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          </div>
        )}

        {/* Progress Bar (when uploading) */}
        {uploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-muted">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted">
                {files.length} files selected
                {successCount > 0 && (
                  <span className="text-success ml-2">• {successCount} uploaded</span>
                )}
                {errorCount > 0 && (
                  <span className="text-error ml-2">• {errorCount} failed</span>
                )}
              </span>
              {!uploading && (
                <button
                  onClick={clearAll}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadFile.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay */}
                  {uploadFile.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    </div>
                  )}
                  {uploadFile.status === "success" && (
                    <div className="absolute inset-0 bg-success/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {uploadFile.status === "error" && (
                    <div className="absolute inset-0 bg-error/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}

                  {/* Remove Button */}
                  {uploadFile.status === "pending" && !uploading && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* Progress Bar */}
                  {uploadFile.status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={uploading}
            className="btn btn-secondary !w-auto !px-6"
          >
            {uploading ? "Uploading..." : "Cancel"}
          </button>
          <button
            onClick={startUpload}
            disabled={pendingCount === 0 || uploading}
            className="btn btn-primary !w-auto !px-6"
          >
            {uploading ? (
              <span className="animate-pulse">Uploading {pendingCount} photos...</span>
            ) : (
              `Upload ${pendingCount} Photos`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
