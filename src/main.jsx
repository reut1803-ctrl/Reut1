import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './shared/AppContext';
import App from './App';
import './index.css';

// HashRouter (ניתוב מבוסס #) עובד בכל מצב: גם כשפותחים את האתר כקובץ
// מקומי בלחיצה כפולה, וגם כשהוא מתפרסם באינטרנט בכתובת משנה — בלי הגדרות.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </React.StrictMode>
);
