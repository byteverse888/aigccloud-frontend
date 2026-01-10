'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, CreditCard, TrendingUp, Package, AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const userGrowthData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  datasets: [
    {
      label: '新增用户',
      data: [120, 190, 300, 500, 420, 650, 890],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const salesData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  datasets: [
    {
      label: '销售额',
      data: [12000, 19000, 30000, 50000, 42000, 65000, 89000],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    },
  ],
};

const categoryData = {
  labels: ['图片', '音频', '视频', '模型'],
  datasets: [
    {
      data: [45, 25, 20, 10],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(249, 115, 22, 0.8)',
      ],
    },
  ],
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
        <p className="text-muted-foreground">
          平台运营数据概览
        </p>
      </div>

      {/* 关键指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> 较昨日
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日销售额</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥12,580</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+8%</span> 较昨日
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核商品</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">需要及时处理</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日订单</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+15%</span> 较昨日
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>用户增长趋势</CardTitle>
            <CardDescription>近7个月新增用户统计</CardDescription>
          </CardHeader>
          <CardContent>
            <Line
              data={userGrowthData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>销售额统计</CardTitle>
            <CardDescription>近7个月销售额统计</CardDescription>
          </CardHeader>
          <CardContent>
            <Bar
              data={salesData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>商品分类占比</CardTitle>
            <CardDescription>各分类商品数量占比</CardDescription>
          </CardHeader>
          <CardContent>
            <Doughnut
              data={categoryData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              待处理事项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">待审核商品</p>
                  <p className="text-sm text-muted-foreground">23个商品等待审核</p>
                </div>
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-500">
                  待处理
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">被举报商品</p>
                  <p className="text-sm text-muted-foreground">5个商品被举报</p>
                </div>
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-500">
                  紧急
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">用户反馈</p>
                  <p className="text-sm text-muted-foreground">12条未处理反馈</p>
                </div>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-500">
                  普通
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
