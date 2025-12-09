import { HealthCheckButton } from '../components/HealthCheckButton';
import Galaxy from '../components/third-party/Galaxy';

const LoginPage = () => {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0">
        <Galaxy
          mouseRepulsion={false}
          mouseInteraction={true}
          density={1}
          glowIntensity={0.2}
          saturation={0.5}
          hueShift={70}
          rotationSpeed={0.05}
          twinkleIntensity={0.4}
          transparent={true}
        />
      </div>

      <div className="relative z-10 p-8 text-center max-w-xl">
        <h1 className="text-6xl font-bold mb-20">Double Agent AI</h1>
        <h2 className="text-4xl font-semibold mb-4">Tervetuloa</h2>
        <p className="mb-8 text-xl tracking-wide text-base-content">
          Kirjaudu sisään yliopistotunnuksillasi käyttääksesi chatbottia.
        </p>

        <button onClick={handleLogin} className="btn btn-primary btn-lg mb-8">
          Kirjaudu yliopistotunnuksilla
        </button>

        <div className="flex justify-center">
          <HealthCheckButton />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
