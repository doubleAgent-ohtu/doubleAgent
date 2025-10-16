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
    <div className="flex-1 p-4">
      <h2>{title}</h2>
      <div className="mb-4">
        <input
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Type prompt"
          className="input input-bordered w-full text-lg p-3 rounded-lg mb-2"
        />
        <button onClick={handlePromptSet} className="btn btn-soft">Set prompt</button>
      </div>
      <div className="mb-4 text-gray-400">
        <b>Current prompt:</b> {prompt}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something"
          className="input input-bordered w-full text-lg p-3 rounded-lg mb-2"
        />
        <button type="submit" className="btn btn-soft">Add</button>
      </form>

      <div className="mt-4">
        <h3>Conversation:</h3>
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} className="my-2">
              <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chat;
