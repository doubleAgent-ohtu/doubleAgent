import React from 'react';

const DownloadChatButton = ({ threadId = 'default', label = 'Lataa .txt' }) => {
  
  const handleDownload = async () => {
    try {
      const API_URL = 'http://localhost:8000'; 
      
      const response = await fetch(`${API_URL}/download-chat/${threadId}`, {
        method: 'GET',
        credentials: 'include', 
      });

      if (!response.ok) {
        throw new Error('Lataus epäonnistui');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      a.download = `keskustelu_${threadId}.txt`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Virhe ladattaessa keskustelua:', error);
      alert('Keskustelun lataaminen epäonnistui. Varmista että olet kirjautunut sisään.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="btn btn-primary btn-sm gap-2"
      title="Lataa keskustelu tekstitiedostona"
      aria-label={`Lataa keskustelu ${threadId}`}
    >
      {/* Lataus-ikoni (korjattu, pystysuora ja keskittynyt) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4 self-center rotate-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v11.25M12 14.25l4.5-4.5M12 14.25l-4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {label}
    </button>
  );
};

export default DownloadChatButton;