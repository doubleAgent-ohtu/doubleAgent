import { HealthCheckButton } from '../components/HealthCheckButton';

const LoginPage = () => {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div
      data-theme="dark"
      className="fixed top-0 left-0 w-full h-full flex justify-center items-center"
    >
      <div className="p-8 text-center max-w-xl">
        <h1 className="text-4xl mb-4">Tervetuloa</h1>
        <p className="mb-8 text-gray-400">
          Kirjaudu sisään yliopistotunnuksillasi käyttääksesi chatbottia.
        </p>

        <button onClick={handleLogin} className="btn btn-primary text-lg px-8 py-4 mb-8">
          Kirjaudu yliopistotunnuksilla
        </button>

        <HealthCheckButton />
      </div>
    </div>
  );
};

export default LoginPage;
