import { PawPrint } from 'lucide-react';

const Loader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex flex-col items-center gap-3">
      <PawPrint className="h-8 w-8 text-primary animate-spin" />
      <span className="text-sm text-muted-foreground">Cargando videos...</span>
    </div>
  </div>
);

export default Loader;
