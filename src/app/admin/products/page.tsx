'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Check, X, Eye, Image, Music, Video } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  category: string;
  creator: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  description: string;
}

const mockProducts: Product[] = [
  { id: '1', name: 'AI艺术画作 - 赛博朋克城市', category: 'image', creator: '创作者A', price: 99, status: 'pending', submittedAt: '2024-01-15 10:30', description: '一幅赛博朋克风格的城市画作' },
  { id: '2', name: '电子音乐 - 夜空下', category: 'audio', creator: '创作者B', price: 49, status: 'pending', submittedAt: '2024-01-15 09:20', description: '电子音乐作品' },
  { id: '3', name: '动画短片 - 星际旅行', category: 'video', creator: '创作者C', price: 199, status: 'pending', submittedAt: '2024-01-14 16:45', description: '科幻主题动画短片' },
];

const categoryIcons: Record<string, typeof Image> = {
  image: Image,
  audio: Music,
  video: Video,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const handleApprove = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: 'approved' as const } : p))
    );
    toast.success('商品已通过审核');
  };

  const handleReject = () => {
    if (!selectedProduct || !rejectReason.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === selectedProduct.id ? { ...p, status: 'rejected' as const } : p))
    );
    setRejectDialogOpen(false);
    setRejectReason('');
    setSelectedProduct(null);
    toast.success('商品已驳回');
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">商品审核</h1>
        <p className="text-muted-foreground">审核待上架商品</p>
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
              <div className="py-12 text-center text-muted-foreground">
                暂无数据
              </div>
            ) : (
              filteredProducts.map((product) => {
                const CategoryIcon = categoryIcons[product.category] || Image;
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                      <CategoryIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.creator} | ¥{product.price} | {product.submittedAt}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            详情
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(product.id)}
                          >
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
                        <Badge
                          variant={product.status === 'approved' ? 'success' : 'destructive'}
                        >
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
            <DialogDescription>
              请填写驳回原因，创作者将收到通知
            </DialogDescription>
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
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
