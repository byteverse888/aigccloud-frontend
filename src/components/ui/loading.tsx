'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
    </div>
  );
}

interface LoadingProps {
  text?: string;
}

export function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loading />
    </div>
  );
}
