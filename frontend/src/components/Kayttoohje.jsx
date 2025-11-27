import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Kayttoohje = () => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    axios
      .get('/kayttoohje.md')
      .then((response) => {
        setMarkdown(response.data);
      })
      .catch((error) => {
        console.error('Error fetching the file:', error);
        setMarkdown('# Virhe ladattaessa käyttöohjetta\n\nKatso konsoli lisätietoja varten.');
      });
  }, []);

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

export default Kayttoohje;