import { useState, useEffect } from 'react';
import axios from 'axios';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/api/me');
        // If response is 200 OK, we are logged in.
        setIsAuthenticated(true);
      } catch (error) {
        // If response is 401 Unauthorized or other error, we are not logged in.
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
