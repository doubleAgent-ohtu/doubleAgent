import { useState, useEffect } from 'react';
import axios from 'axios';

const Chat = ({ title, threadId }) => {
  // Luodaan kaksi react statea
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [promptInput, setPromptInput] = useState('');

  useEffect(() => {
    fetch('/api/messages')
      .then((res) => res.json())
      .then((data) => setMessages(data.messages.map((text) => ({ role: 'user', content: text }))));
  }, []); // useEffect hook hakee viestit backendistä vain kerran, kun komponentti mountataan eli kun sivu ladataan

  const handleSubmit = async (e) => {
    e.preventDefault(); // Tämä estää html form elementin oletuskäyttäytymisen (sivun uudelleenlataus)
    try {
      const res = await axios.post('/api/chat', {
        message: input,
        thread_id: threadId,
        system_prompt: prompt,
      }); // Lähetetään POST pyyntö backendille axios kirjaston avulla

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: res.data.user_message },
        { role: 'ai', content: res.data.ai_response },
      ]);
      setInput(''); // Tyhjennetään input kenttä
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromptSet = () => {
    if (promptInput.trim()) {
      setPrompt(promptInput);
      setPromptInput('');
    }
  };

  return (
    <div style={{ flex: 1, padding: '1rem' }}>
      <h2>{title}</h2>
      <div style={{ marginBottom: '1em' }}>
        <input
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Type prompt"
          style={{
            fontSize: '1.2em',
            padding: '0.7em',
            width: '100%',
            borderRadius: '8px',
            marginBottom: '0.5em',
          }}
        />
        <button onClick={handlePromptSet}>Set prompt</button>
      </div>
      <div style={{ marginBottom: '1em', color: '#555' }}>
        <b>Current prompt:</b> {prompt}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something"
          style={{
            fontSize: '1.2em',
            padding: '0.7em',
            width: '100%',
            borderRadius: '8px',
            marginBottom: '0.5em',
          }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <h3>Conversation:</h3>
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} style={{ margin: '0.5em 0' }}>
              <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;