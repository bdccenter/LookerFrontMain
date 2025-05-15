// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRoutes from './components/AppRoutes';
import './index.css';
import './DataService';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>
);