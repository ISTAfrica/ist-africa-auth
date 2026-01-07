'use client';

import Image from 'next/image'; // 1. Import the Next.js Image component
import Link from 'next/link';   // 2. Import Link for navigation

// We no longer import the image file directly.
// import logo from "@/assets/iaa-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo = ({ className = "", showText = true }: LogoProps) => {
  return (
    // Wrap the logo in a Link to make it clickable
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      {/* 3. Use the <Image> component */}
      <Image
        src="/iaa-logo.png" // 4. The 'src' is a string relative to the 'public' folder
        alt="IAA Logo"
        width={40}  // 5. Provide a specific width (based on your h-10 class)
        height={40} // 6. Provide a specific height (based on your w-10 class)
        priority    // 7. Tell Next.js to load this important image faster
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary">IAA</span>
          <span className="text-xs text-muted-foreground">IST Africa Auth</span>
        </div>
      )}
    </Link>
  );
};

export default Logo;