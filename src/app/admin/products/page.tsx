'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, Image, Music, Video, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  objectId: string;
  name: string;
  category: string;
  creatorId: string;
  price: number;
  status: string;
  createdAt: string;
  description?: string;
}

const categoryIcons: Record<string, typeof Image> = {
  image: Image,
  audio: Music,
  video: Video,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getPendingProducts({ page: 1, limit: 50 });
      const items = (result.data || []).map((p: Record<string, unknown>) => ({
        objectId: p.objectId as string,
        name: (p.name as string) || '',
        category: (p.category as string) || 'other',
        creatorId: (p.creatorId as string) || '',
        price: (p.price as number) || 0,
        status: (p.status as string) || 'pending',
        createdAt: (p.createdAt as string) || '',
        description: (p.description as string) || '',
      }));
      setProducts(items);
      setTotal(result.total);
    } catch {
      toast.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleApprove = async (productId: string) => {
    try {
      await adminApi.reviewProduct({ product_id: productId, status: 'approved' });
      setProducts((prev) => prev.map((p) => (p.objectId === productId ? { ...p, status: 'approved' } : p)));
      toast.success('商品已通过审核');
    } catch {
      toast.error('操作失败');
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectReason.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    try {
      await adminApi.reviewProduct({
        product_id: selectedProduct.objectId,
        status: 'rejected',
        review_note: rejectReason,
      });
      setProducts((prev) =>
        prev.map((p) => (p.objectId === selectedProduct.objectId ? { ...p, status: 'rejected' } : p))
      );
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedProduct(null);
      toast.success('商品已驳回');
    } catch {
      toast.error('操作失败');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">商品审核</h1>
        <p className="text-muted-foreground">审核待上架商品（共 {total} 件待审核）</p>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                待审核 ({products.filter((p) => p.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                已通过 ({products.filter((p) => p.status === 'approved').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                已驳回 ({products.filter((p) => p.status === 'rejected').length})
              </TabsTrigger>
              <TabsTrigger value="all">全部</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">暂无数据</div>
            ) : (
              filteredProducts.map((product) => {
                const CategoryIcon = categoryIcons[product.category] || Image;
                return (
                  <div key={product.objectId} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                      <CategoryIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ¥{product.price} | {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                      {product.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {product.status === 'pending' ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                            <Eye className="mr-1 h-4 w-4" />
                            详情
                          </Button>
                          <Button size="sm" variant="default" onClick={() => handleApprove(product.objectId)}>
                            <Check className="mr-1 h-4 w-4" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedProduct(product);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className="mr-1 h-4 w-4" />
                            驳回
                          </Button>
                        </>
                      ) : (
                        <Badge variant={product.status === 'approved' ? 'success' : 'destructive'}>
                          {product.status === 'approved' ? '已通过' : '已驳回'}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 驳回对话框 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回商品</DialogTitle>
            <DialogDescription>请填写驳回原因，创作者将收到通知</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>商品名称</Label>
              <p className="text-sm">{selectedProduct?.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">驳回原因 *</Label>
              <Textarea
                id="reason"
                placeholder="请输入驳回原因..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
