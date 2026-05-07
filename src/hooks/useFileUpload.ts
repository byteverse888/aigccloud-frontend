"use client";

/**
 * 文件上传 Hook
 * 通过后端预签名URL上传文件到S3兼容存储（密钥不下发到前端）
 */

import { useState, useCallback } from "react";
import { storageApi } from "@/lib/api";
import { useAuthStore } from "@/store";

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
  /** @deprecated 后端从 JWT 解析 userId，此参数不再使用 */
  userId?: string;
  isPublic?: boolean; // 是否公开访问（头像等场景返回短时签名URL）
  onSuccess?: (fileUrl: string, fileKey: string, filename: string) => void;
  onError?: (error: Error, filename: string) => void;
}

/** 从 store 取 JWT Token */
function getToken(): string | null {
  return useAuthStore.getState().user?.jwtToken || null;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { prefix = "uploads", isPublic = false, onSuccess, onError } = options;
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
        const token = getToken();
        if (!token) throw new Error("未登录，无法上传");

        // 1. 向后端请求预签名上传URL
        const presign = await storageApi.presignUpload({
          filename,
          content_type: file.type || "application/octet-stream",
          prefix,
        });

        const uploadUrl = presign.upload_url;
        let fileUrl = presign.file_url;
        const fileKey = presign.file_key;

        setProgress((prev) =>
          prev.map((p) =>
            p.filename === filename ? { ...p, status: "uploading" } : p
          )
        );

        // 2. 使用预签名URL直传到S3
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

        // 3. 公开访问场景（如头像）：换成短时签名下载URL
        if (isPublic) {
          try {
            const download = await storageApi.presignDownload(fileKey);
            fileUrl = download.download_url;
          } catch {
            // 获取签名URL失败，退化为原始file_url
          }
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
    [prefix, isPublic, onSuccess, onError]
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

      const token = getToken();
      if (!token) {
        setUploading(false);
        onError?.(new Error("未登录，无法上传"), files[0]?.name || "");
        return results;
      }

      // 向后端批量获取预签名URL
      const presignResp = await storageApi.presignBatchUpload({
        files: files.map((f) => ({
          filename: f.name,
          content_type: f.type || "application/octet-stream",
        })),
        prefix,
      });
      const presignedFiles = presignResp.files;

      // 并行上传
      await Promise.all(
        files.map(async (file, index) => {
          const item = presignedFiles[index];
          const uploadUrl = item.upload_url;
          const fileUrl = item.file_url;
          const fileKey = item.file_key;

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
    [prefix, onSuccess, onError]
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

  if (fileKey) {
    const token = getToken();
    if (!token) return fileUrl;
    try {
      const { download_url } = await storageApi.presignDownload(fileKey);
      return download_url;
    } catch {
      return fileUrl;
    }
  }

  return fileUrl;
}
