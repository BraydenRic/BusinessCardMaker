import '../BusinessCard/BusinessCard.css';

const CanvasPreview = ({ data, scale = 1, side = 'front' }) => {
  const CARD_W = 350;
  const CARD_H = 200;

  const elements = side === 'front'
    ? (data.elements || [])
    : (data.elementsBack || []);

  const bgColor = side === 'front'
    ? (data.bgColor || '#1a1d27')
    : (data.bgColorBack || data.bgColor || '#1a1d27');

  return (
    <div
      className="business-card-wrapper"
      style={{ width: `${CARD_W * scale}px`, height: `${CARD_H * scale}px` }}
    >
      <div
        style={{
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          backgroundColor: bgColor,
          position: 'relative',
          overflow: 'hidden',
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {elements.map((el) => {
          if (el.type === 'text') {
            return (
              <span
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  fontSize: `${el.fontSize}px`,
                  color: el.color,
                  fontWeight: el.bold ? 700 : 400,
                  fontStyle: el.italic ? 'italic' : 'normal',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  lineHeight: 1.3,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  ...(el.width ? { width: `${el.width}px`, height: `${el.height}px`, overflow: 'hidden', display: 'block' } : {}),
                }}
              >
                {el.text}
              </span>
            );
          }

          if (el.type === 'image') {
            return (
              <img
                key={el.id}
                src={el.src}
                alt="element"
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            );
          }

          if (el.type === 'shape') {
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  backgroundColor: el.fillColor,
                  border: el.strokeWidth > 0
                    ? `${el.strokeWidth}px solid ${el.strokeColor}`
                    : 'none',
                  borderRadius: el.shapeType === 'circle' ? '50%' : '4px',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                }}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default CanvasPreview;
