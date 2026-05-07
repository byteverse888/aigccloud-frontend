'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Promotion {
  id: string;
  name: string;
  type: string;
  status: string;
  discount?: number;
  minAmount?: number;
  giftProduct?: string;
  startDate: string;
  endDate: string;
  productCount: number;
  orderCount: number;
  revenue: number;
  createdAt: string;
}

export default function OperatorPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'discount', discount: '', minAmount: '', startDate: '', endDate: '' });

  const loadPromotions = async () => {
    try {
      const res = await adminApi.listPromotions();
      setPromotions(res.promotions || []);
    } catch {
      toast.error('加载促销活动失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPromotions(); }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error('请填写活动名称'); return; }
    try {
      await adminApi.createPromotion({
        name: form.name,
        type: form.type,
        discount: form.discount ? Number(form.discount) : undefined,
        min_amount: form.minAmount ? Number(form.minAmount) : undefined,
        start_date: form.startDate,
        end_date: form.endDate,
      });
      toast.success('创建成功');
      setDialogOpen(false);
      setForm({ name: '', type: 'discount', discount: '', minAmount: '', startDate: '', endDate: '' });
      loadPromotions();
    } catch {
      toast.error('创建失败');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await adminApi.updatePromotionStatus(id, newStatus);
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deletePromotion(id);
      toast.success('已删除');
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, React.ReactNode> = {
      draft: <Badge variant="secondary">草稿</Badge>,
      active: <Badge className="bg-green-500">进行中</Badge>,
      paused: <Badge variant="outline">已暂停</Badge>,
      ended: <Badge variant="secondary">已结束</Badge>,
    };
    return map[status] || <Badge variant="secondary">{status}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { discount: '折扣', threshold: '满减', gift: '赠品' };
    return map[type] || type;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">促销管理</h2>
          <p className="text-muted-foreground">管理平台促销活动</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />创建活动</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>创建促销活动</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>活动名称</Label>
                <Input placeholder="如: 618大促" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>活动类型</Label>
                  <Input placeholder="discount/threshold/gift" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>折扣/减免额</Label>
                  <Input type="number" placeholder="15" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {promotions.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">暂无促销活动</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {promotions.map(promo => (
            <Card key={promo.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{promo.name}</h3>
                      <Badge variant="outline">{getTypeLabel(promo.type)}</Badge>
                      {getStatusBadge(promo.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {promo.discount && <span>折扣: {promo.type === 'percent' ? `${promo.discount}%` : `¥${promo.discount}`}</span>}
                      <span>时间: {promo.startDate} ~ {promo.endDate}</span>
                      <span>商品数: {promo.productCount}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>订单: <strong>{promo.orderCount}</strong></span>
                      <span>收入: <strong>¥{promo.revenue.toLocaleString()}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(promo.status === 'active' || promo.status === 'paused' || promo.status === 'draft') && (
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(promo.id, promo.status)}>
                        {promo.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
