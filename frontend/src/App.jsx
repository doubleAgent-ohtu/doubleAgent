import { useState, useEffect } from 'react';
// import axios from 'axios';

const App = () => {
  // Luodaan kaksi react statea
  // const [input, setInput] = useState('');
  // const [messages, setMessages] = useState([]);

  // useEffect(() => {
  //   fetch('/api/messages')
  //     .then((res) => res.json())
  //     .then((data) => setMessages(data.messages.map((text) => ({ role: 'user', content: text }))));
  // }, []); // useEffect hook hakee viestit backendistä vain kerran, kun komponentti mountataan eli kun sivu ladataan

  // const handleSubmit = async (e) => {
  //   e.preventDefault(); // Tämä estää html form elementin oletuskäyttäytymisen (sivun uudelleenlataus)
  //   try {
  //     const res = await axios.post('/api/chat', {
  //       message: input,
  //       thread_id: 'default',
  //     }); // Lähetetään POST pyyntö backendille axios kirjaston avulla

  //     setMessages((prev) => [
  //       ...prev,
  //       { role: 'user', content: res.data.user_message },
  //       { role: 'ai', content: res.data.ai_response },
  //     ]);
  //     setInput(''); // Tyhjennetään input kenttä
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  return (
    <div style={{ padding: '2rem' }}>
      {/* <h1>Our simple chatbot</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something"
          style={{
            fontSize: '1.2em',
            padding: '0.7em',
            width: '400px',
            borderRadius: '8px',
            marginRight: '1em',
          }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <h2>Conversation:</h2>
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} style={{ margin: '0.5em 0' }}>
              <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.content}
            </div>
          ))}
        </div>
      </div> */}
      <h1>Chatti pois käytöstä kunnes yliopistokirjautuminen on kunnossa.</h1>
      <HealthCheckButton />
    </div>
  );
};

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
    <div>
      <button onClick={checkHealth}>Check Backend Health</button>
      {status && <p>Backend status: {status}</p>}
    </div>
  );
};

export default App;
