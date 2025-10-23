import { AuthenticateUserDto, RegisterUserDto } from '@/types'; // We'll create this type

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    // Throw an error with the message from the backend
    throw new Error(data.message || 'Authentication failed');
  }

  return data; // Returns { accessToken, refreshToken }
};

// We can add the forgot password function here later
export const requestPasswordReset = async (email: string) => {
  // Simulate API call for now, replace with your actual endpoint
  // const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, ...);
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
    // The backend sends a message on failure (e.g., "User already exists")
    throw new Error(data.message || 'Registration failed');
  }

  return data; // Returns the newly created user object (without password)
};


