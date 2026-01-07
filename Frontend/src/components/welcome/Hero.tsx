import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background opacity-50"></div>
      <div className="container mx-auto px-6 py-20 lg:py-32 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Lock className="h-4 w-4" />
            Trusted by organizations across Africa
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            Centralized Authentication
            <span className="text-primary"> Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            IST Africa Auth provides enterprise-grade authentication for all your internal applications. One login, unlimited possibilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/auth/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};