"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, User, Settings, Shield, LogOut } from "lucide-react";
import Logo from "./Logo";
import { LogoutDialog } from "@/components/auth/LogoutDialog";
import { logout } from "@/services/authService";
import { toast } from "sonner";

const navigationItems = [
  { title: "Overview", url: "/user", icon: Home },
  { title: "Profile", url: "/user/profile", icon: User },
  { title: "Sessions", url: "/user/sessions", icon: Shield },
  { title: "Settings", url: "/user/settings", icon: Settings },
];

function DashboardSidebar() {
  const { state } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const collapsed = state === "collapsed";
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogout = async (type: "single" | "all") => {
    setIsLoggingOut(true);
    try {
      await logout(type);
      toast.success(
        type === "single"
          ? "Logged out from this device successfully"
          : "Logged out from all devices successfully"
      );
      setLogoutDialogOpen(false);
      router.push("/auth/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Logout failed"
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getNavClass = (url: string) => {
    const isActive = pathname === url || 
                    (url !== '/' && pathname.startsWith(url) && pathname.charAt(url.length) === '/') ||
                    (url === '/user' && pathname === '/user');
    return isActive
      ? "bg-primary/10 text-primary hover:bg-primary/20"
      : "hover:bg-muted";
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-center">
            {!collapsed ? (
              <Logo />
            ) : (
              <div className="h-8 w-8 flex items-center justify-center">
                <Home className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>User Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url || 
                              (item.url !== '/' && pathname.startsWith(item.url) && pathname.charAt(item.url.length) === '/');
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogoutClick}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarContent>
      <LogoutDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onLogout={handleLogout}
        isLoading={isLoggingOut}
      />
    </Sidebar>
  );
}

export function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1">
          <header className="h-14 border-b bg-card flex items-center px-6 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">
              {navigationItems.find(item => 
                pathname === item.url || 
                (item.url !== '/' && pathname.startsWith(item.url))
              )?.title || 'Dashboard'}
            </h1>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
