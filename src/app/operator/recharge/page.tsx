'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Settings, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface RechargeRecord {
  id: string;
  userId: string;
  username: string;
  amount: number;
  bonus: number;
  method: string;
  status: string;
  createdAt: string;
}

interface RechargePlan {
  id: string;
  amount: number;
  bonus: number;
  enabled: boolean;
}

export default function OperatorRechargePage() {
  const [records, setRecords] = useState<RechargeRecord[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recRes, planRes] = await Promise.all([
          adminApi.listRechargeRecords({ limit: 50 }),
          adminApi.listRechargePlans(),
        ]);
        setRecords(recRes.records || []);
        setPlans(planRes.plans || []);
      } catch {
        toast.error('加载充值数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const togglePlan = async (plan: RechargePlan) => {
    const newEnabled = !plan.enabled;
    try {
      await adminApi.updateRechargePlan(plan.id, { amount: plan.amount, bonus: plan.bonus, enabled: newEnabled });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, enabled: newEnabled } : p));
    } catch {
      toast.error('更新失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, React.ReactNode> = {
      success: <Badge className="bg-green-500">成功</Badge>,
      pending: <Badge variant="secondary">处理中</Badge>,
      failed: <Badge variant="destructive">失败</Badge>,
    };
    return map[status] || <Badge variant="secondary">{status}</Badge>;
  };

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = { wechat: '微信', alipay: '支付宝', web3: 'Web3' };
    return map[method] || method;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">充值管理</h2>
        <p className="text-muted-foreground">管理充值方案和充值记录</p>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records"><Wallet className="mr-2 h-4 w-4" />充值记录</TabsTrigger>
          <TabsTrigger value="plans"><Settings className="mr-2 h-4 w-4" />充值方案</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无充值记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">用户</th>
                        <th className="text-right py-2 px-3">充值金额</th>
                        <th className="text-right py-2 px-3">赠送</th>
                        <th className="text-left py-2 px-3">支付方式</th>
                        <th className="text-left py-2 px-3">状态</th>
                        <th className="text-left py-2 px-3">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(record => (
                        <tr key={record.id} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{record.username || record.userId}</td>
                          <td className="py-2 px-3 text-right">¥{record.amount}</td>
                          <td className="py-2 px-3 text-right text-green-500">+¥{record.bonus}</td>
                          <td className="py-2 px-3">{getMethodLabel(record.method)}</td>
                          <td className="py-2 px-3">{getStatusBadge(record.status)}</td>
                          <td className="py-2 px-3 text-muted-foreground">{record.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">充值方案配置</CardTitle>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无充值方案</p>
              ) : (
                <div className="space-y-4">
                  {plans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="font-medium">充值 ¥{plan.amount}</span>
                          {plan.bonus > 0 && (
                            <span className="ml-2 text-green-500 text-sm">赠送 ¥{plan.bonus}</span>
                          )}
                        </div>
                      </div>
                      <Switch checked={plan.enabled} onCheckedChange={() => togglePlan(plan)} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
