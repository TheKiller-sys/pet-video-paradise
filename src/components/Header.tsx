import { Link, useLocation } from 'react-router-dom';
import { CATEGORIAS } from '@/lib/videoApi';
import { PawPrint, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentSlug = location.pathname.startsWith('/categoria/')
    ? location.pathname.split('/').pop()
    : location.pathname === '/' ? 'todos' : '';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Viral<span className="text-primary">Mascotas</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {CATEGORIAS.map((cat) => (
              <Link
                key={cat.slug}
                to={cat.slug === 'todos' ? '/' : `/categoria/${cat.slug}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  currentSlug === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </Link>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="flex flex-wrap gap-2 pb-4 md:hidden animate-fade-in">
            {CATEGORIAS.map((cat) => (
              <Link
                key={cat.slug}
                to={cat.slug === 'todos' ? '/' : `/categoria/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  currentSlug === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
