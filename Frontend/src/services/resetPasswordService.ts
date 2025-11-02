const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ForgotPasswordRequest { email: string; }
interface ForgotPasswordResponse { message: string; }
interface ResetPasswordRequest { token: string; newPassword: string; }
interface ResetPasswordResponse { message: string; }

/**
 * 🔥 Send password reset email request
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  console.log('🔥 Calling forgotPassword API with email:', data.email);
  console.log('🌐 API_BASE_URL:', API_BASE_URL);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('📡 Response status:', response.status);
    console.log('✅ API Response:', result);

    if (!response.ok) throw new Error(result.message || 'Failed to send reset email');

    alert(result.message); // show success alert to user
    return result;
  } catch (error) {
    console.error('❌ API Error:', error);
    alert(error instanceof Error ? error.message : 'Error sending reset email');
    throw error;
  }
}

/**
 * 🔁 Reset password with token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  console.log('🔥 Calling resetPassword API with token:', data.token);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: data.token, newPassword: data.newPassword }),
    });

    const result = await response.json();
    console.log('📡 Response status:', response.status);
    console.log('✅ API Response:', result);

    if (!response.ok) throw new Error(result.message || 'Failed to reset password');

    alert(result.message); // show success alert to user
    return result;
  } catch (error) {
    console.error('❌ API Error:', error);
    alert(error instanceof Error ? error.message : 'Error resetting password');
    throw error;
  }
}

