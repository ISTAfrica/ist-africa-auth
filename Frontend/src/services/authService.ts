import {
  AuthenticateUserDto,
  RegisterUserDto,
  VerifyOtpDto,
  ResendOtpDto,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Get headers with access token
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
    credentials: 'include', // Ensure cookies are sent if any auth relies on them
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

/**
 * Logs out the user from the current session.
 * The refresh token is automatically sent via the HTTP-only cookie.
 * The backend clears the cookie upon successful logout.
 */
export const logoutThisDevice = async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) throw new Error("Missing access token. Already logged out?");

  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    // This ensures the refresh token cookie is sent with the request
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    // No refresh token needed in the body, as it's in the cookie
    body: JSON.stringify({}),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Logout failed');

  // Clean up client-side storage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken'); // Remove in case it was incorrectly stored

  return data;
};

/**
 * Logs out the user from ALL devices by triggering tokenVersion increment on the backend.
 * The backend clears the refresh token cookie on the current device as part of the process.
 */
export async function logoutAllDevices() {
  if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');

  const url = `${API_BASE_URL}/api/auth/logout-all`;
  console.log('logoutAllDevices -> calling', url);

  const res = await fetch(url, {
    method: 'POST',
    // This ensures the refresh token cookie is sent (so the backend can clear it)
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`
    },
    body: JSON.stringify({})
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Logout failed');
    throw new Error(err || 'Failed to logout on all devices');
  }

  // Clean up client-side storage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken'); // Remove in case it was incorrectly stored
  return true;
}