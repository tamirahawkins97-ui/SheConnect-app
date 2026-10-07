import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.jpg';

interface BrandProps {
  to: string;
  className?: string;
}

export default function Brand({ to, className = '' }: BrandProps) {
  return (
    <Link className={`brand-lockup ${className}`.trim()} to={to} aria-label="SheConnect">
      <span className="brand-mark" aria-hidden="true">
        <img src={Logo} alt="" />
      </span>
      <span>
        <span className="brand-wordmark">SheConnect</span>
        <span className="brand-tagline">Maternal Community</span>
      </span>
    </Link>
  );
}
