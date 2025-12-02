import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Kayttoohje = ({ onLanguageChange }) => {
  const [markdown, setMarkdown] = useState('');
  const [language, setLanguage] = useState('FIN');

  useEffect(() => {
    const fileName = language === 'ENG' ? 'user-guideENG.md' : 'user-guideFIN.md';

    axios
      .get(`/${fileName}`)
      .then((response) => {
        setMarkdown(response.data);
      })
      .catch((error) => {
        console.error('Error fetching the file:', error);
        setMarkdown('# Error loading the user guide\n\nSee console for details.');
      });

    if (onLanguageChange) {
      onLanguageChange(language);
    }
  }, [language, onLanguageChange]);

  return (
    <div className="markdown-content">
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '1rem' }}
      >
        <button
          onClick={() => setLanguage('FIN')}
          className={`btn btn-sm ${language === 'FIN' ? 'btn-primary' : 'btn-ghost'}`}
        >
          FIN
        </button>
        <button
          onClick={() => setLanguage('ENG')}
          className={`btn btn-sm ${language === 'ENG' ? 'btn-primary' : 'btn-ghost'}`}
        >
          ENG
        </button>
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

export default Kayttoohje;
