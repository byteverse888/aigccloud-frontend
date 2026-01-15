'use client';

import { useState, Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore, useWalletStore } from '@/store';
import { loginUser } from '@/lib/parse-actions';
import { authApi } from '@/lib/api';
import {
  hasExternalWallet,
  connectMetaMask,
  signWithMetaMask,
  importFromPrivateKey,
  importFromMnemonic,
  signWithPrivateKey,
} from '@/lib/web3-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Mail, Smartphone, Wallet, Loader2, Key, FileText, AlertTriangle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名/手机号/邮箱'),
  password: z.string().min(6, '密码至少6位'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const { setPrivateKey: savePrivateKey, setWalletType } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'password');
  
  // Web3 登录模式: metamask（有MM时）, privateKey, mnemonic（无MM时）
  const [web3Mode, setWeb3Mode] = useState<'metamask' | 'privateKey' | 'mnemonic'>('metamask');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [metamaskAddress, setMetamaskAddress] = useState('');
  
  // 私钥/助记词
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  
  // 内置钱包登录密码
  const [web3Password, setWeb3Password] = useState('');

  // 手机号登录状态
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  // 检测 MetaMask
  useEffect(() => {
    const hasMM = hasExternalWallet();
    setHasMetaMask(hasMM);
    if (!hasMM) {
      setWeb3Mode('privateKey');
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 通用的设置用户信息
  const handleSetUser = (user: any, token?: string) => {
    setUser({
      objectId: user.objectId,
      sessionToken: token || user.sessionToken,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role || 'user',
      level: user.level || 1,
      memberLevel: user.memberLevel || 'normal',
      inviteCount: user.inviteCount || 0,
      successRegCount: user.successRegCount || 0,
      totalIncentive: user.totalIncentive || 0,
      avatar: user.avatar,
      avatarKey: user.avatarKey,
      web3Address: user.web3Address,
    });
  };

  // 账号密码登录（支持用户名/手机号/邮箱）
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // 先尝试邮箱登录（如果是邮箱格式）
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isEmail = emailRegex.test(data.username);
      
      if (isEmail) {
        // 使用邮箱登录 API
        const emailResult = await authApi.emailLogin(data.username, data.password);
        if (emailResult.success && emailResult.user) {
          handleSetUser(emailResult.user, emailResult.token);
          toast.success('登录成功');
          router.push('/');
          return;
        }
      } else {
        // 使用传统登录（用户名或手机号）
        const result = await loginUser(data.username, data.password);
        if (result.success && result.user) {
          handleSetUser(result.user);
          toast.success('登录成功');
          router.push('/');
        } else {
          toast.error(result.error || '登录失败');
        }
      }
    } catch (error) {
      toast.error((error as Error).message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phone || phone.length !== 11) {
      toast.error('请输入有效的手机号');
      return;
    }
    if (!phoneCode) {
      toast.error('请输入验证码');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.phoneLogin(phone, phoneCode);
      if (result.success && result.user) {
        handleSetUser(result.user, result.token);
        toast.success('登录成功');
        router.push('/');
      } else {
        toast.error('登录失败');
      }
    } catch (error) {
      toast.error((error as Error).message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSms = async () => {
    if (!phone || phone.length !== 11) {
      toast.error('请输入有效的手机号');
      return;
    }
    setPhoneSending(true);
    try {
      const result = await authApi.sendSms(phone, 'login');
      toast.success('验证码已发送');
      if (result.code) {
        toast.success(`测试验证码: ${result.code}`, { duration: 10000 });
      }
      setPhoneCountdown(60);
      const timer = setInterval(() => {
        setPhoneCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error((error as Error).message || '发送失败');
    } finally {
      setPhoneSending(false);
    }
  };

  // Web3 签名登录（通用流程）
  const handleWeb3SignLogin = async (
    address: string, 
    signFn: (message: string) => Promise<{ success: boolean; signature?: string; error?: string }>,
    password: string
  ) => {
    setIsLoading(true);
    try {
      // 1. 获取 nonce
      console.log('[Web3] 获取nonce...');
      const initResult = await authApi.web3Init(address);
      console.log('[Web3] nonce结果:', initResult);
      if (!initResult.success) {
        toast.error('获取验证信息失败');
        return;
      }

      // 2. 签名消息（私钥不离开客户端）
      toast('请在钱包中确认登录巴特星球', { duration: 5000 });
      console.log('[Web3] 开始签名...');
      const signResult = await signFn(initResult.message);
      console.log('[Web3] 签名结果:', signResult);
      if (!signResult.success || !signResult.signature) {
        toast.error(signResult.error || '签名失败');
        return;
      }

      // 3. 验证签名并登录
      console.log('[Web3] 签名成功，开始登录...');
      const loginResult = await authApi.web3Login(address, signResult.signature, initResult.message, password);
      console.log('[Web3] 登录结果:', loginResult);
      if (loginResult.success && loginResult.user) {
        handleSetUser(loginResult.user, loginResult.token);
        toast.success(loginResult.message || '登录成功');
        router.push('/');
      } else {
        toast.error('登录失败');
      }
    } catch (error) {
      toast.error((error as Error).message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  // MetaMask 连接并登录（需要密码）
  const handleMetaMaskLogin = async () => {
    console.log('[Web3] handleMetaMaskLogin 开始');
    if (!web3Password || web3Password.length < 6) {
      toast.error('请输入登录密码（至少6位）');
      return;
    }
    
    console.log('[Web3] 连接MetaMask...');
    const connectResult = await connectMetaMask();
    console.log('[Web3] MetaMask连接结果:', connectResult);
    if (!connectResult.success || !connectResult.address) {
      toast.error(connectResult.error || '连接钱包失败');
      return;
    }
    
    const address = connectResult.address;
    setMetamaskAddress(address);

    // MetaMask 登录也需要密码
    console.log('[Web3] 调用handleWeb3SignLogin...');
    await handleWeb3SignLogin(address, (message) => signWithMetaMask(message, address), web3Password);
    console.log('[Web3] handleWeb3SignLogin 完成');
  };

  // 私钥签名登录（需要登录密码）
  const handlePrivateKeyLogin = async () => {
    if (!privateKey.trim()) {
      toast.error('请输入私钥');
      return;
    }
    if (!web3Password || web3Password.length < 6) {
      toast.error('请输入登录密码（至少6位）');
      return;
    }

    const importResult = await importFromPrivateKey(privateKey.trim());
    if (!importResult.success || !importResult.address || !importResult.privateKey) {
      toast.error(importResult.error || '无效的私钥');
      return;
    }

    // 保存私钥到内存
    savePrivateKey(importResult.privateKey);
    setWalletType('privateKey');

    await handleWeb3SignLogin(
      importResult.address, 
      (message) => signWithPrivateKey(importResult.privateKey!, message),
      web3Password
    );
  };

  // 助记词签名登录（需要登录密码）
  const handleMnemonicLogin = async () => {
    if (!mnemonic.trim()) {
      toast.error('请输入助记词');
      return;
    }
    if (!web3Password || web3Password.length < 6) {
      toast.error('请输入登录密码（至少6位）');
      return;
    }

    const importResult = await importFromMnemonic(mnemonic.trim());
    if (!importResult.success || !importResult.address || !importResult.privateKey) {
      toast.error(importResult.error || '无效的助记词');
      return;
    }

    // 保存私钥到内存
    savePrivateKey(importResult.privateKey);
    setWalletType('mnemonic');

    await handleWeb3SignLogin(
      importResult.address, 
      (message) => signWithPrivateKey(importResult.privateKey!, message),
      web3Password
    );
  };

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
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>登录巴特星球，开启AI创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">
                <Mail className="mr-2 h-4 w-4" />
                账号登录
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Smartphone className="mr-2 h-4 w-4" />
                手机登录
              </TabsTrigger>
              {/* Web3登录暂时隐藏，等待Electron客户端完成
              <TabsTrigger value="web3">
                <Wallet className="mr-2 h-4 w-4" />
                WEB3登录
              </TabsTrigger>
              */}
            </TabsList>

            {/* 账号密码登录 */}
            <TabsContent value="password" className="mt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名 / 手机号 / 邮箱</Label>
                  <Input
                    id="username"
                    placeholder="请输入用户名/手机号/邮箱"
                    autoComplete="username"
                    {...register('username')}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Link href="/forgot-password" className="text-primary hover:underline">
                    忘记密码？
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />登录中...</> : '登录'}
                </Button>
              </form>
            </TabsContent>

            {/* 手机号登录 */}
            <TabsContent value="phone" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input
                    placeholder="请输入手机号"
                    autoComplete="tel"
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
                    onClick={handleSendSms}
                  >
                    {phoneCountdown > 0 ? `${phoneCountdown}s` : '获取验证码'}
                  </Button>
                </div>
                <Button className="w-full" disabled={isLoading || !phone || !phoneCode} onClick={handlePhoneLogin}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />登录中...</> : '登录'}
                </Button>
              </div>
            </TabsContent>

            {/* WEB3 登录 - 暂时隐藏，等待Electron客户端完成 */}
            {false && (
            <TabsContent value="web3" className="mt-4">
              <div className="space-y-4">
                {/* 有 MetaMask 时：显示 MetaMask + 密码 */}
                {hasMetaMask ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        检测到 MetaMask 钱包，推荐使用
                      </p>
                    </div>
                    {metamaskAddress && (
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">已连接地址</p>
                        <p className="font-mono text-sm break-all">{metamaskAddress}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>登录密码</Label>
                      <Input
                        type="password"
                        placeholder="请输入登录密码（至少6位）"
                        value={web3Password}
                        onChange={(e) => setWeb3Password(e.target.value)}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <p className="text-xs text-muted-foreground">注册时设置的账户登录密码</p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleMetaMaskLogin} 
                      disabled={isLoading || !web3Password || web3Password.length < 6}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />处理中...</>
                      ) : (
                        <><Wallet className="mr-2 h-4 w-4" />连接 MetaMask 登录</>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* 无 MetaMask：显示内置钱包选项 */
                  <>
                    {/* 模式切换 */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={web3Mode === 'privateKey' ? 'default' : 'outline'}
                        className="flex-1"
                        size="sm"
                        onClick={() => setWeb3Mode('privateKey')}
                      >
                        <Key className="mr-1 h-3 w-3" />
                        私钥登录
                      </Button>
                      <Button
                        type="button"
                        variant={web3Mode === 'mnemonic' ? 'default' : 'outline'}
                        className="flex-1"
                        size="sm"
                        onClick={() => setWeb3Mode('mnemonic')}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        助记词登录
                      </Button>
                    </div>

                    {/* 安全警告 */}
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          内置钱包存在安全风险，建议安装 MetaMask 浏览器扩展获得更好的安全性。
                        </p>
                      </div>
                    </div>

                    {/* 私钥登录 */}
                    {web3Mode === 'privateKey' && (
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
                        </div>
                        <div className="space-y-2">
                          <Label>登录密码</Label>
                          <Input
                            type="password"
                            placeholder="请输入登录密码（至少6位）"
                            value={web3Password}
                            onChange={(e) => setWeb3Password(e.target.value)}
                            disabled={isLoading}
                            autoComplete="current-password"
                          />
                          <p className="text-xs text-muted-foreground">注册时设置的账户登录密码</p>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handlePrivateKeyLogin} 
                          disabled={isLoading || !privateKey || !web3Password || web3Password.length < 6}
                        >
                          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />处理中...</> : <><Key className="mr-2 h-4 w-4" />登录</>}
                        </Button>
                      </div>
                    )}

                    {/* 助记词登录 */}
                    {web3Mode === 'mnemonic' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>助记词</Label>
                          <Textarea
                            placeholder="请输入12或24个助记词，用空格分隔"
                            value={mnemonic}
                            onChange={(e) => setMnemonic(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            autoComplete="off"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>登录密码</Label>
                          <Input
                            type="password"
                            placeholder="请输入登录密码（至少6位）"
                            value={web3Password}
                            onChange={(e) => setWeb3Password(e.target.value)}
                            disabled={isLoading}
                            autoComplete="current-password"
                          />
                          <p className="text-xs text-muted-foreground">注册时设置的账户登录密码</p>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handleMnemonicLogin} 
                          disabled={isLoading || !mnemonic || !web3Password || web3Password.length < 6}
                        >
                          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />处理中...</> : <><FileText className="mr-2 h-4 w-4" />登录</>}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
            )}
          </Tabs>

          <div className="mt-6 text-center text-sm">
            还没有账号？{' '}
            <Link href="/register" className="text-primary hover:underline">
              立即注册
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            登录即表示您同意{' '}
            <Link href="/more/user-agreement" className="text-primary hover:underline">用户协议</Link>
            {' '}和{' '}
            <Link href="/more/privacy-policy" className="text-primary hover:underline">隐私政策</Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
