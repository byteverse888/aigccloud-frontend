'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Plus,
  Search,
  Upload,
  Grid,
  List,
  Image,
  Music,
  Video,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store';
import { getUserAssets, deleteObject, type Asset } from '@/lib/parse-actions';
import toast from 'react-hot-toast';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  approved: '已上架',
  rejected: '已拒绝',
};

const typeIcons: Record<string, typeof Image> = {
  image: Image,
  audio: Music,
  video: Video,
};

export default function AssetsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { user } = useAuthStore();

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await getUserAssets(user.objectId, {
      type: typeFilter,
      status: statusFilter,
    });
    if (result.success) {
      setAssets(result.data);
      setTotal(result.total);
    } else {
      toast.error(result.error || '加载失败');
    }
    setLoading(false);
  }, [user, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = async (assetId: string) => {
    if (!confirm('确定要删除这个资产吗？')) return;
    const result = await deleteObject('Asset', assetId);
    if (result.success) {
      toast.success('删除成功');
      fetchAssets();
    } else {
      toast.error(result.error || '删除失败');
    }
  };

  const stats = {
    total: assets.length,
    approved: assets.filter((a) => a.status === 'approved').length,
    pending: assets.filter((a) => a.status === 'pending').length,
    totalViews: assets.reduce((sum, a) => sum + (a.views || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AIIP资产</h1>
          <p className="text-muted-foreground">
            管理您的AI创作资产，上架到商城销售
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            批量上传
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            上传资产
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全部资产</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已上架</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索资产..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="image">图片</SelectItem>
              <SelectItem value="audio">音频</SelectItem>
              <SelectItem value="video">视频</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="pending">待审核</SelectItem>
              <SelectItem value="approved">已上架</SelectItem>
              <SelectItem value="rejected">已拒绝</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 资产列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>请先登录</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-16 w-16 mb-4" />
          <p>暂无资产</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => {
            const TypeIcon = typeIcons[asset.type] || Image;
            return (
              <Card key={asset.objectId} className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <div className="flex h-full items-center justify-center">
                    <TypeIcon className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                  <div className="absolute right-2 top-2">
                    <Badge variant={statusColors[asset.status] || 'default'}>
                      {statusLabels[asset.status] || asset.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute bottom-2 right-2"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        预览
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(asset.objectId)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="p-4">
                  <h3 className="truncate font-medium">{asset.name}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>¥{asset.price}</span>
                    <span>{asset.views || 0} 浏览</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium">资产名称</th>
                  <th className="p-4 text-left font-medium">类型</th>
                  <th className="p-4 text-left font-medium">状态</th>
                  <th className="p-4 text-left font-medium">价格</th>
                  <th className="p-4 text-left font-medium">浏览量</th>
                  <th className="p-4 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const TypeIcon = typeIcons[asset.type] || Image;
                  return (
                    <tr key={asset.objectId} className="border-b last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{asset.name}</span>
                        </div>
                      </td>
                      <td className="p-4">{asset.type}</td>
                      <td className="p-4">
                        <Badge variant={statusColors[asset.status] || 'default'}>
                          {statusLabels[asset.status] || asset.status}
                        </Badge>
                      </td>
                      <td className="p-4">¥{asset.price}</td>
                      <td className="p-4">{asset.views || 0}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(asset.objectId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
