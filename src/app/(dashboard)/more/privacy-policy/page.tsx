import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">隐私政策</h1>
        <p className="text-muted-foreground">
          最后更新日期：2024年1月1日
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>巴特星球隐私政策</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <h3>一、信息收集</h3>
          <p>
            我们收集的信息类型包括：
          </p>
          <ul>
            <li>账号信息：用户名、邮箱、手机号等</li>
            <li>设备信息：设备型号、操作系统、浏览器类型等</li>
            <li>使用信息：您使用服务的方式和创作的内容</li>
          </ul>

          <h3>二、信息使用</h3>
          <p>
            我们使用收集的信息用于：
          </p>
          <ul>
            <li>提供、维护和改进我们的服务</li>
            <li>个性化您的体验</li>
            <li>发送服务通知和营销信息</li>
            <li>保护平台和用户的安全</li>
          </ul>

          <h3>三、信息共享</h3>
          <p>
            我们不会将您的个人信息出售给第三方。我们可能在以下情况下共享信息：
          </p>
          <ul>
            <li>获得您的同意</li>
            <li>法律要求</li>
            <li>保护平台和用户权益</li>
          </ul>

          <h3>四、信息安全</h3>
          <p>
            我们采取技术和组织措施来保护您的个人信息安全，包括加密、访问控制等。
          </p>

          <h3>五、Cookie使用</h3>
          <p>
            我们使用Cookie和类似技术来提供和改进服务。您可以通过浏览器设置管理Cookie。
          </p>

          <h3>六、您的权利</h3>
          <p>
            您有权访问、更正、删除您的个人信息，以及撤回同意、注销账号等。
          </p>

          <h3>七、联系我们</h3>
          <p>
            如果您对本隐私政策有任何疑问，请联系我们的客服团队。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
