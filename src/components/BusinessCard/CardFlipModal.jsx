import { useRef, useState, useEffect, useCallback } from 'react';
import BusinessCard from './BusinessCard';
import CardBack from './CardBack';
import CanvasPreview from '../Canvas/CanvasPreview';
import './CardFlipModal.css';

const DRAG_THRESHOLD = 6;

const CardFlipModal = ({ card, onClose }) => {
  const [flipped, setFlipped] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);

  const isDragging = useRef(false);
  const justDragged = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startRotX = useRef(0);
  const startRotY = useRef(0);
  const totalDragDistance = useRef(0);

  // Parallel refs so handleMouseDown doesn't depend on rotX/rotY state
  const rotXRef = useRef(0);
  const rotYRef = useRef(0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    startRotX.current = rotXRef.current;
    startRotY.current = rotYRef.current;
    totalDragDistance.current = 0;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    totalDragDistance.current = Math.sqrt(dx * dx + dy * dy);
    // 0.4 gives a natural drag-to-rotation ratio; X clamped to ±35° to avoid flipping upside-down
    const newRotY = startRotY.current + dx * 0.4;
    const newRotX = Math.max(-35, Math.min(35, startRotX.current - dy * 0.4));
    rotXRef.current = newRotX;
    rotYRef.current = newRotY;
    setRotX(newRotX);
    setRotY(newRotY);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (totalDragDistance.current < DRAG_THRESHOLD) {
      setFlipped(prev => !prev);
    } else {
      justDragged.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    isDragging.current = true;
    dragStartX.current = t.clientX;
    dragStartY.current = t.clientY;
    startRotX.current = rotXRef.current;
    startRotY.current = rotYRef.current;
    totalDragDistance.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartX.current;
    const dy = t.clientY - dragStartY.current;
    totalDragDistance.current = Math.sqrt(dx * dx + dy * dy);
    const newRotY = startRotY.current + dx * 0.4;
    const newRotX = Math.max(-35, Math.min(35, startRotX.current - dy * 0.4));
    rotXRef.current = newRotX;
    rotYRef.current = newRotY;
    setRotX(newRotX);
    setRotY(newRotY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (totalDragDistance.current < DRAG_THRESHOLD) {
      setFlipped(prev => !prev);
    } else {
      justDragged.current = true;
    }
  }, []);

  return (
    <div
      className="card-flip-overlay"
      onClick={(e) => {
        // Suppress the backdrop click that fires immediately after a drag-release
        if (justDragged.current) { justDragged.current = false; return; }
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`3D preview of ${card.name}'s business card`}
    >
      <div className="card-flip-modal-content">
        <button
          className="card-flip-close"
          onClick={onClose}
          aria-label="Close preview"
          type="button"
        >
          ✕
        </button>

        <p className="card-flip-hint">Drag to rotate · Click to flip</p>

        <div
          className="card-flip-drag-zone"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="card-flip-scene">
            <div
              className="card-flip-pivot"
              style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
            >
              <div className={`card-flip-card ${flipped ? 'is-flipped' : ''}`}>
                <div className="card-flip-face card-flip-face--front">
                  {card.type === 'canvas'
                    ? <CanvasPreview data={card} side="front" scale={1} />
                    : <BusinessCard data={card} templateId={card.template} scale={1} />
                  }
                </div>
                <div className="card-flip-face card-flip-face--back">
                  {card.type === 'canvas'
                    ? <CanvasPreview data={card} side="back" scale={1} />
                    : <CardBack data={card} templateId={card.template} scale={1} />
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="card-flip-indicator">{flipped ? 'Back side' : 'Front side'}</p>
      </div>
    </div>
  );
};

export default CardFlipModal;
