import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './shared/AppContext';
import App from './App';
import './index.css';

// כשהאתר מתפרסם בכתובת משנה (כמו /reut1/ ב-GitHub Pages),
// Vite מספק את הבסיס דרך BASE_URL ואנחנו מעבירים אותו לראוטר.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
