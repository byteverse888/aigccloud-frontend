'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Mail, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';

const positions = [
  {
    title: '高级前端工程师',
    department: '技术部',
    location: '北京',
    type: '全职',
    description: '负责AI创作平台前端开发，使用React/Next.js技术栈，要求3年以上经验。',
  },
  {
    title: 'AI算法工程师',
    department: '算法部',
    location: '北京',
    type: '全职',
    description: '负责AI生成模型的训练与优化，要求有深度学习相关经验。',
  },
  {
    title: '区块链工程师',
    department: '技术部',
    location: '远程',
    type: '全职',
    description: '负责Web3相关功能开发，包括智能合约和链上交互。',
  },
  {
    title: '产品经理',
    department: '产品部',
    location: '北京',
    type: '全职',
    description: '负责AIIP平台产品规划与设计，要求有ToC产品经验。',
  },
];

export default function JoinUsPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/more">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回更多
        </Link>
      </Button>

      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">加入我们</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          我们正在寻找优秀的人才，一起打造下一代AI创作平台。如果你热爱技术、热爱创新，欢迎加入巴特星球团队！
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {positions.map((position, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{position.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {position.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {position.location}
                </span>
                <span className="flex items-center gap-1">
                  {position.type}
                </span>
              </div>
              <p className="text-sm">{position.description}</p>
              <Button variant="outline" size="sm">
                <Mail className="h-3.5 w-3.5 mr-1" />
                投递简历
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-medium mb-2">没有找到合适的岗位？</h3>
          <p className="text-sm text-muted-foreground mb-4">
            欢迎发送简历至 hr@aigccloud.com，我们会持续关注优秀人才。
          </p>
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            发送简历
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
