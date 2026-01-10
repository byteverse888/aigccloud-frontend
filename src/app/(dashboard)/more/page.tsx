import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, HelpCircle, Users, Info } from 'lucide-react';

const moreItems = [
  {
    href: '/more/user-agreement',
    icon: FileText,
    title: '用户协议',
    description: '平台用户服务协议',
  },
  {
    href: '/more/privacy-policy',
    icon: Shield,
    title: '隐私政策',
    description: '了解我们如何保护您的隐私',
  },
  {
    href: '/more/faq',
    icon: HelpCircle,
    title: '常见问题',
    description: '查看常见问题解答',
  },
  {
    href: '/more/join-us',
    icon: Users,
    title: '加入我们',
    description: '欢迎加入巴特星球团队',
  },
  {
    href: '/more/about',
    icon: Info,
    title: '版本信息',
    description: '关于巴特星球',
  },
];

export default function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">更多</h1>
        <p className="text-muted-foreground">
          了解更多关于平台的信息
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {moreItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="mt-2">{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
