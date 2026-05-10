'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { CopyableCell } from '@/components/admin/copyable-cell';

interface TaskRow {
  objectId: string;
  task_id: string;
  type: string;
  model: string;
  status: number;
  designer: string;
  username: string;
  errorMessage?: string;
  data?: Record<string, unknown>;
  cost?: number;
  results?: unknown;
  created_at: string;
  updated_at?: string;
}

const statusLabels: Record<number, string> = {
  0: '排队中',
  1: '处理中',
  2: '已完成',
  3: '失败',
  4: '已结算',
};

const statusColors: Record<number, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  0: 'warning',
  1: 'default',
  2: 'success',
  3: 'destructive',
  4: 'success',
};

const typeLabels: Record<string, string> = {
  txt2img: '文生图',
  img2img: '图生图',
  txt2speech: '文生语音',
  speech2txt: '语音转文字',
  txt2music: '文生音乐',
  txt2video: '文生视频',
};

function getTaskDescription(task: TaskRow): string {
  const d = task.data || {};
  const prompt = d.prompt as string | undefined;
  if (prompt && prompt.trim()) return prompt.trim();
  const inputFile = d.inputFile as string | undefined;
  if (inputFile) return `输入文件：${inputFile}`;
  const ref = d.referenceImage as string | undefined;
  if (ref) return `参考图：${ref}`;
  return '';
}

interface TasksViewProps {
  title?: string;
  subtitle?: string;
}

export function TasksView({ title = '任务中心', subtitle = '查看全平台的 AI 生成任务' }: TasksViewProps) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [designerInput, setDesignerInput] = useState('');
  const [designer, setDesigner] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  // 批量选中
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const pageSize = 20;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: number; type?: string; designer?: string } = {
        page,
        limit: pageSize,
      };
      if (statusFilter !== 'all') params.status = Number(statusFilter);
      if (typeFilter !== 'all') params.type = typeFilter;
      if (designer.trim()) params.designer = designer.trim();
      const res = await adminApi.listTasks(params);
      setTasks(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      toast.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, designer]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, designer]);

  // 翻页 / 筛选变化时清空选中
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, statusFilter, typeFilter, designer]);

  const allSelectedOnPage = useMemo(
    () => tasks.length > 0 && tasks.every((t) => selectedIds.has(t.objectId)),
    [tasks, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.objectId)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`确定要删除选中的 ${ids.length} 个任务吗？此操作不可恢复`)) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => adminApi.deleteAdminTask(id))
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      if (failed === 0) toast.success(`批量删除成功：${ok}/${results.length}`);
      else toast.error(`删除完成：成功 ${ok}，失败 ${failed}`);
      clearSelection();
      // 如当前页全部删完且非第一页，退一页
      if (ok === tasks.length && page > 1) setPage((p) => p - 1);
      else fetchTasks();
    } finally {
      setBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const openDetail = (task: TaskRow) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleDelete = async (task: TaskRow) => {
    if (!confirm(`确定要删除任务 ${task.task_id || task.objectId} 吗？`)) return;
    try {
      await adminApi.deleteAdminTask(task.objectId);
      toast.success('已删除');
      // 若当前页删完则回退一页
      if (tasks.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchTasks();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>任务列表</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="按提交者 userID 或 用户名 搜索..."
                  value={designerInput}
                  onChange={(e) => setDesignerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setDesigner(designerInput.trim());
                  }}
                  className="pl-10"
                />
              </div>
              {designer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDesignerInput('');
                    setDesigner('');
                  }}
                >
                  清除用户
                </Button>
              )}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="txt2img">文生图</SelectItem>
                  <SelectItem value="img2img">图生图</SelectItem>
                  <SelectItem value="txt2speech">文生语音</SelectItem>
                  <SelectItem value="speech2txt">语音转文字</SelectItem>
                  <SelectItem value="txt2music">文生音乐</SelectItem>
                  <SelectItem value="txt2video">文生视频</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="0">排队中</SelectItem>
                  <SelectItem value="1">处理中</SelectItem>
                  <SelectItem value="2">已完成</SelectItem>
                  <SelectItem value="3">失败</SelectItem>
                  <SelectItem value="4">已结算</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchTasks} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 批量操作栏 */}
          {!loading && tasks.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer"
                  checked={allSelectedOnPage}
                  onChange={toggleSelectAll}
                  aria-label="全选"
                />
                <span className="text-sm">
                  {selectedIds.size > 0
                    ? `已选 ${selectedIds.size} / ${tasks.length} 项`
                    : `全选当前页（${tasks.length} 项）`}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={bulkDeleting}
                    onClick={handleBulkDelete}
                  >
                    {bulkDeleting ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1 h-4 w-4" />
                    )}
                    批量删除（{selectedIds.size}）
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    取消选择
                  </Button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">暂无任务数据</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-3 w-[40px]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer"
                          checked={allSelectedOnPage}
                          onChange={toggleSelectAll}
                          aria-label="全选"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[180px]">任务ID</th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[90px]">类型</th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[140px]">模型</th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[130px]">提交人</th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[90px]">状态</th>
                      <th className="px-3 py-3 text-left text-xs font-medium w-[260px]">任务描述</th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[150px]">创建时间</th>
                      <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap w-[130px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const desc = getTaskDescription(task);
                      return (
                        <tr key={task.objectId} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer"
                              checked={selectedIds.has(task.objectId)}
                              onChange={() => toggleSelect(task.objectId)}
                              aria-label="选择"
                            />
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <button
                              type="button"
                              className="font-mono text-xs text-primary hover:underline truncate max-w-[160px] text-left"
                              title={task.task_id || task.objectId}
                              onClick={() => openDetail(task)}
                            >
                              {task.task_id || task.objectId}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-sm whitespace-nowrap">
                            {typeLabels[task.type] || task.type}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <CopyableCell value={task.model || ''} maxWidth="max-w-[130px]" />
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <div className="flex flex-col gap-0.5">
                              <CopyableCell
                                value={task.username || '-'}
                                maxWidth="max-w-[120px]"
                              />
                              <span
                                className="text-[11px] text-muted-foreground truncate max-w-[120px]"
                                title={task.designer}
                              >
                                {task.designer || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm whitespace-nowrap">
                            <Badge variant={statusColors[task.status] || 'default'}>
                              {statusLabels[task.status] ?? task.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <div className="truncate max-w-[260px]" title={desc || ''}>
                              {desc || <span className="text-muted-foreground">-</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm whitespace-nowrap text-muted-foreground">
                            {formatDate(task.created_at)}
                          </td>
                          <td className="px-3 py-3 text-sm whitespace-nowrap">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => openDetail(task)}>
                                <Eye className="h-4 w-4 mr-1" />
                                详情
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(task)}
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

              <div className="mt-4 flex items-center justify-between">
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
            </>
          )}
        </CardContent>
      </Card>

      {/* 任务详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {typeLabels[selectedTask.type] || selectedTask.type} 任务详情
                </DialogTitle>
                <DialogDescription>
                  创建于 {formatDate(selectedTask.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">任务ID</Label>
                    <p className="mt-1 text-sm font-mono break-all">
                      {selectedTask.task_id || selectedTask.objectId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">状态</Label>
                    <div className="mt-1">
                      <Badge variant={statusColors[selectedTask.status] || 'default'}>
                        {statusLabels[selectedTask.status] ?? selectedTask.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">模型</Label>
                    <p className="mt-1 text-sm">{selectedTask.model || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">提交人</Label>
                    <p className="mt-1 text-sm">
                      {selectedTask.username || '-'}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({selectedTask.designer || '-'})
                      </span>
                    </p>
                  </div>
                  {selectedTask.cost !== undefined && selectedTask.cost > 0 && (
                    <div>
                      <Label className="text-muted-foreground">消耗</Label>
                      <p className="mt-1 text-sm">{selectedTask.cost} 金币</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">更新时间</Label>
                    <p className="mt-1 text-sm">{formatDate(selectedTask.updated_at)}</p>
                  </div>
                </div>

                {/* 任务描述 / 提示词 */}
                <div>
                  <Label>任务描述</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap break-all">
                    {getTaskDescription(selectedTask) || '无'}
                  </p>
                </div>

                {/* 负面提示词 */}
                {selectedTask.data?.negativePrompt && (
                  <div>
                    <Label>负面提示词</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap break-all">
                      {String(selectedTask.data.negativePrompt)}
                    </p>
                  </div>
                )}

                {/* 其它参数 */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedTask.data?.style ? (
                    <div>
                      <Label className="text-muted-foreground">风格</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.style)}</p>
                    </div>
                  ) : null}
                  {selectedTask.data?.size ? (
                    <div>
                      <Label className="text-muted-foreground">尺寸</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.size)}</p>
                    </div>
                  ) : null}
                  {selectedTask.data?.quality ? (
                    <div>
                      <Label className="text-muted-foreground">质量</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.quality)}</p>
                    </div>
                  ) : null}
                  {selectedTask.data?.strength ? (
                    <div>
                      <Label className="text-muted-foreground">变化强度</Label>
                      <p className="mt-1 text-sm">{String(selectedTask.data.strength)}</p>
                    </div>
                  ) : null}
                </div>

                {/* 错误信息 */}
                {selectedTask.errorMessage && (
                  <div>
                    <Label className="text-destructive">错误信息</Label>
                    <p className="mt-1 text-sm text-destructive bg-destructive/10 p-3 rounded-lg whitespace-pre-wrap break-all">
                      {selectedTask.errorMessage}
                    </p>
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
