import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo = ({ className = '', showText = true }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image src="/iaa-logo.png" alt="IAA Logo" width={40} height={40} />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary">IAA</span>
          <span className="text-xs text-muted-foreground">IST Africa Auth</span>
        </div>
      )}
    </div>
  );
};

export default Logo;