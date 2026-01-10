"use client";

/**
 * 预签名 URL 管理 Hook
 * 自动检查过期并刷新 URL
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getPresignedDownloadUrl } from "@/lib/storage-actions";

interface SignedUrlState {
  url: string | null;
  loading: boolean;
  error: string | null;
}

interface UseSignedUrlOptions {
  expiresIn?: number; // 有效期（秒），默认 2 分钟
  refreshBefore?: number; // 提前多少秒刷新，默认 30 秒
  fallbackUrl?: string; // 当没有 fileKey 时的默认 URL
}

export function useSignedUrl(
  fileKey: string | null | undefined,
  options: UseSignedUrlOptions = {}
) {
  const { expiresIn = 120, refreshBefore = 30, fallbackUrl } = options;
  
  const [state, setState] = useState<SignedUrlState>({
    url: null,
    loading: false,
    error: null,
  });
  
  const expiresAtRef = useRef<number>(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取新的预签名 URL
  const refreshUrl = useCallback(async () => {
    if (!fileKey) {
      setState({ url: fallbackUrl || null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getPresignedDownloadUrl(fileKey, expiresIn);
      expiresAtRef.current = result.expiresAt;
      setState({
        url: result.downloadUrl,
        loading: false,
        error: null,
      });

      // 设置定时器在过期前刷新
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      const refreshDelay = (expiresIn - refreshBefore) * 1000;
      if (refreshDelay > 0) {
        refreshTimerRef.current = setTimeout(() => {
          refreshUrl();
        }, refreshDelay);
      }
    } catch (error) {
      setState({
        url: null,
        loading: false,
        error: error instanceof Error ? error.message : "获取 URL 失败",
      });
    }
  }, [fileKey, expiresIn, refreshBefore, fallbackUrl]);

  // fileKey 变化时获取新 URL
  useEffect(() => {
    refreshUrl();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshUrl]);

  // 手动刷新
  const refresh = useCallback(() => {
    refreshUrl();
  }, [refreshUrl]);

  return {
    url: state.url,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
