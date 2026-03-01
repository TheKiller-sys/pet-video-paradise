import { Link } from 'react-router-dom';
import { PawPrint, Shield } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-border bg-card py-8 mt-12">
    <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <PawPrint className="h-4 w-4" />
        <span className="text-sm">© 2026 ViralMascotas — Los mejores videos de mascotas</span>
      </div>
      <Link
        to="/admin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <Shield className="h-3.5 w-3.5" />
        Admin
      </Link>
    </div>
  </footer>
);

export default Footer;
