import {
  AuthenticateUserDto,
  RegisterUserDto,
  VerifyOtpDto,
  ResendOtpDto,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No access token found.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ================== AUTH FUNCTIONS ==================

export const authenticateUser = async (credentials: AuthenticateUserDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    // Crucial for sending and receiving the HTTP-only refresh token cookie
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Authentication failed");

  // The backend sets the refresh token as an HTTP-only cookie.
  // We only store the Access Token, which is returned in the body.
  if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);

  return data;
};

export const registerUser = async (userData: RegisterUserDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Registration failed");

  return data;
};

export const verifyOtp = async (payload: VerifyOtpDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // Crucial for sending and receiving the HTTP-only refresh token cookie
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "OTP verification failed");

  // The backend sets the refresh token as an HTTP-only cookie.
  // We only store the Access Token, which is returned in the body.
  if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);

  return data;
};

export const resendOtp = async (payload: ResendOtpDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to resend OTP");

  return data;
};

// ================== USER PROFILE FUNCTIONS ==================

export const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: 'include', 
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

export const updateProfile = async (data: { name: string }) => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token found");

  const response = await fetch(`${API_BASE_URL}/api/user/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to upload avatar' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

// ================== PASSWORD RESET ==================

export const requestPasswordReset = async (email: string) => {
  console.log(`Password reset requested for ${email}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { message: "Password reset link has been sent." };
};

// ================== LOGOUT FUNCTIONS ==================

export const logoutThisDevice = async () => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.warn('No access token found, may already be logged out');
      return true; // If already logged out, consider it a success
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // Clear tokens regardless of the response status
    localStorage.removeItem('accessToken');
    
    // Clear the refresh token cookie
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Logout API warning:', errorData.message || 'Unknown error during logout');
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, clear local storage to ensure logout
    localStorage.removeItem('accessToken');
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    throw error;
  }
};

export const logoutAllDevices = async () => {
  if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');

  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) throw new Error("Missing access token for logout all.");

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout-all`, {
      method: 'POST',
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to logout from all devices');
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    
    return true;
  } catch (error) {
    console.error('Logout all error:', error);
    throw error;
  }
};