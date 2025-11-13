import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Tietosuojaseloste = () => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    // Fetch the file from the public folder
    axios
      .get('/tietosuojaseloste.md')
      .then((response) => {
        setMarkdown(response.data);
      })
      .catch((error) => {
        console.error('Error fetching the file:', error);
        // This is a user-facing error message
        setMarkdown('# Error loading the privacy policy\n\nSee console for details.');
      });
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* The ReactMarkdown component automatically converts markdown text
        into HTML elements (e.g., ### -> <h3>)
      */}
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default Tietosuojaseloste;
