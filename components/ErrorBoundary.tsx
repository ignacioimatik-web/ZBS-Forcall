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
            <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 p-3 rounded-xl text-left break-all">
              {this.state.error?.message || 'Error desconocido'}
            </p>
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
