import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary, GlobalErrorHandler } from './components/ErrorBoundary';
import { SpeedInsights } from '@vercel/speed-insights/react';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorHandler>
      <ErrorBoundary>
        <App />
        <SpeedInsights />
      </ErrorBoundary>
    </GlobalErrorHandler>
  </React.StrictMode>
);