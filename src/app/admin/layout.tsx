'use client';

import { AdminShell } from '@/components/admin/admin-shell';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  ClipboardList,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react';

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: '数据看板' },
  { href: '/admin/statistics', icon: BarChart3, label: '运营统计' },
  { href: '/admin/users', icon: Users, label: '用户管理' },
  { href: '/admin/roles', icon: Shield, label: '角色管理' },
  { href: '/admin/products', icon: Package, label: '商品管理' },
  { href: '/admin/orders', icon: ShoppingCart, label: '订单管理' },
  { href: '/admin/tasks', icon: ClipboardList, label: '任务中心' },
  { href: '/admin/settings', icon: Settings, label: '系统设置' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell
      navItems={adminNavItems}
      title="管理后台"
      icon={Sparkles}
      iconColor="bg-primary text-primary-foreground"
      allowedRoles={['admin']}
      basePath="/admin"
    >
      {children}
    </AdminShell>
  );
}
