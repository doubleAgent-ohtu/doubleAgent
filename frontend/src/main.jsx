import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import { useState, useEffect } from 'react';

const LoginPage = () => {
  const handleLogin = () => {
    // Ohjaa backend:n login-endpointiin
    window.location.href = '/api/login';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
        }}
      >
        <h1>Tervetuloa</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Kirjaudu sisään yliopistotunnuksillasi käyttääksesi chatbottia.
        </p>

        <button
          onClick={handleLogin}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '2rem',
          }}
        >
          Kirjaudu yliopistotunnuksilla
        </button>

        <HealthCheckButton />
      </div>
    </div>
  );
};

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

export const HealthCheckButton = () => {
  const [status, setStatus] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setStatus(data.status);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div>
      <button
        onClick={checkHealth}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Check Backend Health
      </button>
      {status && <p>Backend status: {status}</p>}
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainApp />
  </StrictMode>,
);
