import DashboardSidebar from "@/components/UserDashboardLayout";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <DashboardSidebar>{children}</DashboardSidebar>;
}
