'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreateWalletDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CreateWalletDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证密码
    if (password.length < 6) {
      setError('密码至少6个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    try {
      await onConfirm(password);
      // 成功后清空表单
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError((err as Error).message || '创建失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建钱包密码</DialogTitle>
          <DialogDescription>
            请设置一个密码来加密您的钱包。密码用于保护您的钱包安全，转账时需要使用。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">钱包密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              disabled={isLoading}
            />
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              请务必牢记此密码！密码用于加密存储您的钱包，遗失后无法找回。
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '确认创建'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
