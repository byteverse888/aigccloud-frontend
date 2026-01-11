'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAICreationStore, useAuthStore } from '@/store';
import { createAITask } from '@/lib/parse-actions';
import { getPresignedUploadUrl } from '@/lib/storage-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Loader2, Download, Share2, Heart, Sparkles, Upload, ImagePlus } from 'lucide-react';

const generateSchema = z.object({
  prompt: z.string().min(1, '请输入提示词').max(1000, '提示词最多1000个字符'),
  negativePrompt: z.string().optional(),
  model: z.string().min(1, '请选择模型'),
  style: z.string().optional(),
  size: z.string().min(1, '请选择尺寸'),
  quality: z.string().optional(),
});

type GenerateFormData = z.infer<typeof generateSchema>;

const models = [
  { value: 'sd3', label: 'Stable Diffusion 3' },
  { value: 'sdxl', label: 'SDXL' },
  { value: 'midjourney', label: 'Midjourney Style' },
  { value: 'dalle3', label: 'DALL-E 3 Style' },
];

const sizes = [
  { value: '512x512', label: '512 x 512' },
  { value: '768x768', label: '768 x 768' },
  { value: '1024x1024', label: '1024 x 1024' },
  { value: '1024x768', label: '1024 x 768 (横向)' },
  { value: '768x1024', label: '768 x 1024 (纵向)' },
];

const styles = [
  { value: 'realistic', label: '写实' },
  { value: 'anime', label: '动漫' },
  { value: 'artistic', label: '艺术' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'cyberpunk', label: '赛博朋克' },
];

const strengths = [
  { value: '0.3', label: '低 (保留更多原图)' },
  { value: '0.5', label: '中' },
  { value: '0.7', label: '高' },
  { value: '0.9', label: '极高 (接近重绘)' },
];

export default function ImageGenerationPage() {
  const [activeTab, setActiveTab] = useState<'txt2img' | 'img2img'>('txt2img');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const { setCurrentTask } = useAICreationStore();
  const { user } = useAuthStore();

  // 图生图状态
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // 预览用
  const [referenceFile, setReferenceFile] = useState<File | null>(null); // 文件对象
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null); // S3 URL
  const [isUploading, setIsUploading] = useState(false);
  const [strength, setStrength] = useState('0.5');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      model: 'sd3',
      size: '1024x1024',
      style: 'realistic',
      quality: 'standard',
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('图片大小不能超过10MB');
        return;
      }
      // 保存文件对象
      setReferenceFile(file);
      setReferenceImageUrl(null); // 重置已上传的 URL
      // 生成预览
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传参考图到 S3
  const uploadReferenceImage = async (): Promise<string | null> => {
    if (!referenceFile || !user?.objectId) return null;
    
    // 如果已经上传过，直接返回 URL
    if (referenceImageUrl) return referenceImageUrl;
    
    setIsUploading(true);
    try {
      const { uploadUrl, fileUrl } = await getPresignedUploadUrl(
        referenceFile.name,
        referenceFile.type || 'image/jpeg',
        'images',
        user.objectId
      );
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: referenceFile,
        headers: {
          'Content-Type': referenceFile.type || 'image/jpeg',
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('图片上传失败');
      }
      
      setReferenceImageUrl(fileUrl);
      return fileUrl;
    } catch (error) {
      toast.error((error as Error).message || '上传失败');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: GenerateFormData) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    // 图生图模式需要上传参考图
    if (activeTab === 'img2img' && !referenceFile) {
      toast.error('请先上传参考图片');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedImages([]);
    
    try {
      // 图生图模式：先上传图片到 S3
      let imageUrl: string | null = null;
      if (activeTab === 'img2img') {
        imageUrl = await uploadReferenceImage();
        if (!imageUrl) {
          throw new Error('图片上传失败');
        }
      }

      console.log('[Text2Image] 开始创建任务, user:', user?.objectId);
      const taskData = {
        designer: user.objectId,
        type: activeTab,
        model: data.model,
        data: {
          prompt: data.prompt,
          negativePrompt: data.negativePrompt,
          style: data.style,
          size: data.size,
          quality: data.quality,
          ...(activeTab === 'img2img' && {
            referenceImage: imageUrl ?? undefined,
            strength: strength,
          }),
        },
        status: 0 as const,
      };
      console.log('[Text2Image] 任务数据:', taskData);

      const taskResult = await createAITask(taskData);
      
      if (!taskResult.success || !taskResult.data?.objectId) {
        throw new Error(taskResult.error || '创建任务失败');
      }
      
      const taskId = taskResult.data.objectId;
      const task = {
        id: taskId,
        type: activeTab as 'txt2img' | 'img2img',
        model: data.model,
        prompt: data.prompt,
        status: 'pending' as const,
        createdAt: new Date(),
      };
      
      setCurrentTask(task);
      
      toast.success('任务已提交，可在「AI任务」页面查看进度');
    } catch (error) {
      toast.error((error as Error).message || '生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 表单内容（两个Tab共用大部分）
  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 图生图：上传参考图 */}
      {activeTab === 'img2img' && (
        <div className="space-y-2">
          <Label>参考图片 *</Label>
          <div
            className="relative flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {referenceImage ? (
              <img src={referenceImage} alt="参考图" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">点击上传参考图片</p>
                <p className="text-xs text-muted-foreground">支持 JPG、PNG，最大 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      )}

      {/* 图生图：强度控制 */}
      {activeTab === 'img2img' && (
        <div className="space-y-2">
          <Label>变化强度</Label>
          <Select value={strength} onValueChange={setStrength}>
            <SelectTrigger>
              <SelectValue placeholder="选择强度" />
            </SelectTrigger>
            <SelectContent>
              {strengths.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">强度越高，生成结果与原图差异越大</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="prompt">提示词 *</Label>
        <Textarea
          id="prompt"
          placeholder={activeTab === 'txt2img' 
            ? "描述您想要生成的图片，例如：一只可爱的橘猫在草地上玩耍，阳光明媚，高清摄影"
            : "描述您想要对参考图进行的修改，例如：将背景改为海边，添加夕阳效果"
          }
          className="min-h-[100px]"
          {...register('prompt')}
        />
        {errors.prompt && (
          <p className="text-sm text-destructive">{errors.prompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="negativePrompt">负面提示词</Label>
        <Textarea
          id="negativePrompt"
          placeholder="描述您不想在图片中出现的元素"
          className="min-h-[60px]"
          {...register('negativePrompt')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>模型</Label>
          <Select defaultValue="sd3" onValueChange={(value) => setValue('model', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>风格</Label>
          <Select defaultValue="realistic" onValueChange={(value) => setValue('style', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择风格" />
            </SelectTrigger>
            <SelectContent>
              {styles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>尺寸</Label>
        <Select defaultValue="1024x1024" onValueChange={(value) => setValue('size', value)}>
          <SelectTrigger>
            <SelectValue placeholder="选择尺寸" />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isGenerating || isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            上传中...
          </>
        ) : isGenerating ? (
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
    </form>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI 生图</h1>
        <p className="text-muted-foreground">
          使用 AI 生成精美图片
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧表单区域 */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'txt2img' | 'img2img')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="txt2img">
                  <Sparkles className="mr-2 h-4 w-4" />
                  文生图
                </TabsTrigger>
                <TabsTrigger value="img2img">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  图生图
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {renderForm()}
          </CardContent>
        </Card>

        {/* 右侧结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
            <CardDescription>您的AI创作将在这里展示</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex aspect-square items-center justify-center rounded-lg bg-muted"
                >
                  <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">AI正在创作中...</p>
                  </div>
                </motion.div>
              ) : generatedImages.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Tabs defaultValue="0">
                    <TabsList className="mb-4">
                      {generatedImages.map((_, index) => (
                        <TabsTrigger key={index} value={index.toString()}>
                          图片 {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {generatedImages.map((image, index) => (
                      <TabsContent key={index} value={index.toString()}>
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                          <div className="flex h-full items-center justify-center">
                            <Image className="h-24 w-24 text-muted-foreground/50" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <Button size="sm" variant="secondary">
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Heart className="mr-2 h-4 w-4" />
                              收藏
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Share2 className="mr-2 h-4 w-4" />
                              分享
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex aspect-square items-center justify-center rounded-lg bg-muted"
                >
                  <div className="text-center">
                    <Image className="mx-auto h-24 w-24 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      {activeTab === 'txt2img' ? '输入提示词开始创作' : '上传参考图并输入提示词'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
