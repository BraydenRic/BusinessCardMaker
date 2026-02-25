import { useEffect, useRef } from 'react';
import './CursorEffect.css';

const CursorEffect = () => {
  const cursorRef = useRef(null);
  const cursorPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Track mouse position
    const handleMouseMove = (e) => {
      cursorPos.current = { x: e.clientX, y: e.clientY };
    };

    // Smooth animation loop
    const animate = () => {
      // Easing for smooth follow effect
      const ease = 0.15;
      currentPos.current.x += (cursorPos.current.x - currentPos.current.x) * ease;
      currentPos.current.y += (cursorPos.current.y - currentPos.current.y) * ease;

      // Update cursor position
      cursor.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="cursor-effect-container">
      {/* Main cursor glow */}
      <div ref={cursorRef} className="cursor-glow"></div>

      {/* Secondary ambient layers for depth */}
      <div className="cursor-ambient cursor-ambient-1"></div>
      <div className="cursor-ambient cursor-ambient-2"></div>
    </div>
  );
};

export default CursorEffect;
