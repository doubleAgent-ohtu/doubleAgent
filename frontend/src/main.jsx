import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import LoginPage from '../../components/login_page';

const MainApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tarkista onko käyttäjä kirjautunut URL-parametreista
    const checkAuthStatus = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isLoggedIn = urlParams.get('authenticated') === 'true';

        setIsAuthenticated(isLoggedIn);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Ladataan...</p>
      </div>
    );
  }

  return isAuthenticated ? <App /> : <LoginPage />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainApp />
  </StrictMode>,
);
