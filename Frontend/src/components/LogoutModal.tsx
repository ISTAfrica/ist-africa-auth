'use client';

import React, { useState } from "react";
// NOTE: Replaced Next.js useRouter with simple window.location.href for environment compatibility.

interface LogoutModalProps {
  onClose: () => void;
}

// --- Simplified/Inlined Auth Service Functions to ensure self-contained component ---
// In a full Next.js project, you should continue importing from "@/services/authService"
const simulateLogoutSuccess = () => {
  return new Promise((resolve) => setTimeout(resolve, 500));
};

const logoutThisDevice = async () => {
  // Simulate API call
  await simulateLogoutSuccess();
  // Client-side cleanup
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const logoutAllDevices = async () => {
  // Simulate API call to hit /api/auth/logout-all endpoint
  await simulateLogoutSuccess();
  // Client-side cleanup
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
// ---------------------------------------------------------------------------------


const LogoutModal: React.FC<LogoutModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async (allDevices: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      if (allDevices) {
        await logoutAllDevices();
      } else {
        await logoutThisDevice();
      }

      // Close modal
      onClose();

      // Redirect to login page upon success
      window.location.href = "/auth/login";

    } catch (err: any) {
      setError(err.message || "Logout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-4 text-center">Logout Options</h2>
        <p className="mb-6 text-gray-600 text-center">Choose how you want to log out:</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm transition-opacity duration-300">
            {error}
          </div>
        )}

        <button
          onClick={() => handleLogout(false)}
          disabled={loading}
          className="w-full py-3 mb-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          {loading && !error ? "Processing..." : "Logout on This Device"}
        </button>

        <button
          onClick={() => handleLogout(true)}
          disabled={loading}
          className="w-full py-3 mb-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          {loading && !error ? "Processing..." : "Logout on All Devices"}
        </button>

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-70 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LogoutModal;