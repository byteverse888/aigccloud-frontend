import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Construction } from 'lucide-react';

export default function DigitalHumanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">数字人</h1>
        <p className="text-muted-foreground">
          创建您专属的AI数字分身
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            功能开发中
          </CardTitle>
          <CardDescription>
            数字人功能正在开发中，敬请期待
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16">
            <Bot className="h-24 w-24 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">
              AI数字人即将上线
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              您将能够创建个性化的AI数字分身，用于视频创作、直播等场景
            </p>
            <Button className="mt-6" variant="outline">
              订阅更新通知
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
