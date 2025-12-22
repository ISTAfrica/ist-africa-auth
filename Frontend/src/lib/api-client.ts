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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = data.message || 'Something went wrong';

      // Handle authentication errors and token version mismatch
      if (response.status === 401 || error.toLowerCase().includes('token version mismatch')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        toast({
          title: 'Session Expired',
          description: error.toLowerCase().includes('token version mismatch')
            ? 'You have been logged out from all devices. Please login again.'
            : 'Your session has expired. Please login again.',
          variant: 'destructive',
        });

        if (response.status === 401 || error.toLowerCase().includes('token version mismatch')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          toast({
            title: 'Session Expired',
            description: 'You have been logged out. Please login again.',
            variant: 'destructive',
          });

          // throw new Error('UNAUTHORIZED');
        }

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
