'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // <-- 1. Import Next.js routing hooks
import Link from 'next/link'; // <-- 2. Import Next.js Link component
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
} from '@/components/ui/sidebar'; // Assuming this component is Next.js compatible
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { cn } from '@/lib/utils'; // For conditional classes
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
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Keys', url: '/admin/keys', icon: Key },
  { title: 'Sessions', url: '/admin/sessions', icon: Activity },
  { title: 'Security', url: '/admin/security', icon: Settings },
  { title: 'Health', url: '/admin/health', icon: Heart },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname(); // <-- 3. Use usePathname() for the current URL
  const router = useRouter(); // <-- 4. Use useRouter() for navigation
  const collapsed = state === 'collapsed';
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

  return (
    <Sidebar className={cn('transition-all duration-300', collapsed ? 'w-16' : 'w-64')} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-center">
            {!collapsed && <Logo />}
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
                      {/* 6. Replace NavLink with Next.js Link */}
                      <Link
                        href={item.url}
                        className={cn(
                          'flex items-center gap-3',
                          isActive
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'hover:bg-muted'
                        )}
                      >
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

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter(); 

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('accessToken');
    if (!isAuthenticated) {
      router.push('/auth/login'); 
    }
  }, [router]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-6 bg-card sticky top-0 z-10">
            <SidebarTrigger className="mr-4">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
          </header>
          <div className="flex-1 p-6 bg-background overflow-auto">{children}</div>
        </main>
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;