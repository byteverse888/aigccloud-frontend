import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 从用户名显示文本中去除邮箱部分，只保留用户名。
 * 兼容以下几种常见格式：
 *  - "张三 <zhangsan@example.com>" -> "张三"
 *  - "张三 (zhangsan@example.com)" -> "张三"
 *  - "zhangsan@example.com"            -> "zhangsan"
 *  - "张三"                            -> "张三"
 */
export function stripEmailFromName(name?: string | null): string {
  if (!name) return '';
  const s = String(name).trim();
  if (!s) return '';
  // 格式：Name <email> 或 Name (email)
  const bracket = s.match(/^(.+?)\s*[<(][^<>()\s]+@[^<>()\s]+[>)]\s*$/);
  if (bracket) return bracket[1].trim();
  // 纯邮箱（如 user@x.com）：取 @ 前部分
  if (/^\S+@\S+\.[^\s@]+$/.test(s)) {
    return s.split('@')[0];
  }
  return s;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 复制文本到剪贴板，带 HTTP/非安全上下文的降级方案。
 * - 优先用 Clipboard API（HTTPS/localhost）
 * - 降级到 document.execCommand('copy')（HTTP 产环境可用）
 * @returns true = 复制成功
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  // 1. Clipboard API
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function' &&
      (typeof window === 'undefined' || window.isSecureContext !== false)
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 跌回 execCommand
  }
  // 2. execCommand 降级
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
