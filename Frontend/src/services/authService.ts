import {
  AuthenticateUserDto,
  RegisterUserDto,
  VerifyOtpDto,
  ResendOtpDto,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found. Please log in.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Helper function to extract tokens from URL and store them
export const extractAndStoreTokensFromURL = () => {
  if (typeof window === 'undefined') return false;
  
  const params = new URLSearchParams(window.location.search);
  
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const role = params.get('role');
  const userId = params.get('userId');
  const name = params.get('name');
  const email = params.get('email');
  
  if (accessToken && refreshToken) {
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Store user data
    const user = {
      id: userId,
      name: name,
      email: email,
      role: role,
    };
    localStorage.setItem('user', JSON.stringify(user));
    
    // Clean URL (remove sensitive data)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log('✅ Tokens stored successfully! User role:', role);
    return true;
  }
  
  return false;
};

export const authenticateUser = async (credentials: AuthenticateUserDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  return data;
};

export const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    } catch (e) {
      throw new Error('Failed to fetch profile');
    }
  }

  return response.json();
};

export const requestPasswordReset = async (email: string) => {
  console.log(`Password reset requested for ${email}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { message: "Password reset link has been sent." };
};

export const registerUser = async (userData: RegisterUserDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
};

export const verifyOtp = async (payload: VerifyOtpDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "OTP verification failed");
  }
  return data;
};

export const resendOtp = async (payload: ResendOtpDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to resend OTP");
  }
  return data;
};

export const updateProfile = async (data: { name: string }) => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'PATCH', 
    headers: getAuthHeaders(), 
    body: JSON.stringify(data), 
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/user/me/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to upload avatar' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

export const loginWithLinkedIn = async () => {
  try {
    const redirectAfterLogin = window.location.pathname;
    localStorage.setItem('redirectAfterLogin', redirectAfterLogin);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/linkedin/url`);
    const { url } = await response.json();
    
    if (!url) {
      throw new Error('Could not get LinkedIn authorization URL');
    }
    
    window.location.href = url;
  } catch (error) {
    console.error('Error in loginWithLinkedIn:', error);
    throw error;
  }
};

export const handleLinkedInCallback = async (code: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/linkedin/callback?code=${code}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to authenticate with LinkedIn');
    }

    const { accessToken, refreshToken, user } = await response.json();

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return { accessToken, refreshToken, user };
    }

    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error in handleLinkedInCallback:', error);
    throw error;
  }
};