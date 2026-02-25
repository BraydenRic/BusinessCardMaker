import { useCallback, useMemo } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import './ParticlesBackground.css';

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: 'push',
          },
          onHover: {
            enable: true,
            mode: 'grab',
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 4,
          },
          grab: {
            distance: 140,
            links: {
              opacity: 0.5,
            },
          },
        },
      },
      particles: {
        color: {
          value: ['#3b82f6', '#60a5fa', '#93c5fd'],
        },
        links: {
          color: '#3b82f6',
          distance: 200,
          enable: true,
          opacity: 0.4,
          width: 1.5,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce',
          },
          random: false,
          speed: 1.5,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 120,
        },
        opacity: {
          value: 0.6,
          random: {
            enable: true,
            minimumValue: 0.3,
          },
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.3,
            sync: false,
          },
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 2, max: 5 },
          random: {
            enable: true,
            minimumValue: 2,
          },
        },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <div className="particles-container">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={options}
      />
    </div>
  );
};

export default ParticlesBackground;
