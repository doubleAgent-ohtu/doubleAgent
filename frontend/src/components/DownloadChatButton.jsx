import axios from 'axios';

const DownloadChatButton = ({ threadId = 'default', label = 'Download .txt' }) => {
  const handleDownload = async () => {
    try {
      const response = await axios.get(`api/download-chat/${threadId}`, {
        responseType: 'blob', // Important: tells axios to handle the response as binary data
        withCredentials: true, // Equivalent to credentials: 'include'
      });

      const blob = response.data;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${threadId}.txt`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading conversation:', error);
      alert('Failed to download conversation. Make sure you are logged in.');
    }
  };

  return (
    <button
      type="button"
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
