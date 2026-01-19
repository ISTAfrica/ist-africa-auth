const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ist-africa-auth-1.onrender.com';

interface ForgotPasswordRequest { email: string; }
interface ForgotPasswordResponse { success: boolean; message: string; }
interface ResetPasswordRequest { token: string; newPassword: string; }
interface ResetPasswordResponse { success: boolean; message: string; }

export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const fullUrl = `${API_BASE_URL}/auth/forgot-password`;

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get('content-type');
    let result: ForgotPasswordResponse;

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      return { success: false, message: text || 'Server returned non-JSON response' };
    }

    if (!response.ok) {
      return { success: false, message: result.message || 'Failed to send reset email' };
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error('Forgot Password Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error sending reset email';
    return { success: false, message: errorMessage };
  }
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const fullUrl = `${API_BASE_URL}/auth/reset-password`;

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: data.token, newPassword: data.newPassword }),
    });

    const contentType = response.headers.get('content-type');
    let result: ResetPasswordResponse;

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      return { success: false, message: text || 'Server returned non-JSON response' };
    }

    if (!response.ok) {
      return { success: false, message: result.message || 'Failed to reset password' };
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error('Reset Password Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error resetting password';
    return { success: false, message: errorMessage };
  }
}


