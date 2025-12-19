import { useState, useEffect } from 'react';
import axios from 'axios';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { BotConfigProvider } from './contexts/BotConfigContext';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await axios.get('/api/me');
        // If line above doesn't throw, user is authenticated
        setIsAuthenticated(true);
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

  // Wrap HomePage with BotConfigProvider to provide context, but not LoginPage
  return isAuthenticated ? (
    <BotConfigProvider>
      <HomePage />
    </BotConfigProvider>
  ) : (
    <LoginPage />
  );
};

export default App;
