'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ListTodo,
  Image,
  Music,
  Video,
  Mic,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  FileAudio,
  ExternalLink,
  ImagePlus,
  Coins,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { getUserAITasks, deleteObject, type AITask } from '@/lib/parse-actions';
import { taskApi } from '@/lib/api';
import toast from 'react-hot-toast';

// 状态配置 - 使用数字类型
const statusConfig: Record<number, { label: string; color: 'default' | 'warning' | 'success' | 'destructive'; icon: typeof Clock }> = {
  0: { label: '排队中', color: 'default', icon: Clock },
  1: { label: '生成中', color: 'warning', icon: Loader2 },
  2: { label: '已完成', color: 'success', icon: CheckCircle },
  3: { label: '失败', color: 'destructive', icon: XCircle },
  4: { label: '已奖励', color: 'success', icon: Coins },
};

// 类型配置
const typeConfig: Record<string, { label: string; icon: typeof Image }> = {
  txt2img: { label: '文生图', icon: Image },
  img2img: { label: '图生图', icon: ImagePlus },
  txt2video: { label: '文生视频', icon: Video },
  txt2speech: { label: '文生语音', icon: Mic },
  txt2music: { label: '文生音乐', icon: Music },
  speech2txt: { label: '语音识别', icon: FileAudio },
};

export default function AITasksPage() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const pageSize = 10;

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await getUserAITasks(user.objectId, {
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? parseInt(statusFilter) : undefined,
      page,
      limit: pageSize,
    });
    if (result.success) {
      setTasks(result.data);
      setTotal(result.total);
    } else {
      toast.error(result.error || '加载失败');
    }
    setLoading(false);
  }, [user, typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 切换筛选回到第一页
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    const result = await deleteObject('AITask', taskId);
    if (result.success) {
      toast.success('删除成功');
      fetchTasks();
    } else {
      toast.error(result.error || '删除失败');
    }
  };

  const handleViewDetail = (task: AITask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleDownload = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || `result_${Date.now()}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('下载成功');
    } catch {
      // 如果下载失败，直接打开链接
      window.open(url, '_blank');
    }
  };

  const handleConvertToAsset = async (task: AITask) => {
    const taskId = task.taskId || task.objectId;
    if (!taskId) {
      toast.error('任务ID缺失');
      return;
    }
    if (!confirm('将此任务的生成结果转为AI资产？后续可在 "我的资产" 申请上架到AI商城。')) return;
    setConvertingId(taskId);
    try {
      const res = await taskApi.convertTaskToAsset(taskId);
      if (res?.success) {
        const msg = res.message || `成功转换 ${res.converted_count} 个资产`;
        if (res.converted_count > 0) {
          toast.success(msg);
          router.push('/assets');
        } else {
          toast(msg, { icon: 'ℹ️' });
        }
      } else {
        toast.error('转换失败');
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '转换失败';
      toast.error(errMsg);
    } finally {
      setConvertingId(null);
    }
  };

  const stats = {
    total: total,
    pending: tasks.filter((t) => t.status === 0).length,
    processing: tasks.filter((t) => t.status === 1).length,
    completed: tasks.filter((t) => t.status === 2 || t.status === 4).length,
    failed: tasks.filter((t) => t.status === 3).length,
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI任务</h1>
          <p className="text-muted-foreground">管理您提交的AIGC生成任务</p>
        </div>
        <Button onClick={fetchTasks} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全部任务</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">排队中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">生成中</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="任务类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="txt2img">文生图</SelectItem>
            <SelectItem value="img2img">图生图</SelectItem>
            <SelectItem value="txt2video">文生视频</SelectItem>
            <SelectItem value="txt2speech">文生语音</SelectItem>
            <SelectItem value="txt2music">文生音乐</SelectItem>
            <SelectItem value="speech2txt">语音识别</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="任务状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">排队中</SelectItem>
            <SelectItem value="1">生成中</SelectItem>
            <SelectItem value="2">已完成</SelectItem>
            <SelectItem value="3">失败</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>请先登录</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ListTodo className="h-16 w-16 mb-4" />
          <p>暂无任务</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[180px]">任务ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[100px]">类型</th>
                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[140px]">模型</th>
                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[90px]">状态</th>
                    <th className="px-3 py-3 text-left text-xs font-medium w-[300px]">任务描述</th>
                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[150px]">创建时间</th>
                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[150px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const typeInfo = typeConfig[task.type] || { label: task.type, icon: Image };
                    const statusInfo = statusConfig[task.status] || statusConfig[0];
                    const StatusIcon = statusInfo.icon;
                    const prompt = task.data?.prompt || '';
                    const taskId = task.taskId || task.objectId || '';
                    const canDownload =
                      (task.status === 2 || task.status === 4) &&
                      !!task.results &&
                      task.results.length > 0;
                    return (
                      <tr key={task.objectId} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-3 text-sm">
                          <button
                            type="button"
                            className="font-mono text-xs text-primary hover:underline truncate max-w-[160px] text-left"
                            title={taskId}
                            onClick={() => handleViewDetail(task)}
                          >
                            {taskId || '-'}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">{typeInfo.label}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="truncate max-w-[130px]" title={task.model || ''}>
                            {task.model || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <Badge variant={statusInfo.color}>
                            <StatusIcon
                              className={`mr-1 h-3 w-3 ${task.status === 1 ? 'animate-spin' : ''}`}
                            />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="truncate max-w-[300px]" title={prompt || ''}>
                            {prompt || <span className="text-muted-foreground">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap text-muted-foreground">
                          {formatDate(task.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleViewDetail(task)}>
                              <Eye className="h-4 w-4 mr-1" />
                              详情
                            </Button>
                            {canDownload && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(task.results![0].url)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {canDownload && (
                              <Button
                                size="sm"
                                variant="outline"
                                title="转为AI资产"
                                disabled={convertingId === (task.taskId || task.objectId)}
                                onClick={() => handleConvertToAsset(task)}
                              >
                                {convertingId === (task.taskId || task.objectId) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => task.objectId && handleDelete(task.objectId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {total > 0 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  共 {total} 条记录，第 {page}/{totalPages || 1} 页
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 任务详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const TypeIcon = typeConfig[selectedTask.type]?.icon || Image;
                    return <TypeIcon className="h-5 w-5" />;
                  })()}
                  {typeConfig[selectedTask.type]?.label || selectedTask.type} 任务详情
                </DialogTitle>
                <DialogDescription>
                  创建于 {formatDate(selectedTask.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* 状态 */}
                <div className="flex items-center gap-2">
                  <Label className="w-20">状态</Label>
                  <Badge variant={statusConfig[selectedTask.status]?.color || 'default'}>
                    {statusConfig[selectedTask.status]?.label || '未知'}
                  </Badge>
                </div>

                {/* 模型 */}
                <div className="flex items-center gap-2">
                  <Label className="w-20">模型</Label>
                  <span className="text-sm">{selectedTask.model}</span>
                </div>

                {/* 消耗 */}
                {selectedTask.cost !== undefined && selectedTask.cost > 0 && (
                  <div className="flex items-center gap-2">
                    <Label className="w-20">消耗</Label>
                    <span className="text-sm">{selectedTask.cost} 金币</span>
                  </div>
                )}

                {/* 提示词 */}
                <div>
                  <Label>提示词</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {String(selectedTask.data?.prompt || '无')}
                  </p>
                </div>

                {/* 负面提示词 */}
                {selectedTask.data?.negativePrompt && (
                  <div>
                    <Label>负面提示词</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {String(selectedTask.data.negativePrompt)}
                    </p>
                  </div>
                )}

                {/* 参数 */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedTask.data?.style && (
                    <div>
                      <Label>风格</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.style)}</p>
                    </div>
                  )}
                  {selectedTask.data?.size && (
                    <div>
                      <Label>尺寸</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.size)}</p>
                    </div>
                  )}
                  {selectedTask.data?.quality && (
                    <div>
                      <Label>质量</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.quality)}</p>
                    </div>
                  )}
                  {selectedTask.data?.strength && (
                    <div>
                      <Label>变化强度</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.strength)}</p>
                    </div>
                  )}
                </div>

                {/* 参考图（图生图） */}
                {selectedTask.data?.referenceImage && (
                  <div>
                    <Label>参考图</Label>
                    <div className="mt-2">
                      <img
                        src={String(selectedTask.data.referenceImage)}
                        alt="参考图"
                        className="max-h-40 rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {/* 输入文件（语音识别） */}
                {selectedTask.data?.inputFile && (
                  <div>
                    <Label>输入文件</Label>
                    <a
                      href={String(selectedTask.data.inputFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      查看文件
                    </a>
                  </div>
                )}

                {/* 错误信息 */}
                {selectedTask.errorMessage && (
                  <div>
                    <Label className="text-destructive">错误信息</Label>
                    <p className="mt-1 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      {selectedTask.errorMessage}
                    </p>
                  </div>
                )}

                {/* 结果 */}
                {(selectedTask.status === 2 || selectedTask.status === 4) && selectedTask.results && selectedTask.results.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>生成结果</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={convertingId === (selectedTask.taskId || selectedTask.objectId)}
                        onClick={() => handleConvertToAsset(selectedTask)}
                      >
                        {convertingId === (selectedTask.taskId || selectedTask.objectId) ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Package className="h-4 w-4 mr-1" />
                        )}
                        转为AI资产
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {selectedTask.results.map((result, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border bg-muted">
                          {(selectedTask.type === 'txt2img' || selectedTask.type === 'img2img') ? (
                            <img src={result.url} alt={`结果${idx + 1}`} className="w-full aspect-square object-cover" />
                          ) : (
                            <div className="aspect-square flex items-center justify-center">
                              {(() => {
                                const TypeIcon = typeConfig[selectedTask.type]?.icon || Image;
                                return <TypeIcon className="h-12 w-12 text-muted-foreground" />;
                              })()}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => window.open(result.url, '_blank')}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDownload(result.url, `result_${idx + 1}`)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          {result.CID && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                CID: {result.CID.slice(0, 8)}...
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
