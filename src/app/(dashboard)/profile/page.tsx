'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  CreditCard, 
  ShoppingBag, 
  Heart, 
  Users, 
  Bell,
  Wallet,
  ChevronRight,
  Edit,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store';
import { getUserStats, getUserEarningStats } from '@/lib/parse-actions';
import { getCoinBalance } from '@/lib/web3-actions';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import Link from 'next/link';

// 用户中心菜单
const profileMenus = [
  { icon: Settings, label: '账户设置', href: '/profile/settings', desc: '修改个人信息和密码' },
  { icon: Wallet, label: '创作收益', href: '/profile/earnings', desc: '查看收益和提现' },
  { icon: ShoppingBag, label: '我的订单', href: '/profile/orders', desc: '查看订单记录' },
  { icon: CreditCard, label: '充值计费', href: '/profile/billing', desc: '充值和消费记录' },
  { icon: Bell, label: '消息中心', href: '/profile/notifications', desc: '系统通知和消息' },
  { icon: Heart, label: '我的收藏', href: '/profile/favorites', desc: '收藏的商品' },
  { icon: Users, label: '关注作者', href: '/profile/following', desc: '关注的创作者' },
];

export default function ProfilePage() {
  const { user } = useAuthStore();
  // 使用 useSignedUrl 获取头像 URL
  const { url: avatarUrl } = useSignedUrl(user?.avatarKey);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    assetCount: 0,
    orderCount: 0,
    followerCount: 0,
    followingCount: 0,
  });
  const [coinBalance, setCoinBalance] = useState(user?.web3Address ? '0' : '-');
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    async function loadUserData() {
      if (!user?.objectId) return;
      
      try {
        // 加载统计数据
        const statsResult = await getUserStats(user.objectId);
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
        
        // 加载收益统计
        const earningsResult = await getUserEarningStats(user.objectId);
        if (earningsResult.success && earningsResult.data) {
          setTotalEarnings(earningsResult.data.totalEarnings);
        }
        
        // 加载金币余额
        if (user.web3Address) {
          const balanceResult = await getCoinBalance(user.web3Address);
          if (balanceResult.success) {
            setCoinBalance(balanceResult.balance || '0');
          }
        } else {
          setCoinBalance('-'); // 未绑定账户显示 -
        }
      } catch (error) {
        console.error('加载用户数据失败:', error);
      }
    }
    loadUserData();
  }, [user?.objectId, user?.web3Address]);

  return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* 头像 */}
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || '/avatars/default.svg'} alt={user?.username} />
                  <AvatarFallback className="text-2xl">
                    {(user?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* 用户信息 */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl font-bold">{user?.username || 'User'}</h2>
                  {user?.isPaid && (
                    <>
                      <Badge variant="default">会员</Badge>
                      <Badge variant="secondary">VIP</Badge>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{user?.email || ''}</p>
                {user?.isPaid && user?.paidExpireAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    会员有效期至：{new Date(user.paidExpireAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* 编辑按钮 */}
              <Button variant="outline" asChild>
                <Link href="/profile/settings">
                  <Edit className="h-4 w-4 mr-2" />
                  编辑资料
                </Link>
              </Button>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{coinBalance}</p>
                <p className="text-sm text-muted-foreground">金币余额</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{totalEarnings}</p>
                <p className="text-sm text-muted-foreground">累计收益</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.assetCount}</p>
                <p className="text-sm text-muted-foreground">我的资产</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.followerCount}</p>
                <p className="text-sm text-muted-foreground">粉丝数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.followingCount}</p>
                <p className="text-sm text-muted-foreground">关注数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 功能菜单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              用户中心
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileMenus.map((menu, index) => (
                <motion.div
                  key={menu.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={menu.href}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <menu.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{menu.label}</h3>
                          <p className="text-sm text-muted-foreground">{menu.desc}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 最近活动 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="orders">订单</TabsTrigger>
                <TabsTrigger value="tasks">任务</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  暂无最近活动
                </div>
              </TabsContent>
              <TabsContent value="orders" className="space-y-4 mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  暂无订单记录
                </div>
              </TabsContent>
              <TabsContent value="tasks" className="space-y-4 mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  暂无任务记录
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
