'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Sparkles,
  Image,
  Music,
  Video,
  TrendingUp,
  Users,
  ShoppingBag,
  Package,
  Loader2,
  Star,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { getProducts, getUserAssets, countObjects, type Product } from '@/lib/parse-actions';

export default function HomePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTasks: 0,
    totalAssets: 0,
    totalEarnings: 0,
    followers: 0,
  });
  const [hotProducts, setHotProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 获取热门商品
      const productsResult = await getProducts({ sortBy: 'sales', limit: 4 });
      if (productsResult.success) {
        setHotProducts(productsResult.data);
      }
      
      // 获取用户统计
      if (user) {
        const assetsResult = await getUserAssets(user.objectId, { limit: 1 });
        const followersResult = await countObjects('Follow', { followingId: user.objectId });
        
        setStats({
          todayTasks: 0,
          totalAssets: assetsResult.total || 0,
          totalEarnings: user.totalIncentive || 0,
          followers: followersResult.count || 0,
        });
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [user]);
  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">欢迎来到巴特星球</h1>
          <p className="text-muted-foreground">
            AI驱动的创作平台，开启你的无限创意之旅
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ai-creator/text-to-image">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              开始创作
            </Button>
          </Link>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日创作</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTasks}</div>
            <p className="text-xs text-muted-foreground">开始你的第一个创作</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的资产</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">查看全部资产</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计收益</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">本月新增 ¥0.00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">粉丝数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followers}</div>
            <p className="text-xs text-muted-foreground">邀请好友获取更多</p>
          </CardContent>
        </Card>
      </div>

      {/* AI创作入口 */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">AI创作工具</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/ai-creator/text-to-image">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <Image className="h-6 w-6 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">文生图</CardTitle>
                <CardDescription>输入文字描述，生成精美图片</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/ai-creator/text-to-music">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <Music className="h-6 w-6 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">生成音乐</CardTitle>
                <CardDescription>AI作曲，创造独特旋律</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/ai-creator/text-to-video">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <Video className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">生成视频</CardTitle>
                <CardDescription>文字转视频，内容创作利器</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/market">
            <Card className="cursor-pointer transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                  <ShoppingBag className="h-6 w-6 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">AIIP商城</CardTitle>
                <CardDescription>发现和购买优质AI创作资产</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* 推荐作品 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">热门商品</h2>
          <Link href="/market">
            <Button variant="ghost">查看全部</Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hotProducts.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium">暂无商品</h3>
                  <p className="text-sm text-muted-foreground">暂时没有热门商品</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {hotProducts.map((product) => (
              <Link key={product.objectId} href={`/market/${product.objectId}`}>
                <Card className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {product.cover ? (
                      <img src={product.cover} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Image className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">
                        {product.rating || 0} | {product.sales || 0} 销量
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary mt-2">¥{product.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
