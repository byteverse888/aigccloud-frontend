'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Plus, Edit, Users, Trash2, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Role {
  objectId: string;
  name: string;
  label: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

const allPermissions = [
  { key: 'users.manage', label: '用户管理' },
  { key: 'roles.manage', label: '角色管理' },
  { key: 'products.manage', label: '商品管理' },
  { key: 'products.review', label: '商品审批' },
  { key: 'orders.manage', label: '订单管理' },
  { key: 'coupons', label: '券码管理' },
  { key: 'promotions', label: '促销管理' },
  { key: 'recharge', label: '充值管理' },
  { key: 'statistics', label: '报表统计' },
  { key: 'settings', label: '系统设置' },
  { key: 'channel.manage', label: '渠道管理' },
  { key: 'channel.stats', label: '渠道统计' },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    try {
      const res = await adminApi.listRoles();
      setRoles(res.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setEditPermissions(role.permissions);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      await adminApi.updateRole(editingRole.objectId, editPermissions);
      setRoles(prev => prev.map(r =>
        r.objectId === editingRole.objectId ? { ...r, permissions: editPermissions } : r
      ));
      setEditDialogOpen(false);
      toast.success('角色权限已更新');
    } catch (err) {
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`确定要删除角色 "${role.label}" 吗？`)) return;
    try {
      await adminApi.deleteRole(role.objectId);
      setRoles(prev => prev.filter(r => r.objectId !== role.objectId));
      toast.success('角色已删除');
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const togglePermission = (key: string) => {
    setEditPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">角色管理</h1>
          <p className="text-muted-foreground">管理系统角色和权限配置</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增角色
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.objectId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{role.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">{role.name}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {role.name !== 'admin' && role.name !== 'user' && (
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(role)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{role.userCount} 位用户</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.includes('*') ? (
                    <Badge>全部权限</Badge>
                  ) : (
                    role.permissions.slice(0, 3).map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {allPermissions.find(ap => ap.key === p)?.label || p}
                      </Badge>
                    ))
                  )}
                  {role.permissions.length > 3 && !role.permissions.includes('*') && (
                    <Badge variant="outline" className="text-xs">+{role.permissions.length - 3}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑权限对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑权限 - {editingRole?.label}</DialogTitle>
            <DialogDescription>配置该角色可访问的功能模块</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {allPermissions.map((perm) => (
              <div key={perm.key} className="flex items-center justify-between">
                <Label htmlFor={perm.key} className="cursor-pointer">{perm.label}</Label>
                <Switch
                  id={perm.key}
                  checked={editPermissions.includes('*') || editPermissions.includes(perm.key)}
                  onCheckedChange={() => togglePermission(perm.key)}
                  disabled={editPermissions.includes('*')}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
