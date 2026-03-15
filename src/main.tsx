import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <HashRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HashRouter>
    </LanguageProvider>
  </StrictMode>,
);
