import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || 'Error desconocido';
      const errStack = this.state.error?.stack || '';
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
              <span className="material-symbols-outlined text-4xl text-red-600">error_outline</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Algo salió mal</h2>
            <p className="text-sm text-gray-500 mb-4">
              Se produjo un error inesperado. Intenta recargar la página.
            </p>
            <div className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 p-3 rounded-xl text-left break-all max-h-40 overflow-y-auto">
              {errMsg}
              {errStack && <pre className="mt-2 text-[10px] text-gray-300 whitespace-pre-wrap">{errStack}</pre>}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-forcall-600 text-white rounded-xl font-bold text-sm hover:bg-forcall-700 transition-colors shadow-lg"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      event.preventDefault();
      const msg = event.error?.message || event.message || 'Error desconocido';
      console.error('Error global capturado:', event.error || event);
      setError(msg);
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const msg = event.reason?.message || event.reason || 'Promesa rechazada';
      console.error('Promesa rechazada global capturada:', event.reason);
      setError(String(msg));
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
            <span className="material-symbols-outlined text-4xl text-red-600">error_outline</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Error en la aplicación</h2>
          <p className="text-sm text-gray-500 mb-4">
            Se detectó un error no controlado. Revisa la consola del navegador (F12) para más detalles.
          </p>
          <div className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 p-3 rounded-xl text-left break-all max-h-40 overflow-y-auto">
            {error}
          </div>
          <button
            onClick={() => { setError(null); window.location.reload(); }}
            className="px-6 py-3 bg-forcall-600 text-white rounded-xl font-bold text-sm hover:bg-forcall-700 transition-colors shadow-lg"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
