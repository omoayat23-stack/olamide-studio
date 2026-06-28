import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and ignore benign Vite HMR / WebSocket connection rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason && 
      (reason.message?.includes('WebSocket closed without opened') || 
       reason.message?.includes('failed to connect to websocket') ||
       String(reason).includes('WebSocket closed without opened'))
    ) {
      event.preventDefault(); // Prevent standard error propagation
      console.log('[Vite HMR] Safely suppressed expected WebSocket connection error.');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
