import { useState, useEffect } from 'react';
import { Video } from '@/lib/videoApi';
import { Trash2, Lock, BarChart3, Film, Youtube, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState({ youtube: 0, reddit: 0, perros: 0, gatos: 0 });
  const [loading, setLoading] = useState(false);
  const [storedPassword, setStoredPassword] = useState('');

  const loadAdmin = async (pwd: string) => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-videos`,
        {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'x-admin-password': pwd,
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Contraseña incorrecta');
          setAuthenticated(false);
          return;
        }
        throw new Error('Error al cargar');
      }
      const data = await res.json();
      setVideos(data.videos || []);
      setStats(data.stats || { youtube: 0, reddit: 0, perros: 0, gatos: 0 });
      setAuthenticated(true);
    } catch (e: any) {
      toast.error(e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-videos?id=${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'x-admin-password': storedPassword,
          },
        }
      );
      if (!res.ok) throw new Error('Error al eliminar');
      setVideos(prev => prev.filter(v => v.id !== id));
      toast.success('Video eliminado');
    } catch {
      toast.error('Error al eliminar video');
    }
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
              setStoredPassword(password);
              loadAdmin(password);
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
            <Button type="submit" disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
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
            <Film className="h-5 w-5 text-primary" /> {videos.length}
          </p>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium">YouTube</p>
          <p className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Youtube className="h-5 w-5 text-destructive" /> {stats.youtube}
          </p>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium">Perros</p>
          <p className="text-2xl font-bold text-card-foreground">🐕 {stats.perros}</p>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium">Gatos</p>
          <p className="text-2xl font-bold text-card-foreground">🐱 {stats.gatos}</p>
        </div>
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
            {videos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  No hay videos. Ejecuta la extracción automática primero.
                </td>
              </tr>
            ) : (
              videos.map(v => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Admin;
