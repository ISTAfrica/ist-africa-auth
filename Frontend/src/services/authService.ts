import { AuthenticateUserDto, RegisterUserDto, VerifyOtpDto, ResendOtpDto } from '@/types'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No access token found.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};






export const authenticateUser = async (credentials: AuthenticateUserDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
};

// services/authService.ts

export const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    // Try to get a more specific error message from the API response body
    try {
      const errorData = await response.json();
      // Throw an error with the backend's message
      throw new Error(errorData.message || 'Failed to fetch profile');
    } catch (e) {
      // If the response isn't JSON or another error occurs, throw the generic message
      throw new Error('Failed to fetch profile');
    }
  }

  return response.json();
};

export const requestPasswordReset = async (email: string) => {
  console.log(`Password reset requested for ${email}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { message: 'Password reset link has been sent.' };
};

export const registerUser = async (userData: RegisterUserDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    
    throw new Error(data.message || 'Registration failed');
  }

  return data; 
};


export const verifyOtp = async (payload: VerifyOtpDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }
  return data;
};

export const resendOtp = async (payload: ResendOtpDto) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to resend OTP');
  }
  return data;
};