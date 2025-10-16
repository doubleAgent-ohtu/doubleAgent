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
    <div className="flex flex-col items-center gap-2">
      <button onClick={checkHealth} className="btn btn-secondary">
        Check Backend Health
      </button>
      {status && (
        <p className="text-sm text-gray-400">
          Backend status:{' '}
          <span className={status === 'error' ? 'text-error' : 'text-success'}>{status}</span>
        </p>
      )}
    </div>
  );
};
