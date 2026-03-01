import VideoGrid from '@/components/VideoGrid';

const Index = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          🐾 Videos virales de mascotas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Los mejores momentos de perritos, gatitos y más, actualizados cada día
        </p>
      </div>
      <VideoGrid />
    </main>
  );
};

export default Index;
