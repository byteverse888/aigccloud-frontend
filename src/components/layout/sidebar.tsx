'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  Sparkles,
  Package,
  ShoppingBag,
  Gift,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Image,
  Music,
  Video,
  Mic,
  Bot,
  Palette,
  Workflow,
  ListTodo,
} from 'lucide-react';

const mainNavItems = [
  { href: '/', icon: Home, labelKey: 'nav.home' },
  {
    href: '/ai-creator',
    icon: Sparkles,
    labelKey: 'nav.aiCreator',
    children: [
      { href: '/ai-creator/text-to-image', icon: Image, labelKey: 'aiCreator.textToImage' },
      { href: '/ai-creator/text-to-speech', icon: Mic, labelKey: 'aiCreator.textToSpeech' },
      { href: '/ai-creator/text-to-music', icon: Music, labelKey: 'aiCreator.textToMusic' },
      { href: '/ai-creator/text-to-video', icon: Video, labelKey: 'aiCreator.textToVideo' },
      { href: '/ai-creator/digital-human', icon: Bot, labelKey: 'aiCreator.digitalHuman' },
      { href: '/ai-creator/webui', icon: Palette, labelKey: 'aiCreator.webui' },
      { href: '/ai-creator/comfyui', icon: Workflow, labelKey: 'aiCreator.comfyui' },
    ],
  },
  { href: '/tasks', icon: ListTodo, labelKey: 'nav.aiTasks' },
  { href: '/assets', icon: Package, labelKey: 'nav.aiAssets' },
  { href: '/market', icon: ShoppingBag, labelKey: 'nav.aiMarket' },
  { href: '/invite', icon: Gift, labelKey: 'nav.invite' },
  { href: '/more', icon: MoreHorizontal, labelKey: 'nav.more' },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo区域 */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">巴特星球</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* 导航区域 */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button
                          variant={active ? 'secondary' : 'ghost'}
                          size="icon"
                          className="w-full"
                        >
                          <Icon className="h-5 w-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {t(item.labelKey)}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={active ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-3"
                    >
                      <Icon className="h-5 w-5" />
                      {t(item.labelKey)}
                    </Button>
                  </Link>
                  {item.children && active && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link key={child.href} href={child.href}>
                            <Button
                              variant={childActive ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full justify-start gap-2"
                            >
                              <ChildIcon className="h-4 w-4" />
                              {t(child.labelKey)}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* 折叠按钮 */}
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
