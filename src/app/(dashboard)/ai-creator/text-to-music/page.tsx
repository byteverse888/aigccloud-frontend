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
import { Music, Loader2, Download, Play, Pause, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { createAITask } from '@/lib/parse-actions';

const musicStyles = [
  { value: 'pop', label: '流行' },
  { value: 'classical', label: '古典' },
  { value: 'jazz', label: '爵士' },
  { value: 'electronic', label: '电子' },
  { value: 'rock', label: '摇滚' },
  { value: 'ambient', label: '氛围' },
];

const durations = [
  { value: '30', label: '30秒' },
  { value: '60', label: '1分钟' },
  { value: '120', label: '2分钟' },
  { value: '180', label: '3分钟' },
];

export default function TextToMusicPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState('60');
  const { user } = useAuthStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入音乐描述');
      return;
    }
    
    if (!user?.objectId) {
      toast.error('请先登录');
      return;
    }

    setIsGenerating(true);
    setGeneratedMusic(null);
    
    try {
      // 创建AI任务
      const taskResult = await createAITask({
        designer: user.objectId,
        type: 'txt2music',
        model: 'music-gen',
        data: {
          prompt: prompt,
          style: style,
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
        <h1 className="text-3xl font-bold tracking-tight">生成音乐</h1>
        <p className="text-muted-foreground">
          描述您想要的音乐风格，AI为您创作独特旋律
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>创作设置</CardTitle>
            <CardDescription>配置您的音乐生成参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>音乐描述 *</Label>
              <Textarea
                placeholder="描述您想要的音乐，例如：一首轻快愉悦的钢琴曲，适合午后咖啡时光"
                className="min-h-[120px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>风格</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {musicStyles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>时长</Label>
                <Select value={duration} onValueChange={setDuration}>
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
            <CardDescription>您的AI音乐创作将在这里展示</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">AI正在创作中...</p>
                </div>
              </div>
            ) : generatedMusic ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <div className="text-center">
                    <Music className="mx-auto h-24 w-24 text-primary" />
                    <p className="mt-4 text-lg font-medium">AI Generated Music</p>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        暂停
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        播放
                      </>
                    )}
                  </Button>
                  <Button size="lg" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    下载
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                <div className="text-center">
                  <Music className="mx-auto h-24 w-24 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    输入描述开始创作音乐
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
