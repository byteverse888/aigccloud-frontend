import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: '如何开始使用AI创作功能？',
    answer: '注册并登录后，进入"AI创作"模块，选择您想要的创作类型（如文生图、文生音乐等），输入提示词即可开始创作。',
  },
  {
    question: '创作的内容版权归谁所有？',
    answer: '您使用本平台创作的AI生成内容，版权归您所有。您可以自由使用、分享或出售您的创作。',
  },
  {
    question: '如何将我的创作上架到商城？',
    answer: '在"AIIP资产"中上传您的创作，设置价格和描述后提交审核。审核通过后即可在商城展示销售。',
  },
  {
    question: '金币如何获取和使用？',
    answer: '金币可通过充值、每日登录、邀请好友等方式获取。金币可用于购买AI创作服务和商城商品。',
  },
  {
    question: '如何成为会员？',
    answer: '点击"充值计费"选择适合您的会员套餐进行购买。会员可享受更多权益和优惠。',
  },
  {
    question: '遇到问题如何联系客服？',
    answer: '您可以通过平台内的消息中心联系客服，或发送邮件至客服邮箱。',
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">常见问题</h1>
        <p className="text-muted-foreground">
          查看常见问题解答
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>常见问题解答</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
