'use client';

import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  SidebarContent as Content,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LayoutDashboard, ShieldHalf } from 'lucide-react';

export function SidebarContent() {
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ShieldHalf className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-lg font-semibold text-primary">
            ThreatLens-X
          </h1>
        </div>
      </SidebarHeader>
      <Content className="p-4 pt-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive>
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Content>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">
              Jane Doe
            </span>
            <span className="text-xs text-muted-foreground">
              Security Analyst
            </span>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}
