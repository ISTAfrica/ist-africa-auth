"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserProfile } from "@/types";
import { getProfile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Shield, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileData = await getProfile();
        setUser(profileData);
      } catch (error) {
        console.error("Failed to fetch profile, redirecting...", error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [router]);

  // Update navigation items to point to the correct routes
  const navigationItems = [
    { title: "Overview", url: "/user", icon: Activity },
    { title: "Profile", url: "/user/profile", icon: Users },
    { title: "Sessions", url: "/user/sessions", icon: Shield },
  ];

  const stats = [
    {
      title: "Active Sessions",
      value: "3",
      description: "Across all devices",
      icon: Activity,
    },
    {
      title: "Account Age",
      value: user ? `${Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days` : "N/A",
      description: `Member since ${user ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}`,
      icon: Clock,
    },
    {
      title: "Security Level",
      value: "High",
      description: "2FA enabled",
      icon: Shield,
    },
    {
      title: "Email",
      value: user?.email ? "Verified" : "Not Verified",
      description: user?.email || "No email",
      icon: Users,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name?.split(" ")[0] || 'User'}!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your account activity
          </p>
        </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest account activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Profile updated", time: new Date().toLocaleDateString() },
                    { action: "Logged in from this device", time: "Today" },
                    { action: "Password changed", time: "1 week ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{activity.action}</span>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link
                    href="/user/profile"
                    className="block p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="font-medium text-sm">Update Profile</div>
                    <div className="text-xs text-muted-foreground">
                      Change your profile information
                    </div>
                  </Link>

                  <Link
                    href="/user/settings"
                    className="block p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="font-medium text-sm">Security Settings</div>
                    <div className="text-xs text-muted-foreground">
                      Manage your security preferences
                    </div>
                  </Link>

                  <Link
                    href="/user/sessions"
                    className="block p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <div className="font-medium text-sm">Active Sessions</div>
                    <div className="text-xs text-muted-foreground">
                      View and manage your sessions
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
  )
}
