import React from 'react';

const DownloadChatButton = ({ threadId = "default" }) => {
  
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
      className="btn btn-outline btn-sm gap-2"
      title="Lataa keskustelu tekstitiedostona"
    >
      {/* Lataus-ikoni (Heroicons) */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      Lataa .txt
    </button>
  );
};

export default DownloadChatButton;