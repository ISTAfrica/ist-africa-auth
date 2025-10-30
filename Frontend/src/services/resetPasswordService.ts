const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL|| 'http://localhost:5000';

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  message: string;
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to send reset email');
  }

  return result;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/resetPassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: data.token,
      newPassword: data.newPassword,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to reset password');
  }

  return result;
}