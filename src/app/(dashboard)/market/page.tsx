'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ShoppingCart,
  Heart,
  Share2,
  Image,
  Music,
  Video,
  SlidersHorizontal,
  Star,
  Loader2,
} from 'lucide-react';
import { useCartStore, useAuthStore } from '@/store';
import { getProducts, toggleFavorite, type Product } from '@/lib/parse-actions';
import toast from 'react-hot-toast';

const categories = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'audio', label: '音频' },
  { value: 'video', label: '视频' },
  { value: 'model', label: '模型' },
];

const sortOptions = [
  { value: 'sales', label: '销量优先' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
  { value: 'rating', label: '评分最高' },
  { value: 'newest', label: '最新上架' },
];

const categoryIcons: Record<string, typeof Image> = {
  image: Image,
  audio: Music,
  video: Video,
};

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const result = await getProducts({
      category,
      search: searchQuery || undefined,
      sortBy,
      page,
      limit: 20,
    });
    if (result.success) {
      setProducts(result.data);
      setTotal(result.total);
    } else {
      toast.error(result.error || '加载失败');
    }
    setLoading(false);
  }, [category, searchQuery, sortBy, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.objectId,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    toast.success('已加入购物车');
  };

  const handleFavorite = async (product: Product) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    const result = await toggleFavorite(product.objectId, user.objectId);
    if (result.success) {
      toast.success(result.favorited ? '已收藏' : '已取消收藏');
    }
  };

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AIIP商城</h1>
          <p className="text-muted-foreground">
            发现和购买优质AI创作资产
          </p>
        </div>
        <Link href="/cart">
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            购物车
          </Button>
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={category === cat.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* 商品列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Image className="h-16 w-16 mb-4" />
          <p>暂无商品</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const CategoryIcon = categoryIcons[product.category] || Image;
            return (
              <Card key={product.objectId} className="group overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  {product.cover ? (
                    <img src={product.cover} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CategoryIcon className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => handleFavorite(product)}>
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link href={`/market/${product.objectId}`}>
                    <h3 className="truncate font-medium hover:text-primary">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.creatorName || '匿名创作者'}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{product.rating || 0}</span>
                    <span className="text-sm text-muted-foreground">
                      | {product.sales || 0} 销量
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      ¥{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ¥{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => handleAddToCart(product)}
                  >
                    加入购物车
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 加载更多 */}
      {products.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
}
