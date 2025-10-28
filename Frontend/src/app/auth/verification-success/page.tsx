export default function VerificationSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <div className="max-w-sm w-full text-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="mx-auto h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your email has been successfully verified. You can now sign in.
          </p>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_APP_BASE_URL ? `${process.env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, '')}/auth/login` : '/auth/login'}
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
        >
          Go to sign in
        </a>
      </div>
    </main>
  );
}


