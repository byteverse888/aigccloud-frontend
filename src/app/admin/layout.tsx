'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  ClipboardList,
  LogOut,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: '数据看板' },
  { href: '/admin/users', icon: Users, label: '用户管理' },
  { href: '/admin/products', icon: Package, label: '商品审核' },
  { href: '/admin/orders', icon: ShoppingCart, label: '订单管理' },
  { href: '/admin/tasks', icon: ClipboardList, label: '任务中心' },
  { href: '/admin/settings', icon: Settings, label: '系统设置' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">管理后台</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="p-2 space-y-1">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <ChevronLeft className="h-5 w-5" />
              返回用户端
            </Button>
          </Link>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background px-6">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.username}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login');
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
