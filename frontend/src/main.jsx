import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import { useState } from 'react';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <h1>Chatti pois käytöstä kunnes yliopistokirjautuminen on kunnossa.</h1>
    {/* <App /> */}
  </StrictMode>,
);

export const HealthCheckButton = () => {
  const [status, setStatus] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await fetch('http://double-agent-backend:8000/health');
      const data = await res.json();
      setStatus(data.status);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div>
      <button onClick={checkHealth}>Check Backend Health</button>
      {status && <p>Backend status: {status}</p>}
    </div>
  );
};
