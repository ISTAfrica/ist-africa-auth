import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');
    const redirectAfterLogin = searchParams.get('redirect_after_login') || '/dashboard';

    if (error) {
      const errorMessage = errorDescription || 'Authentication failed';
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=${encodeURIComponent(errorMessage)}`
      );
    }

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=${encodeURIComponent('Missing authentication tokens')}`
      );
    }

    const params = new URLSearchParams({
      access_token: accessToken,
      refresh_token: refreshToken,
      ...(state && { state })
    });

    if (redirectAfterLogin) {
      params.set('redirect_after_login', redirectAfterLogin);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/linkedin/callback?${params.toString()}`
    );

  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
}