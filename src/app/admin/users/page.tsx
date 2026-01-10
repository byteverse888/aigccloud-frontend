'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
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
import { Search, MoreVertical, UserCheck, UserX, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  level: number;
  isPaid: boolean;
  createdAt: string;
  status: 'active' | 'inactive' | 'banned';
}

const mockUsers: User[] = [
  { id: '1', username: 'user1', email: 'user1@example.com', role: 'user', level: 1, isPaid: true, createdAt: '2024-01-15', status: 'active' },
  { id: '2', username: 'user2', email: 'user2@example.com', role: 'user', level: 2, isPaid: false, createdAt: '2024-01-14', status: 'active' },
  { id: '3', username: 'creator1', email: 'creator1@example.com', role: 'operator', level: 3, isPaid: true, createdAt: '2024-01-13', status: 'active' },
  { id: '4', username: 'banned_user', email: 'banned@example.com', role: 'user', level: 1, isPaid: false, createdAt: '2024-01-12', status: 'banned' },
  { id: '5', username: 'channel_user', email: 'channel@example.com', role: 'channel', level: 2, isPaid: true, createdAt: '2024-01-11', status: 'active' },
];

const roleLabels: Record<string, string> = {
  user: '普通用户',
  operator: '运营用户',
  channel: '渠道用户',
  admin: '管理员',
};

const statusColors: Record<string, 'success' | 'default' | 'destructive'> = {
  active: 'success',
  inactive: 'default',
  banned: 'destructive',
};

const statusLabels: Record<string, string> = {
  active: '正常',
  inactive: '未激活',
  banned: '已封禁',
};

export default function AdminUsersPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: '用户名',
    },
    {
      accessorKey: 'email',
      header: '邮箱',
    },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => roleLabels[row.original.role] || row.original.role,
    },
    {
      accessorKey: 'level',
      header: '等级',
      cell: ({ row }) => `Lv.${row.original.level}`,
    },
    {
      accessorKey: 'isPaid',
      header: '会员',
      cell: ({ row }) => (
        <Badge variant={row.original.isPaid ? 'default' : 'outline'}>
          {row.original.isPaid ? '付费会员' : '免费用户'}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <Badge variant={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '注册时间',
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
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
      ),
    },
  ];

  const table = useReactTable({
    data: mockUsers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-3 text-left text-sm font-medium"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {table.getFilteredRowModel().rows.length} 条记录
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
