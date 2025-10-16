import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

const App = () => {
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

  return isAuthenticated ? <HomePage /> : <LoginPage />;
};

export default App;
