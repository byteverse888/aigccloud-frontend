import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, Mic, Music, Video, Bot, Palette, Workflow } from 'lucide-react';

const aiCreatorModules = [
  {
    href: '/ai-creator/text-to-image',
    icon: Image,
    title: '生成图片',
    description: '输入文字描述，AI为您生成精美图片',
    color: 'blue',
  },
  {
    href: '/ai-creator/text-to-speech',
    icon: Mic,
    title: '语音转换',
    description: '将文字转换为自然流畅的语音',
    color: 'green',
  },
  {
    href: '/ai-creator/text-to-music',
    icon: Music,
    title: '生成音乐',
    description: 'AI作曲，创造独特的音乐旋律',
    color: 'purple',
  },
  {
    href: '/ai-creator/text-to-video',
    icon: Video,
    title: '生成视频',
    description: '文字转视频，让创意动起来',
    color: 'orange',
  },
  {
    href: '/ai-creator/digital-human',
    icon: Bot,
    title: '数字人',
    description: '创建您专属的AI数字分身',
    color: 'pink',
  },
  {
    href: '/ai-creator/webui',
    icon: Palette,
    title: 'WEBUI',
    description: '专业级图像生成工作台',
    color: 'cyan',
  },
  {
    href: '/ai-creator/comfyui',
    icon: Workflow,
    title: 'ComfyUI',
    description: '节点式工作流，无限可能',
    color: 'indigo',
  },
];

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-green-500/10 text-green-500',
  purple: 'bg-purple-500/10 text-purple-500',
  orange: 'bg-orange-500/10 text-orange-500',
  pink: 'bg-pink-500/10 text-pink-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
  indigo: 'bg-indigo-500/10 text-indigo-500',
};

export default function AICreatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI创作</h1>
        <p className="text-muted-foreground">
          选择一个AI创作工具，开始您的创意之旅
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {aiCreatorModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[module.color]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="mt-2">{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
