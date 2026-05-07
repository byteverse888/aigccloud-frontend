'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, RotateCcw, Minus, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AccountRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  balance: number;
  description: string;
  relatedOrderNo?: string;
  createdAt: string;
}

export default function OperatorAccountsPage() {
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [summary, setSummary] = useState({ balance: 0, totalIncome: 0, totalExpense: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recRes, sumRes] = await Promise.all([
          adminApi.listAccountRecords({ limit: 50 }),
          adminApi.accountSummary(),
        ]);
        setRecords(recRes.records || []);
        setSummary(sumRes);
      } catch {
        toast.error('加载账户数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getTypeConfig = (type: string) => {
    const map: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
      income: { label: '收入', color: 'text-green-500', icon: ArrowUpRight },
      expense: { label: '支出', color: 'text-red-500', icon: ArrowDownRight },
      fee: { label: '手续费', color: 'text-orange-500', icon: Minus },
      refund: { label: '退款', color: 'text-yellow-500', icon: RotateCcw },
    };
    return map[type] || { label: type, color: 'text-gray-500', icon: Minus };
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">账户明细</h2>
        <p className="text-muted-foreground">平台资金流水记录</p>
      </div>

      {/* 资金概览 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-muted-foreground">当前余额</div>
            <div className="text-3xl font-bold">¥{summary.balance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-muted-foreground">近期收入</div>
            <div className="text-3xl font-bold text-green-500">+¥{summary.totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-muted-foreground">近期支出</div>
            <div className="text-3xl font-bold text-red-500">-¥{summary.totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 明细列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">资金明细</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无资金记录</p>
          ) : (
            <div className="space-y-3">
              {records.map(record => {
                const config = getTypeConfig(record.type);
                const Icon = config.icon;
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{record.description}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{record.category}</Badge>
                          {record.relatedOrderNo && <span>单号: {record.relatedOrderNo}</span>}
                          <span>{record.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${config.color}`}>
                        {record.amount > 0 ? '+' : ''}¥{record.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        余额: ¥{record.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
