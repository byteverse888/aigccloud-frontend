import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserAgreementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">用户协议</h1>
        <p className="text-muted-foreground">
          最后更新日期：2024年1月1日
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>巴特星球用户服务协议</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <h3>一、总则</h3>
          <p>
            欢迎使用巴特星球平台服务。本协议是您与巴特星球平台之间关于使用平台服务所订立的协议。请您务必审慎阅读、充分理解各条款内容。
          </p>

          <h3>二、服务内容</h3>
          <p>
            巴特星球为用户提供AI内容创作服务，包括但不限于文生图、文生音乐、文生视频等AI创作功能，以及AIIP资产管理和交易服务。
          </p>

          <h3>三、用户账号</h3>
          <p>
            您需要注册账号才能使用本平台的完整服务。您应当保管好自己的账号和密码，并对账号下的所有行为负责。
          </p>

          <h3>四、用户行为规范</h3>
          <ul>
            <li>您不得利用本平台服务制作、上传、发布违反法律法规的内容</li>
            <li>您不得侵犯他人知识产权或其他合法权益</li>
            <li>您不得使用本平台服务进行任何违法活动</li>
          </ul>

          <h3>五、知识产权</h3>
          <p>
            您使用本平台服务创作的内容，知识产权归您所有。但您授权平台在服务范围内使用相关内容。
          </p>

          <h3>六、隐私保护</h3>
          <p>
            我们重视用户隐私保护，具体请参阅《隐私政策》。
          </p>

          <h3>七、免责声明</h3>
          <p>
            AI生成内容可能存在不确定性，平台不对AI生成内容的准确性、完整性作出任何保证。
          </p>

          <h3>八、协议修改</h3>
          <p>
            我们有权根据需要修改本协议条款。修改后的协议将在平台公布后生效。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
