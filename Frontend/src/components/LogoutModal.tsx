'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutThisDevice, logoutAllDevices } from "@/services/authService";

interface LogoutModalProps {
  onClose: () => void;
}

const LogoutModal = ({ onClose }: any) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async (allDevices = false) => {
    setLoading(true);

    try {
      if (allDevices) {
        await logoutAllDevices();
      } else {
        await logoutThisDevice();
      }

      // Clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });

      onClose();
      router.push("/auth/login");
      router.refresh(); // Ensure the page updates to reflect logout
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Logout Options</h2>
        
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to log out?
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => handleLogout(false)}
            disabled={loading}
            className="w-full justify-center py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            {loading ? 'Logging out...' : 'Logout on This Device'}
          </Button>

          <Button
            onClick={() => handleLogout(true)}
            disabled={loading}
            className="w-full justify-center py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {loading ? 'Logging out...' : 'Logout on All Devices'}
          </Button>

          <Button
            onClick={onClose}
            disabled={loading}
            className="w-full justify-center py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
export default LogoutModal;