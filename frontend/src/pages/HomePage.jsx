import Chat from '../components/Chat';

const HomePage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Our little chatbots</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10rem' }}>
        <Chat title="Chatbot A" threadId="chatbot_a" />
        <Chat title="Chatbot B" threadId="chatbot_b" />
      </div>
    </div>
  );
};

export default HomePage;
