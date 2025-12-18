import { toast } from "@/hooks/use-toast";

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = data.message || 'Something went wrong';

      // Handle authentication errors and token version mismatch
      if (response.status === 401 || error.toLowerCase().includes('token version mismatch')) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Show appropriate message
        toast({
          title: 'Session Expired',
          description: error.toLowerCase().includes('token version mismatch')
            ? 'You have been logged out from all devices. Please login again.'
            : 'Your session has expired. Please login again.',
          variant: 'destructive',
        });

        // Redirect and return a never-resolving promise to prevent further execution
        window.location.href = '/auth/login';
        return new Promise(() => {}); // Never resolves, prevents further code execution
      }

      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      throw new Error(error);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
