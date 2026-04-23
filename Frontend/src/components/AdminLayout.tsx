'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Key,
  Activity,
  Shield,
  Heart,
  Settings,
  LogOut,
  Menu,
  Building2,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { Toaster } from './ui/sonner';
import { LogoutDialog } from '@/components/auth/LogoutDialog';
import { logout } from '@/services/authService';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Clients', url: '/admin/clients', icon: Shield },
  { title: 'Companies', url: '/admin/companies', icon: Building2 },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Keys', url: '/admin/keys', icon: Key },
  { title: 'Sessions', url: '/admin/sessions', icon: Activity },
  { title: 'Security', url: '/admin/security', icon: Settings },
  { title: 'Health', url: '/admin/health', icon: Heart },
];

function AdminSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      router.push("/auth/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-center">
            <Logo />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        onClick={() => { if (isMobile) setOpenMobile(false); }}
                        className={cn(
                          'flex items-center gap-3',
                          isActive
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
            onClick={() => setLogoutDialogOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Logout</span>
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

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = storage.get('accessToken');
      if (!token) {
        router.replace('/auth/login');
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = storage.get('accessToken');
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/session`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          const { refreshAccessToken } = await import('@/services/authService');
          const newToken = await refreshAccessToken();
          if (!newToken) {
            router.replace('/auth/login');
          }
        }
      } catch {
        // Silently ignore network errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 sm:px-6 bg-card sticky top-0 z-10">
            <SidebarTrigger className="mr-3">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">Admin Dashboard</h1>
          </header>
          <div className="flex-1 p-3 sm:p-6 bg-background overflow-auto">{children}</div>
        </main>
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
