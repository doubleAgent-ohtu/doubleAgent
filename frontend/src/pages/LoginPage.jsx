const LoginPage = () => {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-base-100">
      <div className="p-8 text-center max-w-xl">
        <h1 className="text-4xl font-bold mb-4">Tervetuloa</h1>
        <p className="mb-8 text-base-content/70">
          Kirjaudu sisään yliopistotunnuksillasi käyttääksesi chatbottia.
        </p>

        <button onClick={handleLogin} className="btn btn-primary btn-lg mb-8">
          Kirjaudu yliopistotunnuksilla
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
