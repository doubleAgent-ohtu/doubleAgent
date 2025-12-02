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
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      a.download = `conversation_${threadId}.txt`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading conversation:', error);
      alert('Failed to download conversation. Make sure you are logged in.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="btn btn-primary btn-sm gap-2"
      title="Download conversation as text"
      aria-label={`Download conversation ${threadId}`}
    >
    
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