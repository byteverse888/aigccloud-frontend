'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, UserMinus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { getUserFollowing, toggleFollow, getUserById } from '@/lib/parse-actions';
import toast from 'react-hot-toast';

interface FollowItem {
  objectId: string;
  followingId: string;
  followingUser?: {
    objectId: string;
    username: string;
    avatar?: string;
    bio?: string;
    level?: number;
  };
}

export default function FollowingPage() {
  const [followingList, setFollowingList] = useState<FollowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { user } = useAuthStore();

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await getUserFollowing(user.objectId);
    if (result.success) {
      setFollowingList(result.data as FollowItem[]);
      setTotal(result.total);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const handleUnfollow = async (followingId: string) => {
    if (!user) return;
    const result = await toggleFollow(user.objectId, followingId);
    if (result.success) {
      toast.success('已取消关注');
      fetchFollowing();
    }
  };
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/profile">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回用户中心
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              关注的作者
            </CardTitle>
            <CardDescription>共关注了 {total} 位创作者</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : followingList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无关注的作者</p>
                <Button className="mt-4" asChild>
                  <Link href="/market">发现优秀创作者</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {followingList.map((item) => (
                  <Card key={item.objectId}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={item.followingUser?.avatar} alt={item.followingUser?.username} />
                          <AvatarFallback>
                            {(item.followingUser?.username || '用户').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {item.followingUser?.username || '用户'}
                            </h3>
                            <Badge variant="secondary">
                              Lv.{item.followingUser?.level || 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.followingUser?.bio || '这个人很懒，还没有简介'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" asChild>
                            <Link href={`/creators/${item.followingId}`}>查看主页</Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleUnfollow(item.followingId)}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
