import { useParams } from 'react-router-dom';
import VideoGrid from '@/components/VideoGrid';
import { CATEGORIAS } from '@/lib/mockData';

const Categoria = () => {
  const { slug } = useParams<{ slug: string }>();
  const cat = CATEGORIAS.find((c) => c.slug === slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          {cat?.emoji} {cat?.label ?? 'Categoría'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Videos de {cat?.label?.toLowerCase() ?? slug} más populares
        </p>
      </div>
      <VideoGrid categoria={slug} />
    </main>
  );
};

export default Categoria;
