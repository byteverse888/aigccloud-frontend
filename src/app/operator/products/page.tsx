'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Eye, Search, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReviewProduct {
  id: string;
  name: string;
  creator: string;
  category: string;
  price: number;
  status: string;
  submittedAt: string;
  description: string;
}

export default function OperatorProductsPage() {
  const [products, setProducts] = useState<ReviewProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingProducts({ limit: 50 });
      const mapped: ReviewProduct[] = (res.data || []).map((p: Record<string, unknown>) => ({
        id: p.objectId as string || p.id as string || '',
        name: (p.name as string) || '',
        creator: (p.creatorName as string) || (p.creatorAddress as string) || '',
        category: (p.category as string) || '',
        price: (p.price as number) || 0,
        status: (p.status as string) || 'pending',
        submittedAt: (p.createdAt as string) || '',
        description: (p.description as string) || '',
      }));
      setProducts(mapped);
    } catch {
      toast.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReview = async (productId: string, status: 'approved' | 'rejected') => {
    try {
      await adminApi.reviewProduct({ product_id: productId, status });
      toast.success(status === 'approved' ? '已通过' : '已驳回');
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status } : p));
    } catch {
      toast.error('操作失败');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.creator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingProducts = filteredProducts.filter(p => p.status === 'pending');
  const approvedProducts = filteredProducts.filter(p => p.status === 'approved');
  const rejectedProducts = filteredProducts.filter(p => p.status === 'rejected');

  const ProductCard = ({ product }: { product: ReviewProduct }) => (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{product.name}</h3>
              <Badge variant="outline">{product.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{product.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>创作者: {product.creator}</span>
              <span>价格: ¥{product.price}</span>
              <span>提交: {product.submittedAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
            {product.status === 'pending' && (
              <>
                <Button size="sm" variant="default" onClick={() => handleReview(product.id, 'approved')}>
                  <CheckCircle className="h-4 w-4 mr-1" />通过
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleReview(product.id, 'rejected')}>
                  <XCircle className="h-4 w-4 mr-1" />驳回
                </Button>
              </>
            )}
            {product.status === 'approved' && <Badge className="bg-green-500">已通过</Badge>}
            {product.status === 'rejected' && <Badge variant="destructive">已驳回</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">商品审批</h2>
          <p className="text-muted-foreground">审核创作者提交的商品</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称/创作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待审批 ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="approved">已通过 ({approvedProducts.length})</TabsTrigger>
          <TabsTrigger value="rejected">已驳回 ({rejectedProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingProducts.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">暂无待审批商品</CardContent></Card>
          ) : (
            pendingProducts.map(p => <ProductCard key={p.id} product={p} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedProducts.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">暂无已通过商品</CardContent></Card>
          ) : (
            approvedProducts.map(p => <ProductCard key={p.id} product={p} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejectedProducts.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">暂无已驳回商品</CardContent></Card>
          ) : (
            rejectedProducts.map(p => <ProductCard key={p.id} product={p} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
