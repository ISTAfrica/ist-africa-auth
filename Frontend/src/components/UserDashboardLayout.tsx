'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

// lucide-react icons
import { Home, User, Settings, Shield, LogOut } from "lucide-react";

// ===========================================
// SHADCN-LIKE BUTTON
// ===========================================
const Button = ({ children, onClick, disabled, className, variant }: any) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

// ===========================================
// SIDEBAR CONTEXT
// ===========================================
const SidebarContext = React.createContext({
  state: "expanded",
  toggle: () => {},
});

const useSidebar = () => React.useContext(SidebarContext);

const SidebarProvider = ({ children }: any) => (
  <SidebarContext.Provider value={{ state: "expanded", toggle: () => {} }}>
    {children}
  </SidebarContext.Provider>
);

const Sidebar = ({ children, className }: any) => (
  <div className={`flex flex-col flex-shrink-0 border-r bg-white ${className}`}>
    {children}
  </div>
);

const SidebarContent = ({ children }: any) => (
  <div className="flex flex-col flex-1 overflow-y-auto">{children}</div>
);

const SidebarGroup = ({ children }: any) => (
  <div className="mt-4 px-4">{children}</div>
);

const SidebarGroupLabel = ({ children }: any) => (
  <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
    {children}
  </div>
);

const SidebarGroupContent = ({ children }: any) => (
  <ul className="space-y-1">{children}</ul>
);

const SidebarMenu = ({ children }: any) => <nav>{children}</nav>;
const SidebarMenuItem = ({ children }: any) => <li>{children}</li>;
const SidebarMenuButton = ({ children }: any) => children;

const SidebarTrigger = () => (
  <button className="p-2 rounded-lg hover:bg-gray-100">☰</button>
);

// ===========================================
// LOGOUT MODAL
// ===========================================
const LogoutModal = ({ onClose }: any) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async (allDevices = false) => {
    setLoading(true);

    try {
      const endpoint = allDevices
        ? "/api/auth/logout-all"
        : "/api/auth/logout";

      await fetch(endpoint, { method: "POST", credentials: "include" });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      onClose();
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Logout Options</h2>

        <Button
          onClick={() => handleLogout(false)}
          disabled={loading}
          className="w-full justify-center py-3 mb-3 bg-primary text-white rounded-lg"
        >
          Logout on This Device
        </Button>

        <Button
          onClick={() => handleLogout(true)}
          disabled={loading}
          className="w-full justify-center py-3 mb-4 bg-red-600 text-white rounded-lg"
        >
          Logout on All Devices
        </Button>

        <Button
          onClick={onClose}
          className="w-full justify-center py-3 border border-gray-300 rounded-lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

// ===========================================
// NAVIGATION ITEMS
// ===========================================
const navigationItems = [
  { title: "Overview", url: "/user", icon: Home },
  { title: "Profile", url: "/user/profile", icon: User },
  { title: "Sessions", url: "/user/sessions", icon: Shield },
  { title: "Settings", url: "/user/settings", icon: Settings },
];

// ===========================================
// SIDEBAR COMPONENT
// ===========================================
function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent>
        {/* TOP SECTION */}
        <div className="p-4 border-b flex items-center justify-between">
  {!collapsed ? (
    <Logo showText={true} />
  ) : (
    <Image
      src="/iaa-logo.png"
      alt="IAA"
      width={32}
      height={32}
      className="mx-auto"
    />
  )}
</div>


        {/* NAVIGATION */}
        <SidebarGroup>
          <SidebarGroupLabel>User Portal</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(({ title, url, icon: Icon }) => (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton>
                    <Link
                      href={url}
                      className={`flex items-center p-2 rounded-lg ${
                        isActive(url)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-3">{title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* LOGOUT */}
        <div className="mt-auto p-4 border-t">
          <Button
            onClick={() => setShowLogoutModal(true)}
            className="w-full justify-start text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>

          {showLogoutModal && (
            <LogoutModal onClose={() => setShowLogoutModal(false)} />
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

// ===========================================
// MAIN USER DASHBOARD LAYOUT
// ===========================================
export default function UserDashboardLayout({ children }: any) {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token && pathname.startsWith("/user")) {
      router.push("/auth/login");
    }
  }, [pathname, router]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <DashboardSidebar />

        <main className="flex-1 overflow-x-hidden">
          <header className="h-14 border-b bg-white flex items-center px-6 shadow-sm">
            <h1 className="text-xl font-bold">
              {navigationItems.find((i) => pathname.startsWith(i.url))
                ?.title || "Dashboard Overview"}
            </h1>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
