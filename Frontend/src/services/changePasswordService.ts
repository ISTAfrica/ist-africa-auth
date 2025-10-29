
interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
  }
  
  interface ChangePasswordResponse {
    message: string;
  }
  
  export const changePassword = async (
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> => {
    const accessToken = localStorage.getItem('accessToken');
  
    if (!accessToken) {
      throw new Error('Not authenticated. Please log in again.');
    }
  
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
  
    return response.json();
  };