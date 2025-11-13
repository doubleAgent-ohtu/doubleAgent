import { useState } from 'react';
import axios from 'axios';

export const HealthCheckButton = () => {
  const [status, setStatus] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await axios.get('/api/health');
      setStatus(res.data.status);
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
        <p className="text-sm text-base-content/70">
          Backend status:{' '}
          <span className={status === 'error' ? 'text-error' : 'text-success'}>{status}</span>
        </p>
      )}
    </div>
  );
};
