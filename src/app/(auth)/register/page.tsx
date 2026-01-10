'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import { web3Register } from '@/lib/parse-actions';
import { userApi, authApi } from '@/lib/api';
import {
  generateWalletWithMnemonic,
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
} from '@/lib/web3-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Mail, Smartphone, Wallet, Loader2, Plus, Key, FileText, Copy, Check, AlertTriangle, CheckCircle } from 'lucide-react';

const registerSchema = z
  .object({
    username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少6位').max(32, '密码最多32位'),
    confirmPassword: z.string(),
    inviteCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码输入不一致',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'email');
  const [emailSent, setEmailSent] = useState(false);
  
  // 手机号注册状态
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  
  // Web3注册状态
  const [web3Mode, setWeb3Mode] = useState<'create' | 'importKey' | 'importMnemonic'>('create');
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string; mnemonic: string } | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [web3Password, setWeb3Password] = useState(''); // 账户密码
  const [copied, setCopied] = useState<'address' | 'privateKey' | 'mnemonic' | null>(null);
  const [confirmBackup, setConfirmBackup] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // 调用 FastAPI 注册，发送激活邮件
      await userApi.register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      setEmailSent(true);
      toast.success('注册成功，请查收激活邮件');
    } catch (error) {
      toast.error((error as Error).message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeb3Register = async () => {
    // 验证密码
    if (!web3Password || web3Password.length < 6) {
      toast.error('请设置6位以上的钱包密码');
      return;
    }

    setIsLoading(true);
    try {
      let walletAddress: string;

      if (web3Mode === 'create') {
        // 使用已生成的钱包
        if (!generatedWallet) {
          toast.error('请先生成账户');
          setIsLoading(false);
          return;
        }
        if (!confirmBackup) {
          toast.error('请确认已备份助记词和私钥');
          setIsLoading(false);
          return;
        }
        walletAddress = generatedWallet.address;
      } else if (web3Mode === 'importKey') {
        if (!privateKey.trim()) {
          toast.error('请输入私钥');
          setIsLoading(false);
          return;
        }
        const result = await importWalletFromPrivateKey(privateKey.trim());
        if (!result.success || !result.address) {
          toast.error(result.error || '无效的私钥');
          setIsLoading(false);
          return;
        }
        walletAddress = result.address;
      } else {
        if (!mnemonic.trim()) {
          toast.error('请输入助记词');
          setIsLoading(false);
          return;
        }
        const result = await importWalletFromMnemonic(mnemonic.trim());
        if (!result.success || !result.address) {
          toast.error(result.error || '无效的助记词');
          setIsLoading(false);
          return;
        }
        walletAddress = result.address;
      }

      // 调用注册：地址 + 钱包密码
      const registerResult = await web3Register(walletAddress, web3Password);

      if (registerResult.success && registerResult.user) {
        const user = registerResult.user;
        setUser({
          objectId: user.objectId,
          sessionToken: user.sessionToken,
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          level: user.level || 1,
          isPaid: user.isPaid || false,
          inviteCount: user.inviteCount || 0,
          successRegCount: user.successRegCount || 0,
          totalIncentive: user.totalIncentive || 0,
          avatar: user.avatar,
          web3Address: walletAddress,
        });
        toast.success('注册成功');
        router.push('/');
      } else {
        toast.error(registerResult.error || '注册失败');
      }
    } catch (error) {
      toast.error('注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWallet = async () => {
    setIsLoading(true);
    try {
      const result = await generateWalletWithMnemonic();
      if (result.success && result.address && result.privateKey && result.mnemonic) {
        setGeneratedWallet({
          address: result.address,
          privateKey: result.privateKey,
          mnemonic: result.mnemonic,
        });
        setConfirmBackup(false);
        toast.success('钱包生成成功，请备份助记词和私钥');
      } else {
        toast.error(result.error || '生成钱包失败');
      }
    } catch {
      toast.error('生成钱包失败');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'address' | 'privateKey' | 'mnemonic') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast.success('已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  // 邮箱激活成功页面
  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">注册成功</CardTitle>
            <CardDescription>激活邮件已发送</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              我们已向您的邮箱发送了激活邮件，请查收并点击链接激活账号。
            </p>
            <p className="text-sm text-muted-foreground">
              激活链接24小时内有效
            </p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => router.push('/login')}>
                返回登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>加入巴特星球，开启AI创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                邮箱注册
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Smartphone className="mr-2 h-4 w-4" />
                手机注册
              </TabsTrigger>
              <TabsTrigger value="web3">
                <Wallet className="mr-2 h-4 w-4" />
                WEB3账户
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    placeholder="请输入用户名"
                    {...register('username')}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">邀请码（选填）</Label>
                  <Input
                    id="inviteCode"
                    placeholder="请输入邀请码"
                    {...register('inviteCode')}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    '注册'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input 
                    placeholder="请输入手机号" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="验证码" 
                    className="flex-1" 
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button 
                    variant="outline" 
                    disabled={phoneSending || phoneCountdown > 0 || !phone || phone.length !== 11}
                    onClick={async () => {
                      setPhoneSending(true);
                      try {
                        const result = await authApi.sendSms(phone, 'register');
                        toast.success('验证码已发送');
                        // 开发环境显示验证码
                        if (result.code) {
                          toast.success(`测试验证码: ${result.code}`, { duration: 10000 });
                        }
                        setPhoneCountdown(60);
                        const timer = setInterval(() => {
                          setPhoneCountdown((prev) => {
                            if (prev <= 1) {
                              clearInterval(timer);
                              return 0;
                            }
                            return prev - 1;
                          });
                        }, 1000);
                      } catch (error) {
                        toast.error((error as Error).message || '发送失败');
                      } finally {
                        setPhoneSending(false);
                      }
                    }}
                  >
                    {phoneCountdown > 0 ? `${phoneCountdown}s` : '获取验证码'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>设置密码</Label>
                  <Input 
                    type="password" 
                    placeholder="请设置密码（6位以上）" 
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  className="w-full" 
                  disabled={isLoading || !phone || !phoneCode || !phonePassword || phonePassword.length < 6}
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const result = await userApi.registerPhone({
                        phone,
                        code: phoneCode,
                        password: phonePassword,
                      });
                      toast.success(result.message || '注册成功');
                      router.push('/login');
                    } catch (error) {
                      toast.error((error as Error).message || '注册失败');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />注册中...</>
                  ) : (
                    '注册'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="web3" className="mt-4">
              <div className="space-y-4">
                {/* Web3注册模式切换 */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={web3Mode === 'create' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setWeb3Mode('create')}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    创建账户
                  </Button>
                  <Button
                    type="button"
                    variant={web3Mode === 'importKey' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setWeb3Mode('importKey')}
                  >
                    <Key className="mr-1 h-3 w-3" />
                    私钥导入
                  </Button>
                  <Button
                    type="button"
                    variant={web3Mode === 'importMnemonic' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setWeb3Mode('importMnemonic')}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    助记词
                  </Button>
                </div>

                {web3Mode === 'create' && (
                  <div className="space-y-4">
                    {!generatedWallet ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          创建新的账户地址进行注册
                        </p>
                        <Button onClick={handleGenerateWallet} disabled={isLoading}>
                          {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
                          ) : (
                            <><Plus className="mr-2 h-4 w-4" />生成新账户</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                              请立即备份助记词和私钥！它们是恢复账户的唯一方式，丢失将无法找回。
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">账户地址</Label>
                          <div className="flex gap-2">
                            <Input value={generatedWallet.address} readOnly className="text-xs font-mono" />
                            <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedWallet.address, 'address')}>
                              {copied === 'address' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">助记词（12个单词）</Label>
                          <div className="flex gap-2">
                            <Textarea value={generatedWallet.mnemonic} readOnly className="text-xs font-mono" rows={2} />
                            <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedWallet.mnemonic, 'mnemonic')}>
                              {copied === 'mnemonic' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">私钥</Label>
                          <div className="flex gap-2">
                            <Input type="password" value={generatedWallet.privateKey} readOnly className="text-xs font-mono" />
                            <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedWallet.privateKey, 'privateKey')}>
                              {copied === 'privateKey' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="confirmBackup"
                            checked={confirmBackup}
                            onChange={(e) => setConfirmBackup(e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="confirmBackup" className="text-xs text-muted-foreground">
                            我已备份助记词和私钥
                          </label>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">设置账户密码</Label>
                          <Input
                            type="password"
                            placeholder="设置登录密码（6位以上）"
                            value={web3Password}
                            onChange={(e) => setWeb3Password(e.target.value)}
                            disabled={isLoading}
                          />
                          <p className="text-xs text-muted-foreground">此密码用于账户登录，请牢记</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {web3Mode === 'importKey' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>私钥</Label>
                      <Input
                        type="password"
                        placeholder="请输入私钥（0x...）"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        disabled={isLoading}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">私钥仅在本地使用，不会上传服务器</p>
                    </div>
                    <div className="space-y-2">
                      <Label>设置账户密码</Label>
                      <Input
                        type="password"
                        placeholder="设置登录密码（6位以上）"
                        value={web3Password}
                        onChange={(e) => setWeb3Password(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {web3Mode === 'importMnemonic' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>助记词</Label>
                      <Textarea
                        placeholder="请输入12或24个助记词单词，用空格分隔"
                        value={mnemonic}
                        onChange={(e) => setMnemonic(e.target.value)}
                        disabled={isLoading}
                        rows={3}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">助记词仅在本地使用，不会上传服务器</p>
                    </div>
                    <div className="space-y-2">
                      <Label>设置账户密码</Label>
                      <Input
                        type="password"
                        placeholder="设置登录密码（6位以上）"
                        value={web3Password}
                        onChange={(e) => setWeb3Password(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleWeb3Register}
                  disabled={isLoading || (web3Mode === 'create' && (!generatedWallet || !confirmBackup)) || !web3Password}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />注册中...</>
                  ) : (
                    <><Wallet className="mr-2 h-4 w-4" />注册账户</>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            已有账号？{' '}
            <Link href={activeTab === 'web3' ? '/login?tab=web3' : '/login'} className="text-primary hover:underline">
              立即登录
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            注册即表示您同意{' '}
            <Link href="/more/user-agreement" className="text-primary hover:underline">
              用户协议
            </Link>{' '}
            和{' '}
            <Link href="/more/privacy-policy" className="text-primary hover:underline">
              隐私政策
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
