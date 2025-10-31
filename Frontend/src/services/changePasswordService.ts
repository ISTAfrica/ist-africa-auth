interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('Not authenticated. Please log in again.');
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/change-password`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to change password');
    }

    return result as ChangePasswordResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
    throw new Error('An unknown error occurred.');
  }
}
