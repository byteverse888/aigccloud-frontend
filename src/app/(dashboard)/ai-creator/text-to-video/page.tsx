'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Video, Loader2, Download, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { createAITask } from '@/lib/parse-actions';

const videoStyles = [
  { value: 'cinematic', label: '电影风格' },
  { value: 'anime', label: '动漫风格' },
  { value: 'realistic', label: '写实风格' },
  { value: '3d', label: '3D动画' },
];

const durations = [
  { value: '5', label: '5秒' },
  { value: '10', label: '10秒' },
  { value: '15', label: '15秒' },
  { value: '30', label: '30秒' },
];

const resolutions = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p (推荐)' },
  { value: '4k', label: '4K' },
];

export default function TextToVideoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState('10');
  const [resolution, setResolution] = useState('1080p');
  const { user } = useAuthStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入视频描述');
      return;
    }
    
    if (!user?.objectId) {
      toast.error('请先登录');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    
    try {
      // 创建AI任务
      const taskResult = await createAITask({
        designer: user.objectId,
        type: 'txt2video',
        model: 'video-gen',
        data: {
          prompt: prompt,
          style: style,
          size: resolution,
          quality: duration,
        },
        status: 0 as const,
      });
      
      if (!taskResult.success || !taskResult.data?.objectId) {
        throw new Error(taskResult.error || '创建任务失败');
      }
      
      toast.success('任务已提交，可在「AI任务」页面查看进度');
    } catch (error) {
      toast.error((error as Error).message || '生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">生成视频</h1>
        <p className="text-muted-foreground">
          描述您想要的视频内容，AI为您生成精彩视频
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>创作设置</CardTitle>
            <CardDescription>配置您的视频生成参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>视频描述 *</Label>
              <Textarea
                placeholder="描述您想要生成的视频，例如：一只小狗在海边奔跑，夕阳西下，电影级画面"
                className="min-h-[120px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>风格</Label>
                <Select defaultValue="cinematic">
                  <SelectTrigger>
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>时长</Label>
                <Select defaultValue="10">
                  <SelectTrigger>
                    <SelectValue placeholder="选择时长" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>分辨率</Label>
              <Select defaultValue="1080p">
                <SelectTrigger>
                  <SelectValue placeholder="选择分辨率" />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
            <CardDescription>您的AI视频创作将在这里展示</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">AI正在创作中...</p>
                  <p className="text-sm text-muted-foreground">视频生成需要较长时间，请耐心等待</p>
                </div>
              </div>
            ) : generatedVideo ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20">
                  <div className="flex h-full items-center justify-center">
                    <Video className="h-24 w-24 text-primary" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="lg" variant="secondary" className="rounded-full">
                      <Play className="h-8 w-8" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <Button size="lg" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    下载视频
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                <div className="text-center">
                  <Video className="mx-auto h-24 w-24 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    输入描述开始创作视频
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
