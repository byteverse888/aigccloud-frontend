'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store';
import { Crown, Star, Gift, Calendar, Coins, History, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 会员套餐配置
const MEMBER_PLANS = {
  vip_month: { level: 'vip', days: 30, price: 29, bonus: 100, name: 'VIP月度会员' },
  vip_half: { level: 'vip', days: 180, price: 148, bonus: 800, name: 'VIP半年会员' },
  vip_year: { level: 'vip', days: 365, price: 268, bonus: 2000, name: 'VIP年度会员' },
  vip_3year: { level: 'vip', days: 1095, price: 688, bonus: 8000, name: 'VIP三年会员' },
  svip_month: { level: 'svip', days: 30, price: 59, bonus: 300, name: 'SVIP月度会员' },
  svip_half: { level: 'svip', days: 180, price: 298, bonus: 2000, name: 'SVIP半年会员' },
  svip_year: { level: 'svip', days: 365, price: 498, bonus: 5000, name: 'SVIP年度会员' },
  svip_3year: { level: 'svip', days: 1095, price: 1288, bonus: 20000, name: 'SVIP三年会员' },
};

// VIP权益
const VIP_BENEFITS = [
  { icon: Crown, title: '专属徽章', desc: 'VIP专属身份标识' },
  { icon: Gift, title: '每日登录双倍金币', desc: '每日登录奖励翻倍' },
  { icon: Coins, title: '订阅赠送金币', desc: '订阅即送大量金币' },
  { icon: Calendar, title: 'AI任务免费', desc: 'AI创作任务零消耗' },
];

// SVIP权益
const SVIP_BENEFITS = [
  ...VIP_BENEFITS,
  { icon: Star, title: '优先处理', desc: 'AI任务优先队列' },
  { icon: Crown, title: 'SVIP专属徽章', desc: '尊贵SVIP标识' },
];

export default function MembershipPage() {
  const { user, setUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [payDialog, setPayDialog] = useState(false);
  const [payInfo, setPayInfo] = useState<{ orderId: string; codeUrl?: string; testMode?: boolean } | null>(null);
  const [memberOrders, setMemberOrders] = useState<Array<{
    orderId: string;
    planName: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt?: string;
  }>>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const memberLevel = user?.memberLevel || 'normal';
  const memberExpireAt = user?.memberExpireAt ? new Date(user.memberExpireAt) : null;
  const isExpired = memberExpireAt ? memberExpireAt < new Date() : true;

  // 加载会员订阅记录
  useEffect(() => {
    async function loadMemberOrders() {
      if (!user?.objectId || !user?.sessionToken) return;
      setOrdersLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/v1/member/orders/${user.objectId}`, {
          headers: {
            'X-Parse-Session-Token': user.sessionToken,
          },
        });
        const result = await response.json();
        if (result.orders) {
          setMemberOrders(result.orders);
        }
      } catch (error) {
        console.error('加载会员订单失败:', error);
      } finally {
        setOrdersLoading(false);
      }
    }
    loadMemberOrders();
  }, [user?.objectId, user?.sessionToken]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setSelectedPlan(planId);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/member/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.objectId, 
          plan_id: planId,
          session_token: user.sessionToken,  // 传递 session token 用于更新用户信息
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPayInfo({
          orderId: result.order_id,
          codeUrl: result.pay_params?.code_url,
          testMode: result.pay_params?.test_mode,
        });
        setPayDialog(true);
      } else {
        toast.error(result.message || '创建订单失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 测试模式：模拟支付
  const handleSimulatePay = async () => {
    if (!payInfo?.orderId || !user?.sessionToken) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/member/simulate-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: payInfo.orderId,
          session_token: user.sessionToken,  // 传递 session token 用于更新用户信息
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || '支付成功！');
        setPayDialog(false);
        // 更新用户信息
        const plan = MEMBER_PLANS[selectedPlan as keyof typeof MEMBER_PLANS];
        if (plan && user) {
          setUser({
            ...user,
            memberLevel: plan.level as 'normal' | 'vip' | 'svip',
            memberExpireAt: new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000),
          });
        }
        // 刷新订阅记录
        const ordersResponse = await fetch(`${API_URL}/api/v1/member/orders/${user?.objectId}`, {
          headers: {
            'X-Parse-Session-Token': user?.sessionToken || '',
          },
        });
        const ordersResult = await ordersResponse.json();
        if (ordersResult.orders) {
          setMemberOrders(ordersResult.orders);
        }
      } else {
        toast.error(result.message || '支付失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      {/* 当前会员状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            会员中心
          </CardTitle>
          <CardDescription>升级会员，享受更多权益</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-medium">当前等级：</span>
                <Badge variant={memberLevel === 'normal' ? 'outline' : 'default'}>
                  {memberLevel === 'normal' ? '普通用户' : memberLevel.toUpperCase()}
                </Badge>
              </div>
              {memberLevel !== 'normal' && memberExpireAt && (
                <p className="text-sm text-muted-foreground">
                  {isExpired ? '会员已过期' : `会员有效期至：${memberExpireAt.toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 套餐选择 */}
      <Tabs defaultValue="vip" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vip" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            VIP会员
          </TabsTrigger>
          <TabsTrigger value="svip" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            SVIP会员
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vip" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['vip_month', 'vip_half', 'vip_year', 'vip_3year'] as const).map((planId) => {
              const plan = MEMBER_PLANS[planId];
              return (
                <Card key={planId} className={`relative ${selectedPlan === planId ? 'ring-2 ring-primary' : ''}`}>
                  {planId === 'vip_year' && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500">推荐</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.days}天</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">¥{plan.price}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      赠送 <span className="text-yellow-500 font-medium">{plan.bonus}</span> 金币
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(planId)}
                      disabled={loading}
                    >
                      立即开通
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* VIP权益 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>VIP专属权益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {VIP_BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4">
                    <benefit.icon className="h-8 w-8 text-primary mb-2" />
                    <h4 className="font-medium">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="svip" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['svip_month', 'svip_half', 'svip_year', 'svip_3year'] as const).map((planId) => {
              const plan = MEMBER_PLANS[planId];
              return (
                <Card key={planId} className={`relative ${selectedPlan === planId ? 'ring-2 ring-primary' : ''}`}>
                  {planId === 'svip_year' && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500">推荐</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.days}天</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">¥{plan.price}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      赠送 <span className="text-yellow-500 font-medium">{plan.bonus}</span> 金币
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(planId)}
                      disabled={loading}
                    >
                      立即开通
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* SVIP权益 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>SVIP尊享权益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SVIP_BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4">
                    <benefit.icon className="h-8 w-8 text-yellow-500 mb-2" />
                    <h4 className="font-medium">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 订阅历史记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            订阅记录
          </CardTitle>
          <CardDescription>您的会员订阅历史</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : memberOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无订阅记录</div>
          ) : (
            <div className="space-y-3">
              {memberOrders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.planName}</span>
                      {order.status === 'paid' && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已支付
                        </Badge>
                      )}
                      {order.status === 'pending' && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          待支付
                        </Badge>
                      )}
                      {order.status === 'failed' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          失败
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{order.amount}</p>
                    <p className="text-xs text-muted-foreground">{order.orderId}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 支付对话框 */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完成支付</DialogTitle>
            <DialogDescription>
              {payInfo?.testMode ? '测试模式：点击按钮模拟支付' : '请使用微信扫码支付'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {payInfo?.testMode ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">订单号：{payInfo.orderId}</p>
                <Button onClick={handleSimulatePay} disabled={loading}>
                  {loading ? '处理中...' : '模拟支付成功'}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                {payInfo?.codeUrl ? (
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm mb-2">微信扫码支付</p>
                    {/* 这里可以用 qrcode 库生成二维码 */}
                    <p className="text-xs text-muted-foreground break-all">{payInfo.codeUrl}</p>
                  </div>
                ) : (
                  <p>正在生成支付码...</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
