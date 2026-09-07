import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out known benign React 18 library deprecation notices (e.g., Recharts defaultProps and ResponsiveContainer initial render zero-width warnings)
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('defaultProps will be removed') ||
    msg.includes('Support for defaultProps will be removed') ||
    msg.includes('width(0) and height(0) of chart should be greater than 0') ||
    msg.includes('ResponsiveContainer')
  ) {
    return;
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('defaultProps will be removed') ||
    msg.includes('Support for defaultProps will be removed') ||
    msg.includes('width(0) and height(0) of chart should be greater than 0') ||
    msg.includes('ResponsiveContainer')
  ) {
    return;
  }
  originalError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
