"use client";

/**
 * 文件上传 Hook
 * 使用预签名URL上传文件到S3兼容存储
 */

import { useState, useCallback } from "react";
import { getPresignedUploadUrl, getBatchPresignedUploadUrls } from "@/lib/storage-actions";

interface UploadProgress {
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  fileUrl?: string;
  fileKey?: string;
  error?: string;
}

interface UseFileUploadOptions {
  prefix?: string;
  userId?: string;
  isPublic?: boolean; // 是否公开访问（头像等场景）
  onSuccess?: (fileUrl: string, fileKey: string, filename: string) => void;
  onError?: (error: Error, filename: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { prefix = "uploads", userId, isPublic = false, onSuccess, onError } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);

  /**
   * 上传单个文件
   */
  const uploadFile = useCallback(
    async (file: File): Promise<{ fileUrl: string; fileKey: string } | null> => {
      setUploading(true);
      const filename = file.name;

      setProgress((prev) => [
        ...prev,
        { filename, progress: 0, status: "pending" },
      ]);

      try {
        // 1. 获取预签名URL（Server Action）
        const { uploadUrl, fileUrl, fileKey } = await getPresignedUploadUrl(
          filename,
          file.type || "application/octet-stream",
          prefix,
          userId,
          isPublic
        );

        setProgress((prev) =>
          prev.map((p) =>
            p.filename === filename ? { ...p, status: "uploading" } : p
          )
        );

        // 2. 使用预签名URL上传文件
        const response = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!response.ok) {
          throw new Error(`上传失败: ${response.status}`);
        }

        setProgress((prev) =>
          prev.map((p) =>
            p.filename === filename
              ? { ...p, progress: 100, status: "success", fileUrl, fileKey }
              : p
          )
        );

        onSuccess?.(fileUrl, fileKey, filename);
        return { fileUrl, fileKey };
      } catch (error) {
        const err = error instanceof Error ? error : new Error("上传失败");
        setProgress((prev) =>
          prev.map((p) =>
            p.filename === filename
              ? { ...p, status: "error", error: err.message }
              : p
          )
        );
        onError?.(err, filename);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [prefix, userId, onSuccess, onError]
  );

  /**
   * 批量上传文件
   */
  const uploadFiles = useCallback(
    async (
      files: File[]
    ): Promise<Array<{ fileUrl: string; fileKey: string; filename: string }>> => {
      setUploading(true);
      const results: Array<{ fileUrl: string; fileKey: string; filename: string }> = [];

      // 初始化进度
      setProgress(
        files.map((f) => ({
          filename: f.name,
          progress: 0,
          status: "pending" as const,
        }))
      );

      // 批量获取预签名URL
      const presignedUrls = await getBatchPresignedUploadUrls(
        files.map((f) => ({ filename: f.name, contentType: f.type })),
        prefix,
        userId
      );

      // 并行上传
      await Promise.all(
        files.map(async (file, index) => {
          const { uploadUrl, fileUrl, fileKey } = presignedUrls[index];

          setProgress((prev) =>
            prev.map((p, i) =>
              i === index ? { ...p, status: "uploading" } : p
            )
          );

          try {
            const response = await fetch(uploadUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type || "application/octet-stream",
              },
            });

            if (!response.ok) {
              throw new Error(`上传失败: ${response.status}`);
            }

            setProgress((prev) =>
              prev.map((p, i) =>
                i === index
                  ? { ...p, progress: 100, status: "success", fileUrl, fileKey }
                  : p
              )
            );

            results.push({ fileUrl, fileKey, filename: file.name });
            onSuccess?.(fileUrl, fileKey, file.name);
          } catch (error) {
            const err = error instanceof Error ? error : new Error("上传失败");
            setProgress((prev) =>
              prev.map((p, i) =>
                i === index ? { ...p, status: "error", error: err.message } : p
              )
            );
            onError?.(err, file.name);
          }
        })
      );

      setUploading(false);
      return results;
    },
    [prefix, userId, onSuccess, onError]
  );

  /**
   * 清除上传进度
   */
  const clearProgress = useCallback(() => {
    setProgress([]);
  }, []);

  return {
    uploadFile,
    uploadFiles,
    uploading,
    progress,
    clearProgress,
  };
}

/**
 * 获取文件访问URL
 * 对于公开文件，直接返回URL
 * 对于私有文件，获取预签名下载URL
 */
export async function getFileUrl(
  fileUrl: string,
  isPrivate: boolean = false,
  fileKey?: string
): Promise<string> {
  if (!isPrivate) {
    return fileUrl;
  }

  // 私有文件需要获取预签名下载URL
  if (fileKey) {
    const { getPresignedDownloadUrl } = await import("@/lib/storage-actions");
    const { downloadUrl } = await getPresignedDownloadUrl(fileKey);
    return downloadUrl;
  }

  return fileUrl;
}
