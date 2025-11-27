import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Tietosuojaseloste = () => {
  const [markdown, setMarkdown] = useState('');
  const [language, setLanguage] = useState('FIN');

  useEffect(() => {
    const fileName = language === 'ENG' ? 'tietosuojaselosteENG.md' : 'tietosuojaselosteFIN.md';

    axios
      .get(`/${fileName}`)
      .then((response) => {
        setMarkdown(response.data);
      })
      .catch((error) => {
        console.error('Error fetching the file:', error);
        setMarkdown('# Error loading the privacy policy\n\nSee console for details.');
      });
  }, [language]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
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
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default Tietosuojaseloste;
