import { useState } from 'react';

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