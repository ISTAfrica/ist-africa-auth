import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-background opacity-50"></div>
      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join thousands of users who trust IAA for their authentication needs.</p>
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href="/login">Sign In Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};