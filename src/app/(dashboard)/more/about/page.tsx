'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Globe, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/more">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回更多
        </Link>
      </Button>

      <div className="text-center py-8">
        <Info className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">关于我们</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          巴特星球 - 下一代AI创作与数字资产平台
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">平台简介</h2>
            <p className="text-muted-foreground leading-relaxed">
              巴特星球（AIGCCloud）是一个集AI创作、数字资产管理、AIIP商城于一体的综合平台。
              我们致力于让每个人都能轻松使用AI技术进行创作，并通过区块链技术保障数字资产的确权和交易。
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">AI驱动</h3>
              <p className="text-sm text-muted-foreground">
                集成多种AI模型，支持文生图、文生音乐、文生视频等创作方式
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">区块链确权</h3>
              <p className="text-sm text-muted-foreground">
                基于Web3技术，为数字资产提供不可篡改的所有权证明
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Globe className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">开放生态</h3>
              <p className="text-sm text-muted-foreground">
                构建创作者经济生态，让优质内容获得应有的价值回报
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">联系我们</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>邮箱：contact@aigccloud.com</p>
              <p>官网：https://www.aigccloud.com</p>
              <p>版本：v1.0.0</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
