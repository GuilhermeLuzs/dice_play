import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const imgSizes = {
    sm: '32px',
    md: '50px',
    lg: '70px'
  };

  return (
    <Link to="/" className="flex items-center gap-2 group justify-center">
      {showText ? (
        <span 
          className={`font-display ${textSizes[size]} tracking-wider flex items-center`}
          style={{ fontFamily: "Holtwood One SC, serif", fontWeight: 400 }}
        >
          <span className="text-foreground">DICE</span>
          <img src="/assets/logo_dp.png" style={{ width: imgSizes[size] }} alt="Dice Play Logo" />
          <span className="text-foreground">PLAY</span>
        </span>
      ) : (
        <img 
          src="/assets/logo_dp.png" 
          style={{ width: imgSizes[size] }} 
          alt="Dice Play Logo" 
          className="transition-transform group-hover:scale-110"
        />
      )}
    </Link>
  );
}
