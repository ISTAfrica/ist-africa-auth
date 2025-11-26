"use client";

import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock /> Change Password
        </CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}
