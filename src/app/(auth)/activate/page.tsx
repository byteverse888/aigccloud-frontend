'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在激活您的账户...');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('激活链接无效');
      return;
    }

    // 调用激活接口
    const activate = async () => {
      try {
        const result = await authApi.emailActivate(token);
        if (result.success) {
          setStatus('success');
          setMessage('邮箱激活成功！');
          setEmail(result.email);
          toast.success('激活成功，请登录');
        } else {
          setStatus('error');
          setMessage('激活失败，请重试');
        }
      } catch (error) {
        setStatus('error');
        setMessage((error as Error).message || '激活失败');
        toast.error((error as Error).message || '激活失败');
      }
    };

    activate();
  }, [searchParams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && '激活中'}
            {status === 'success' && '激活成功'}
            {status === 'error' && '激活失败'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <>
              <p className="text-sm text-muted-foreground">
                您的邮箱 <strong>{email}</strong> 已成功激活
              </p>
              <p className="text-sm text-muted-foreground">
                现在您可以登录使用了
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                前往登录
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-sm text-destructive">{message}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/register')} className="flex-1">
                  重新注册
                </Button>
                <Button onClick={() => router.push('/login')} className="flex-1">
                  返回登录
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ActivatePage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-10">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <ActivateContent />
      </Suspense>
    </div>
  );
}
