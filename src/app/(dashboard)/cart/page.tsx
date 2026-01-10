'use client';

import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('购物车为空');
      return;
    }
    if (!user?.objectId) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">购物车</h1>
          <p className="text-muted-foreground">管理您的购物车商品</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">购物车是空的</p>
            <Link href="/market">
              <Button className="mt-4">去购物</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">购物车</h1>
          <p className="text-muted-foreground">
            共 {items.length} 件商品
          </p>
        </div>
        <Button variant="outline" onClick={clearCart}>
          清空购物车
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {items.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center gap-4 p-4">
                    <div className="h-20 w-20 rounded bg-muted" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-lg font-bold text-primary">
                        ¥{item.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 text-center"
                        min={1}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品总价</span>
                <span>¥{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">优惠折扣</span>
                <span className="text-green-500">-¥0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>应付金额</span>
                <span className="text-primary">¥{getTotalPrice().toFixed(2)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                立即结算
              </Button>
              <Link href="/market">
                <Button variant="outline" className="w-full">
                  继续购物
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
