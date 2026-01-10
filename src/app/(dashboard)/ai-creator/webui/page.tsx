import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Construction } from 'lucide-react';

export default function WebUIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WEBUI</h1>
        <p className="text-muted-foreground">
          专业级图像生成工作台
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            功能开发中
          </CardTitle>
          <CardDescription>
            WEBUI功能正在开发中，敬请期待
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16">
            <Palette className="h-24 w-24 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">
              专业级WEBUI即将上线
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              完整的Stable Diffusion WebUI体验，支持更多高级参数调节
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
