'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Save, CreditCard, Bell, Shield, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const handleSave = () => {
    toast.success('设置已保存');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">管理平台系统配置</p>
      </div>

      <Tabs defaultValue="payment">
        <TabsList>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            支付设置
          </TabsTrigger>
          <TabsTrigger value="notification">
            <Bell className="mr-2 h-4 w-4" />
            通知设置
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings2 className="mr-2 h-4 w-4" />
            通用设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>支付配置</CardTitle>
              <CardDescription>配置微信支付、支付宝等支付渠道</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">微信支付</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wechat-appid">AppID</Label>
                    <Input id="wechat-appid" placeholder="wx1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wechat-mchid">商户号</Label>
                    <Input id="wechat-mchid" placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wechat-key">API密钥</Label>
                    <Input id="wechat-key" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wechat-notify">回调地址</Label>
                    <Input id="wechat-notify" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4 text-lg font-medium">支付宝</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="alipay-appid">AppID</Label>
                    <Input id="alipay-appid" placeholder="2021001234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alipay-key">应用私钥</Label>
                    <Input id="alipay-key" type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>通知配置</CardTitle>
              <CardDescription>配置邮件、短信等通知渠道</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">新用户注册通知</p>
                    <p className="text-sm text-muted-foreground">新用户注册时发送邮件通知</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">订单通知</p>
                    <p className="text-sm text-muted-foreground">订单状态变更时发送通知</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">商品审核通知</p>
                    <p className="text-sm text-muted-foreground">商品审核结果通知创作者</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4 text-lg font-medium">邮件服务配置</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP服务器</Label>
                    <Input id="smtp-host" placeholder="smtp.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">端口</Label>
                    <Input id="smtp-port" placeholder="465" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">用户名</Label>
                    <Input id="smtp-user" placeholder="noreply@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-pass">密码</Label>
                    <Input id="smtp-pass" type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>安全配置</CardTitle>
              <CardDescription>配置平台安全相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">强制HTTPS</p>
                    <p className="text-sm text-muted-foreground">强制所有请求使用HTTPS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">登录验证码</p>
                    <p className="text-sm text-muted-foreground">登录时需要输入图形验证码</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">敏感操作二次验证</p>
                    <p className="text-sm text-muted-foreground">支付等敏感操作需要二次验证</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>通用配置</CardTitle>
              <CardDescription>配置平台基础信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">平台名称</Label>
                  <Input id="site-name" defaultValue="巴特星球" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url">平台地址</Label>
                  <Input id="site-url" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">联系邮箱</Label>
                  <Input id="contact-email" placeholder="contact@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icp">ICP备案号</Label>
                  <Input id="icp" placeholder="京ICP备xxxxxxxx号" />
                </div>
              </div>

              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
