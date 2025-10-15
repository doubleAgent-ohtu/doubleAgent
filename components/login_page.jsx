import { HealthCheckButton } from './health_check';

const LoginPage = () => {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '600px',
        }}
      >
        <h1>Tervetuloa</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Kirjaudu sisään yliopistotunnuksillasi käyttääksesi chatbottia.
        </p>

        <button
          onClick={handleLogin}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '2rem',
          }}
        >
          Kirjaudu yliopistotunnuksilla
        </button>

        <HealthCheckButton />
      </div>
    </div>
  );
};

export default LoginPage;