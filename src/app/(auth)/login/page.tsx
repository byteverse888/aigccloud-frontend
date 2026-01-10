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
import { loginUser } from '@/lib/parse-actions';
import { authApi } from '@/lib/api';
import {
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
} from '@/lib/web3-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Mail, Smartphone, Wallet, Loader2, Key, FileText } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名或邮箱'),
  password: z.string().min(6, '密码至少6位'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'password');
  
  // Web3 登录模式: privateKey(私钥), mnemonic(助记词)
  const [web3Mode, setWeb3Mode] = useState<'privateKey' | 'mnemonic'>('privateKey');
  
  // 地址登录
  const [web3Address, setWeb3Address] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  
  // 私钥/助记词登录
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [importPassword, setImportPassword] = useState('');

  // 手机号登录状态
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 通用的设置用户信息
  const handleSetUser = (user: any, web3Addr?: string) => {
    setUser({
      objectId: user.objectId,
      sessionToken: user.sessionToken,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role || 'user',
      level: user.level || 1,
      isPaid: user.isPaid || false,
      inviteCount: user.inviteCount || 0,
      successRegCount: user.successRegCount || 0,
      totalIncentive: user.totalIncentive || 0,
      avatar: user.avatar,
      avatarKey: user.avatarKey,
      web3Address: web3Addr || user.web3Address,
    });
  };

  // 账号密码登录
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await loginUser(data.username, data.password);
      if (result.success && result.user) {
        handleSetUser(result.user);
        toast.success('登录成功');
        router.push('/');
      } else {
        toast.error(result.error || '登录失败');
      }
    } catch (error) {
      toast.error('登录失败，请稍后重试');
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
        setUser({
          objectId: result.user.objectId,
          sessionToken: result.token,
          username: result.user.username,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role || 'user',
          level: result.user.level || 1,
          isPaid: result.user.isPaid || false,
          inviteCount: result.user.inviteCount || 0,
          successRegCount: result.user.successRegCount || 0,
          totalIncentive: result.user.totalIncentive || 0,
          avatar: result.user.avatar,
          avatarKey: result.user.avatarKey,
          web3Address: result.user.web3Address,
        });
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

  // WEB3 地址登录
  const handleWeb3AddressLogin = async () => {
    if (!web3Address.trim()) {
      toast.error('请输入账户地址');
      return;
    }
    if (!walletPassword || walletPassword.length < 6) {
      toast.error('请输入6位以上的钱包密码');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(web3Address.trim().toLowerCase(), walletPassword);
      if (result.success && result.user) {
        handleSetUser(result.user, web3Address.trim().toLowerCase());
        toast.success('登录成功');
        router.push('/');
      } else {
        toast.error(result.error || '登录失败，请检查地址或密码');
      }
    } catch (error) {
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 私钥/助记词登录
  const handleImportLogin = async () => {
    if (!importPassword || importPassword.length < 6) {
      toast.error('请输入6位以上的钱包密码');
      return;
    }

    setIsLoading(true);
    try {
      let walletAddress: string;

      // 恢复地址
      if (web3Mode === 'privateKey') {
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

      // 尝试登录
      const loginResult = await loginUser(walletAddress.toLowerCase(), importPassword);
      
      if (loginResult.success && loginResult.user) {
        handleSetUser(loginResult.user, walletAddress);
        toast.success('登录成功');
        router.push('/');
      } else {
        // 登录失败，统一提示
        toast.error('用户密码不匹配或用户不存在，请先注册');
      }
    } catch (error) {
      toast.error('操作失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="password">
                <Mail className="mr-2 h-4 w-4" />
                账号登录
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Smartphone className="mr-2 h-4 w-4" />
                手机登录
              </TabsTrigger>
              <TabsTrigger value="web3">
                <Wallet className="mr-2 h-4 w-4" />
                WEB3登录
              </TabsTrigger>
            </TabsList>

            {/* 账号密码登录 */}
            <TabsContent value="password" className="mt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名 / 邮箱</Label>
                  <Input
                    id="username"
                    placeholder="请输入用户名或邮箱"
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

            {/* WEB3 登录 */}
            <TabsContent value="web3" className="mt-4">
              <div className="space-y-4">
                {/* 子模式切换 */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={web3Mode === 'privateKey' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setWeb3Mode('privateKey')}
                  >
                    <Key className="mr-1 h-3 w-3" />
                    私钥
                  </Button>
                  <Button
                    type="button"
                    variant={web3Mode === 'mnemonic' ? 'default' : 'outline'}
                    className="flex-1"
                    size="sm"
                    onClick={() => setWeb3Mode('mnemonic')}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    助记词
                  </Button>
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
                      <p className="text-xs text-muted-foreground">私钥仅在本地使用，不会上传服务器</p>
                    </div>
                    <div className="space-y-2">
                      <Label>钱包密码</Label>
                      <Input
                        type="password"
                        placeholder="请输入钱包密码"
                        value={importPassword}
                        onChange={(e) => setImportPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button className="w-full" onClick={handleImportLogin} disabled={isLoading || !privateKey || !importPassword}>
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
                      <p className="text-xs text-muted-foreground">助记词仅在本地使用，不会上传服务器</p>
                    </div>
                    <div className="space-y-2">
                      <Label>钱包密码</Label>
                      <Input
                        type="password"
                        placeholder="请输入钱包密码"
                        value={importPassword}
                        onChange={(e) => setImportPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button className="w-full" onClick={handleImportLogin} disabled={isLoading || !mnemonic || !importPassword}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />处理中...</> : <><FileText className="mr-2 h-4 w-4" />登录</>}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            还没有账号？{' '}
            <Link href={activeTab === 'web3' ? '/register?tab=web3' : '/register'} className="text-primary hover:underline">
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
