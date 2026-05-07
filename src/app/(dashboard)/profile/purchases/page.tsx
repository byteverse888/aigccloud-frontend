'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  Search,
  Image,
  Music2,
  Video,
  Mic,
  Bot,
  BookImage,
  Loader2,
  FileDown,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { getUserOrders, type Order } from '@/lib/parse-actions';
import toast from 'react-hot-toast';
import { storageApi } from '@/lib/api';

const categoryIcons: Record<string, typeof Image> = {
  image: Image,
  audio: Mic,
  video: Video,
  comic: BookImage,
  music: Music2,
  'digital-human': Bot,
};

const categoryLabels: Record<string, string> = {
  image: '图片',
  audio: '音频',
  video: '视频',
  comic: '图文漫画',
  music: '音乐',
  'digital-human': '数字人',
};

export default function PurchasesPage() {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const pageSize = 12;

  useEffect(() => {
    if (!user?.objectId) return;
    setLoading(true);
    getUserOrders(user.objectId, { status: 'completed', page, limit: pageSize })
      .then((res) => {
        if (res.success) {
          setPurchases(res.data || []);
          setTotal(res.total || 0);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.objectId, page]);

  const handleDownload = async (order: Order) => {
    if (!order.productFileUrl) {
      toast.error('该商品暂无可下载文件');
      return;
    }
    setDownloading(order.objectId);
    try {
      // 尝试获取签名下载URL
      const res = await storageApi.presignDownload(order.productFileUrl);
      if (res.download_url) {
        window.open(res.download_url, '_blank');
        toast.success('开始下载');
      } else {
        // 直接使用文件URL
        window.open(order.productFileUrl, '_blank');
      }
    } catch {
      // 直接打开文件URL
      window.open(order.productFileUrl, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  const filteredPurchases = searchQuery
    ? purchases.filter((p) =>
        (p.productName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : purchases;

  const totalPages = Math.ceil(total / pageSize);

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
          <h1 className="text-2xl font-bold">我的购买</h1>
          <p className="text-muted-foreground">已购买的商品可在此下载</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          共 {total} 件商品
        </Badge>
      </div>

      {/* 搜索 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索已购买的商品..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileDown className="h-16 w-16 mb-4" />
          <p>暂无已购买的商品</p>
          <p className="text-sm mt-1">在商城购买商品后会出现在这里</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPurchases.map((order) => {
            const CategoryIcon = categoryIcons[order.productCategory || 'image'] || Image;
            return (
              <Card key={order.objectId} className="group overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  {order.productCover ? (
                    <img
                      src={order.productCover}
                      alt={order.productName || ''}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CategoryIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabels[order.productCategory || ''] || order.productCategory}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-medium truncate">{order.productName || '未命名商品'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      购买时间：{new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">¥{order.amount}</span>
                    <span className="text-xs text-muted-foreground">
                      订单号：{order.orderNo}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleDownload(order)}
                      disabled={downloading === order.objectId}
                    >
                      {downloading === order.objectId ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      下载
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page}/{totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
