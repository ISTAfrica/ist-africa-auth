// src/app/page.tsx
import Logo from '@/components/auth/Logo';
import { Header } from '../components/welcome/Header';
import { Hero } from '../components/welcome/Hero';
import { Features } from '../components/welcome/Features';
import { Benefits } from '../components/welcome/Benefits';
import { CTA } from '../components/welcome/CTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <CTA />
      </main>
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">© 2025 IST Africa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}