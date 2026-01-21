'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Wallet,
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
  Upload,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store';
import { updateUserProfile, changePassword, getUserById } from '@/lib/parse-actions';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { getWalletBalance, getCoinBalance, getChainInfo } from '@/lib/web3-actions';
import { generateWalletWithPassword, importFromPrivateKeyWithPassword, toChecksumAddress } from '@/lib/web3-client';
import { walletApi } from '@/lib/api';
import { CreateWalletDialog } from '@/components/wallet/CreateWalletDialog';
import Link from 'next/link';
import toast from 'react-hot-toast';

// 表单验证
const profileSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  phone: z.string().optional(),
  bio: z.string().max(200, '简介最多200字').optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, '密码至少6个字符'),
  newPassword: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string().min(6, '密码至少6个字符'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次密码输入不一致',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 使用 useSignedUrl 获取头像 URL（自动刷新）
  const { url: avatarUrl, loading: avatarLoading } = useSignedUrl(user?.avatarKey);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [coinBalance, setCoinBalance] = useState('0');
  const [chainInfo, setChainInfo] = useState<{chainName?: string; chainId?: string}>({});
  const [isBindingWallet, setIsBindingWallet] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 头像上传
  const { uploadFile, uploading } = useFileUpload({
    prefix: 'avatars',
    userId: user?.objectId,
    isPublic: true,
    onSuccess: async (fileUrl, fileKey) => {
      // 保存 avatarKey 到 Parse，用于后续获取预签名 URL
      if (user?.objectId && user?.sessionToken) {
        const result = await updateUserProfile(
          user.objectId,
          { avatarKey: fileKey },
          user.sessionToken
        );
        if (result.success) {
          setUser({ ...user, avatarKey: fileKey });
          toast.success('头像更新成功');
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || '头像上传失败');
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }
    
    await uploadFile(file);
  };

  // 加载钱包信息
  const loadWalletInfo = async (address: string) => {
    const [balanceResult, coinResult, chainResult] = await Promise.all([
      getWalletBalance(address),
      getCoinBalance(address),
      getChainInfo(),
    ]);
    
    if (balanceResult.success) {
      setWalletBalance(balanceResult.formattedBalance || '0');
    }
    if (coinResult.success) {
      setCoinBalance(coinResult.balance || '0');
    }
    if (chainResult.success) {
      setChainInfo({ chainName: chainResult.chainName, chainId: chainResult.chainId });
    }
  };

  // 创建新钱包（显示密码对话框）
  const handleCreateWallet = () => {
    setShowCreateDialog(true);
  };

  // 确认创建钱包（使用密码加密）
  const handleConfirmCreateWallet = async (password: string) => {
    if (!user?.objectId) {
      toast.error('请先登录');
      return;
    }
    
    if (!user?.sessionToken) {
      toast.error('登录信息已过期，请重新登录');
      return;
    }
    
    setIsBindingWallet(true);
    try {
      // 1. 生成钱包并加密
      const result = await generateWalletWithPassword(password);
      if (!result.success || !result.address || !result.encryptedKeystore) {
        throw new Error(result.error || '创建钱包失败');
      }
      
      // 2. 保存到后端（使用 user.sessionToken 作为认证）
      const saveResult = await walletApi.createWallet(
        result.address,
        result.encryptedKeystore,
        user.sessionToken
      );
      
      if (saveResult.success) {
        setWalletAddress(result.address);
        setUser({ ...user, web3Address: result.address });
        await loadWalletInfo(result.address);
        setShowCreateDialog(false);
        toast.success('钱包创建成功');
        
        // 显示完整的助记词信息
        if (result.mnemonic) {
          // 使用 alert 显示完整助记词，确保用户看到并保存
          alert(
            `重要！请备份您的助记词（请勿截图或分享给他人）

${result.mnemonic}

请将以上12个单词安全保存，丢失后无法找回！`
          );
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsBindingWallet(false);
    }
  };

  // 导入钱包
  const handleImportWallet = async () => {
    if (!user?.objectId || !user?.sessionToken) {
      toast.error('请先登录');
      return;
    }
    
    if (!privateKeyInput.trim()) {
      toast.error('请输入私钥');
      return;
    }

    // 请求用户输入密码（为简化，此处直接使用 prompt，实际应用中应使用对话框）
    const password = prompt('请设置钱包密码（用于加密存储）：');
    if (!password || password.length < 6) {
      toast.error('密码至少6位');
      return;
    }
    
    setIsBindingWallet(true);
    try {
      // 1. 导入并加密
      const result = await importFromPrivateKeyWithPassword(privateKeyInput.trim(), password);
      if (!result.success || !result.address || !result.encryptedKeystore) {
        throw new Error(result.error || '导入钱包失败');
      }
      
      // 2. 保存到后端（使用 user.sessionToken）
      const saveResult = await walletApi.importWallet(
        result.address,
        result.encryptedKeystore,
        user.sessionToken
      );
      
      if (saveResult.success) {
        setWalletAddress(result.address);
        setUser({ ...user, web3Address: result.address });
        await loadWalletInfo(result.address);
        setShowImportDialog(false);
        setPrivateKeyInput('');
        toast.success('钱包导入成功');
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsBindingWallet(false);
    }
  };

  // 加载钱包信息
  useEffect(() => {
    if (walletAddress) {
      loadWalletInfo(walletAddress);
    }
  }, [walletAddress]);

  // 页面加载时从服务器刷新用户数据，确保 web3Address 是最新的
  useEffect(() => {
    const refreshUserData = async () => {
      // 需要 sessionToken 才能访问 Parse /users/{userId}
      if (user?.objectId && user?.sessionToken) {
        try {
          const result = await getUserById(user.objectId, user.sessionToken);
          if (result.success && result.user) {
            // 检查服务器上的 web3Address 是否与本地不同
            const serverWeb3Address = result.user.web3Address;
            if (serverWeb3Address && serverWeb3Address !== user.web3Address) {
              // 更新本地 store
              setUser({ ...user, web3Address: serverWeb3Address });
            }
          }
        } catch (error) {
          console.error('[设置页面] 刷新用户数据失败:', error);
        }
      }
    };
    refreshUserData();
  }, [user?.objectId]); // 只在 objectId 变化时刷新（页面加载时）

  // 初始化钱包地址（转换为 checksum 格式）
  useEffect(() => {
    const initWalletAddress = async () => {
      // 确保 user 对象存在且有 web3Address
      if (user && user.web3Address) {
        const checksumAddr = await toChecksumAddress(user.web3Address);
        setWalletAddress(checksumAddr);
      } else if (user && !user.web3Address) {
        // 用户已登录但没有钱包地址
        setWalletAddress('');
      }
    };
    initWalletAddress();
  }, [user]); // 依赖整个 user 对象，而不是 user?.web3Address

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: '',
    },
  });

  // user 变化时同步表单值
  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: '',
      });
    }
  }, [user, profileForm]);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user?.objectId || !user?.sessionToken) {
      toast.error('请先登录');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(
        user.objectId,
        {
          username: data.username,
          email: data.email,
          phone: data.phone || undefined,
          bio: data.bio || undefined,
        },
        user.sessionToken
      );
      
      if (result.success) {
        // 更新 store 中的用户信息
        setUser({
          ...user,
          username: data.username,
          email: data.email,
          phone: data.phone,
        });
        toast.success('个人信息已更新');
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user?.username) {
      toast.error('请先登录');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await changePassword(
        user.username,
        data.currentPassword,
        data.newPassword
      );
      
      if (result.success) {
        toast.success('密码修改成功');
        passwordForm.reset();
      } else {
        toast.error(result.error || '密码修改失败');
      }
    } catch (error) {
      toast.error('密码修改失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" asChild>
        <Link href="/profile">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回用户中心
        </Link>
      </Button>

      {/* 创建钱包密码对话框 */}
      <CreateWalletDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onConfirm={handleConfirmCreateWallet}
        isLoading={isBindingWallet}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>账户设置</CardTitle>
            <CardDescription>管理您的个人信息和安全设置</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  个人信息
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" />
                  安全设置
                </TabsTrigger>
                <TabsTrigger value="wallet">
                  <Wallet className="h-4 w-4 mr-2" />
                  账户地址
                </TabsTrigger>
              </TabsList>

              {/* 个人信息 */}
              <TabsContent value="profile" className="space-y-6 mt-6">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  {/* 头像 */}
                  <div className="flex items-center gap-6 mb-6">
                    <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                      <AvatarImage src={avatarUrl || '/avatars/default.svg'} />
                      <AvatarFallback className="text-xl">
                        {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-2" />更换头像</>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-1">
                        支持 JPG、PNG 格式，文件大小不超过 2MB
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        {...profileForm.register('username')}
                        placeholder="请输入用户名"
                      />
                      {profileForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register('email')}
                        placeholder="请输入邮箱"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone">手机号</Label>
                      <Input
                        id="phone"
                        {...profileForm.register('phone')}
                        placeholder="请输入手机号（选填）"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">个人简介</Label>
                      <Input
                        id="bio"
                        {...profileForm.register('bio')}
                        placeholder="介绍一下自己吧（选填）"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="mt-6" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? '保存中...' : '保存修改'}
                  </Button>
                </form>
              </TabsContent>

              {/* 安全设置 */}
              <TabsContent value="security" className="space-y-6 mt-6">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">当前密码</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...passwordForm.register('currentPassword')}
                          placeholder="请输入当前密码"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">新密码</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          {...passwordForm.register('newPassword')}
                          placeholder="请输入新密码"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">确认新密码</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        placeholder="请再次输入新密码"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="mt-6" disabled={isSubmitting}>
                    <Lock className="h-4 w-4 mr-2" />
                    {isSubmitting ? '修改中...' : '修改密码'}
                  </Button>
                </form>
              </TabsContent>

              {/* Web3钱包 */}
              <TabsContent value="wallet" className="space-y-6 mt-6">
                {walletAddress ? (
                  // 已绑定钱包
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-500" />
                        已绑定钱包
                      </CardTitle>
                      <CardDescription>
                        {chainInfo.chainName || '巴特星球'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">账户地址</Label>
                        <p className="font-mono text-sm break-all mt-1">{walletAddress}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <Label className="text-xs text-muted-foreground">账户余额</Label>
                          <p className="text-lg font-semibold mt-1">{walletBalance}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <Label className="text-xs text-muted-foreground">金币余额</Label>
                          <p className="text-lg font-semibold mt-1">{coinBalance}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => loadWalletInfo(walletAddress)}
                      >
                        刷新余额
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // 未绑定钱包
                  <Card>
                    <CardContent className="pt-6">
                      {showImportDialog ? (
                        // 导入钱包表单
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">导入钱包</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              输入您的私钥以导入现有钱包
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>私钥</Label>
                            <Input
                              type="password"
                              placeholder="请输入私钥"
                              value={privateKeyInput}
                              onChange={(e) => setPrivateKeyInput(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => {
                                setShowImportDialog(false);
                                setPrivateKeyInput('');
                              }}
                            >
                              取消
                            </Button>
                            <Button 
                              className="flex-1"
                              onClick={handleImportWallet}
                              disabled={isBindingWallet}
                            >
                              {isBindingWallet ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />导入中...</>
                              ) : '确认导入'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // 初始状态
                        <div className="text-center py-8">
                          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">绑定账户地址</h3>
                          <p className="text-muted-foreground mb-6">
                            绑定账户以接收创作收益和金币激励
                          </p>
                          <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <Button 
                              onClick={handleCreateWallet}
                              disabled={isBindingWallet}
                            >
                              {isBindingWallet ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />创建中...</>
                              ) : '创建新钱包'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => setShowImportDialog(true)}
                            >
                              导入现有钱包
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
