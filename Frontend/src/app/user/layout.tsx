import {UserDashboardLayout} from "@/components/UserDashboardLayout";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
