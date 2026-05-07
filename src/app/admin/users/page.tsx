'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, UserCheck, UserX, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

const roleLabels: Record<string, string> = {
  user: '普通用户',
  operator: '运营用户',
  channel: '渠道用户',
  admin: '管理员',
};

const statusLabels: Record<string, string> = {
  active: '正常',
  inactive: '未激活',
  banned: '已封禁',
};

const statusColors: Record<string, 'success' | 'default' | 'destructive'> = {
  active: 'success',
  inactive: 'default',
  banned: 'destructive',
};

interface UserRow {
  objectId: string;
  username: string;
  email: string;
  role: string;
  level: number;
  memberLevel: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listUsers({ page, limit });
      const rows = (result.data || []).map((u: Record<string, unknown>) => ({
        objectId: u.objectId as string,
        username: (u.username as string) || '',
        email: (u.email as string) || '',
        role: (u.role as string) || 'user',
        level: (u.level as number) || 1,
        memberLevel: (u.memberLevel as string) || 'normal',
        status: (u.status as string) || 'active',
        createdAt: (u.createdAt as string) || '',
      }));
      setUsers(rows);
      setTotal(result.total);
    } catch (e) {
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  // 前端搜索过滤（当前页）
  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
        <p className="text-muted-foreground">管理平台用户账号</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>用户列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">用户名</th>
                      <th className="p-3 text-left text-sm font-medium">邮箱</th>
                      <th className="p-3 text-left text-sm font-medium">角色</th>
                      <th className="p-3 text-left text-sm font-medium">等级</th>
                      <th className="p-3 text-left text-sm font-medium">会员</th>
                      <th className="p-3 text-left text-sm font-medium">状态</th>
                      <th className="p-3 text-left text-sm font-medium">注册时间</th>
                      <th className="p-3 text-left text-sm font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.objectId} className="border-b">
                        <td className="p-3 text-sm">{user.username}</td>
                        <td className="p-3 text-sm">{user.email}</td>
                        <td className="p-3 text-sm">{roleLabels[user.role] || user.role}</td>
                        <td className="p-3 text-sm">Lv.{user.level}</td>
                        <td className="p-3 text-sm">
                          <Badge variant={user.memberLevel !== 'normal' ? 'default' : 'outline'}>
                            {user.memberLevel === 'normal' ? '普通' : user.memberLevel.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant={statusColors[user.status] || 'default'}>
                            {statusLabels[user.status] || user.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-3 text-sm">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <UserCheck className="mr-2 h-4 w-4" />
                                编辑用户
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <UserX className="mr-2 h-4 w-4" />
                                封禁用户
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  共 {total} 条记录
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <span className="flex items-center text-sm px-2">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
