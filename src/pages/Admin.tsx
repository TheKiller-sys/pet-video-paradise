import { useState, useMemo } from 'react';
import { mockVideos, Video, CATEGORIAS } from '@/lib/mockData';
import { Trash2, Lock, BarChart3, Film, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ADMIN_PASS = 'admin123';

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState<Video[]>(mockVideos);

  const stats = useMemo(() => ({
    total: videos.length,
    youtube: videos.filter(v => v.fuente === 'youtube').length,
    reddit: videos.filter(v => v.fuente === 'reddit').length,
    porCategoria: CATEGORIAS.slice(1).map(c => ({
      ...c,
      count: videos.filter(v => v.categoria === c.slug).length,
    })),
  }), [videos]);

  const handleDelete = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    toast.success('Video eliminado');
  };

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <div className="rounded-2xl bg-card p-8 shadow-card text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-card-foreground mb-1">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground mb-6">Ingresa la contraseña para continuar</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASS) {
                setAuthenticated(true);
              } else {
                toast.error('Contraseña incorrecta');
              }
            }}
            className="flex gap-2"
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="flex-1"
            />
            <Button type="submit">Entrar</Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        Panel de Administración
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium">Total Videos</p>
          <p className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" /> {stats.total}
          </p>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium">YouTube</p>
          <p className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" /> {stats.youtube}
          </p>
        </div>
        {stats.porCategoria.slice(0, 2).map(c => (
          <div key={c.slug} className="rounded-xl bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
            <p className="text-2xl font-bold text-card-foreground">{c.emoji} {c.count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Fuente</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Categoría</th>
              <th className="px-4 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {videos.slice(0, 30).map(v => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <td className="px-4 py-3 text-card-foreground font-medium line-clamp-1 max-w-xs">{v.titulo}</td>
                <td className="px-4 py-3 hidden sm:table-cell capitalize text-muted-foreground">{v.fuente}</td>
                <td className="px-4 py-3 hidden md:table-cell capitalize text-muted-foreground">{v.categoria}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Admin;
