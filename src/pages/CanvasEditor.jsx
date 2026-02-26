import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessCards } from '../hooks/useBusinessCards';
import './CanvasEditor.css';

const DISPLAY_SCALE = 2;
const CARD_W = 350;
const CARD_H = 200;
const SNAP_THRESHOLD = 7; // px at 1x scale

const genId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Canvas center lines that elements also snap to
const CANVAS_X_SNAPS = [0, CARD_W / 2, CARD_W];
const CANVAS_Y_SNAPS = [0, CARD_H / 2, CARD_H];

// Pure snap computation — no React state, safe to call from memoized callbacks
function computeDragSnap(els, draggedId, rawX, rawY) {
  const dragged = els.find(e => e.id === draggedId);
  if (!dragged) return { x: rawX, y: rawY, guides: [] };

  const dW = dragged.width ?? 0;
  const dH = dragged.height ?? 0;
  const others = els.filter(e => e.id !== draggedId);
  const guides = [];
  let x = rawX, y = rawY;
  let xSnapped = false, ySnapped = false;

  // [dragged-edge-value, snap-target-value, offset-to-apply]
  const xChecks = [
    ...others.flatMap(o => {
      const oW = o.width ?? 0;
      return [
        [rawX,         o.x,          0   ],
        [rawX + dW,    o.x + oW,     dW  ],
        [rawX + dW,    o.x,          dW  ],
        [rawX,         o.x + oW,     0   ],
        [rawX + dW/2,  o.x + oW/2,   dW/2],
      ];
    }),
    ...CANVAS_X_SNAPS.flatMap(cx => [
      [rawX,        cx, 0   ],
      [rawX + dW,   cx, dW  ],
      [rawX + dW/2, cx, dW/2],
    ]),
  ];

  for (const [d, o, offset] of xChecks) {
    if (!xSnapped && Math.abs(d - o) < SNAP_THRESHOLD) {
      x = o - offset;
      guides.push({ type: 'v', pos: o });
      xSnapped = true;
    }
  }

  const yChecks = [
    ...others.flatMap(o => {
      const oH = o.height ?? 0;
      return [
        [rawY,         o.y,          0   ],
        [rawY + dH,    o.y + oH,     dH  ],
        [rawY + dH,    o.y,          dH  ],
        [rawY,         o.y + oH,     0   ],
        [rawY + dH/2,  o.y + oH/2,   dH/2],
      ];
    }),
    ...CANVAS_Y_SNAPS.flatMap(cy => [
      [rawY,        cy, 0   ],
      [rawY + dH,   cy, dH  ],
      [rawY + dH/2, cy, dH/2],
    ]),
  ];

  for (const [d, o, offset] of yChecks) {
    if (!ySnapped && Math.abs(d - o) < SNAP_THRESHOLD) {
      y = o - offset;
      guides.push({ type: 'h', pos: o });
      ySnapped = true;
    }
  }

  return { x, y, guides };
}

function computeResizeSnap(els, resizingId, rawW, rawH) {
  const resizing = els.find(e => e.id === resizingId);
  if (!resizing) return { w: rawW, h: rawH, guides: [] };

  const others = els.filter(e => e.id !== resizingId);
  let w = rawW, h = rawH;
  const guides = [];
  let wSnapped = false, hSnapped = false;

  for (const o of others) {
    if (!wSnapped && o.width && Math.abs(rawW - o.width) < SNAP_THRESHOLD) {
      w = o.width;
      guides.push({ type: 'v', pos: resizing.x + w });
      wSnapped = true;
    }
    if (!hSnapped && o.height && Math.abs(rawH - o.height) < SNAP_THRESHOLD) {
      h = o.height;
      guides.push({ type: 'h', pos: resizing.y + h });
      hSnapped = true;
    }
    if (wSnapped && hSnapped) break;
  }

  return { w, h, guides };
}

const CanvasEditor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, createCard, updateCard } = useBusinessCards();
  const cardId = searchParams.get('id');

  const [cardName, setCardName] = useState('');
  const [side, setSide] = useState('front');
  const [bgColor, setBgColor] = useState('#1a1d27');
  const [bgColorBack, setBgColorBack] = useState('#1a1d27');
  const [elements, setElements] = useState([]);
  const [elementsBack, setElementsBack] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [guides, setGuides] = useState([]);

  const canvasRef = useRef(null);
  // Refs so memoized callbacks always read the latest values without stale closures
  const sideRef = useRef('front');
  const activeElementsRef = useRef([]);

  useEffect(() => { sideRef.current = side; }, [side]);

  const activeElements = side === 'front' ? elements : elementsBack;
  const activeBgColor  = side === 'front' ? bgColor  : bgColorBack;
  const setActiveBgColor = side === 'front' ? setBgColor : setBgColorBack;

  useEffect(() => { activeElementsRef.current = activeElements; }, [activeElements]);

  const selectedEl = activeElements.find(el => el.id === selectedId) ?? null;

  // Load existing card on edit
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (cardId && cards.length > 0) {
      const existing = cards.find(c => c.id === cardId);
      if (existing && existing.type === 'canvas') {
        setCardName(existing.name || '');
        setBgColor(existing.bgColor || '#1a1d27');
        setBgColorBack(existing.bgColorBack || existing.bgColor || '#1a1d27');
        setElements(existing.elements || []);
        setElementsBack(existing.elementsBack || []);
      }
    }
  }, [cardId, cards, user, navigate]);

  // Backspace / Delete to remove selected element (skip when editing text)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!selectedId) return;
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      if (sideRef.current === 'front') setElements(prev => prev.filter(el => el.id !== selectedId));
      else setElementsBack(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
      setEditingId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const handleSideChange = (newSide) => {
    setSide(newSide);
    setSelectedId(null);
    setEditingId(null);
    setGuides([]);
  };

  // Stable update — uses sideRef so drag callbacks always write to the right side
  const updateElement = useCallback((id, updates) => {
    if (sideRef.current === 'front') {
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    } else {
      setElementsBack(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    }
  }, []);

  const addToActive = (el) => {
    if (side === 'front') setElements(prev => [...prev, el]);
    else setElementsBack(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  // ── Add elements ──────────────────────────────────────────────────────────

  const handleAddText = () => {
    addToActive({
      id: genId(), type: 'text',
      x: 20, y: 20,
      width: 140, height: 40,   // explicit box so it's resizable right away
      text: 'Edit me',
      fontSize: 18,
      color: '#ffffff',
      bold: false, italic: false,
    });
    setEditingId(null);
  };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      alert('Image must be under 200 KB. Please resize your image.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      addToActive({ id: genId(), type: 'image', x: 40, y: 60, width: 100, height: 60, src: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddRect = () => {
    addToActive({ id: genId(), type: 'shape', shapeType: 'rect',
      x: 50, y: 50, width: 100, height: 60,
      fillColor: '#3b82f6', strokeColor: '#ffffff', strokeWidth: 0 });
  };

  const handleAddCircle = () => {
    addToActive({ id: genId(), type: 'shape', shapeType: 'circle',
      x: 80, y: 60, width: 70, height: 70,
      fillColor: '#3b82f6', strokeColor: '#ffffff', strokeWidth: 0 });
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    if (side === 'front') setElements(prev => prev.filter(el => el.id !== selectedId));
    else setElementsBack(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
    setEditingId(null);
  };

  // ── Drag ─────────────────────────────────────────────────────────────────

  const handleElementMouseDown = (e, id) => {
    if (editingId === id) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    setEditingId(null);
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
  };

  const handleElementTouchStart = (e, id) => {
    if (editingId === id) return;
    e.stopPropagation();
    const t = e.touches[0];
    setSelectedId(id);
    setEditingId(null);
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    setDragging({ id, startX: t.clientX, startY: t.clientY, origX: el.x, origY: el.y });
  };

  const handleResizeMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    setResizing({ id, startX: e.clientX, startY: e.clientY,
      origW: el.width ?? 80, origH: el.height ?? 30 });
  };

  const handleResizeTouchStart = (e, id) => {
    e.stopPropagation();
    const t = e.touches[0];
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    setResizing({ id, startX: t.clientX, startY: t.clientY,
      origW: el.width ?? 80, origH: el.height ?? 30 });
  };

  const applyMove = useCallback((clientX, clientY) => {
    if (dragging) {
      const dx = (clientX - dragging.startX) / DISPLAY_SCALE;
      const dy = (clientY - dragging.startY) / DISPLAY_SCALE;
      const { x, y, guides: g } = computeDragSnap(
        activeElementsRef.current, dragging.id,
        dragging.origX + dx, dragging.origY + dy
      );
      updateElement(dragging.id, { x, y });
      setGuides(g);
    }
    if (resizing) {
      const dx = (clientX - resizing.startX) / DISPLAY_SCALE;
      const dy = (clientY - resizing.startY) / DISPLAY_SCALE;
      const rawW = Math.max(20, resizing.origW + dx);
      const rawH = Math.max(10, resizing.origH + dy);
      const { w, h, guides: g } = computeResizeSnap(activeElementsRef.current, resizing.id, rawW, rawH);
      updateElement(resizing.id, { width: w, height: h });
      setGuides(g);
    }
  }, [dragging, resizing, updateElement]);

  const handleMouseMove = useCallback((e) => {
    applyMove(e.clientX, e.clientY);
  }, [applyMove]);

  const handleTouchMove = useCallback((e) => {
    if (!dragging && !resizing) return;
    e.preventDefault();
    const t = e.touches[0];
    applyMove(t.clientX, t.clientY);
  }, [dragging, resizing, applyMove]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setGuides([]);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
      setEditingId(null);
    }
  };

  const handleElementDoubleClick = (e, id) => {
    const el = activeElements.find(el => el.id === id);
    if (el && el.type === 'text') {
      e.stopPropagation();
      setEditingId(id);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const doSave = async () => {
    if (!cardName.trim()) { alert('Please enter a card name'); return; }
    try {
      setSaving(true);
      const data = { type: 'canvas', name: cardName.trim(), bgColor, bgColorBack, elements, elementsBack };
      if (cardId) await updateCard(cardId, data);
      else await createCard(data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving canvas card:', err);
      alert('Error saving card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Element rendering ─────────────────────────────────────────────────────

  const renderElementContent = (el) => {
    if (el.type === 'text') {
      const textStyle = {
        fontSize: `${el.fontSize * DISPLAY_SCALE}px`,
        color: el.color,
        fontWeight: el.bold ? 700 : 400,
        fontStyle: el.italic ? 'italic' : 'normal',
        lineHeight: 1.3,
      };
      if (editingId === el.id) {
        return (
          <textarea
            autoFocus
            className="canvas-text-edit"
            value={el.text}
            style={textStyle}
            onChange={(e) => updateElement(el.id, { text: e.target.value })}
            onBlur={() => setEditingId(null)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        );
      }
      return (
        <span className="canvas-text-display" style={textStyle}>
          {el.text}
        </span>
      );
    }

    if (el.type === 'image') {
      return (
        <img
          src={el.src} alt="element" draggable={false}
          style={{ width: `${el.width * DISPLAY_SCALE}px`, height: `${el.height * DISPLAY_SCALE}px`,
            objectFit: 'contain', display: 'block' }}
        />
      );
    }

    if (el.type === 'shape') {
      return (
        <div style={{
          width: `${el.width * DISPLAY_SCALE}px`, height: `${el.height * DISPLAY_SCALE}px`,
          backgroundColor: el.fillColor,
          border: el.strokeWidth > 0 ? `${el.strokeWidth * DISPLAY_SCALE}px solid ${el.strokeColor}` : 'none',
          borderRadius: el.shapeType === 'circle' ? '50%' : '4px',
          boxSizing: 'border-box', pointerEvents: 'none',
        }} />
      );
    }

    return null;
  };

  // For text elements the wrapper div IS the bounding box so selection outline is accurate.
  // Must be display:block (not inline-block) so text reflows when the box is resized.
  const elementBoxStyle = (el) => {
    const base = {
      left: `${el.x * DISPLAY_SCALE}px`,
      top:  `${el.y * DISPLAY_SCALE}px`,
      cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
    };
    if (el.type === 'text' && el.width) {
      return { ...base, display: 'block', width: `${el.width * DISPLAY_SCALE}px`, height: `${el.height * DISPLAY_SCALE}px`, overflow: 'hidden' };
    }
    return base;
  };

  return (
    <div className="canvas-editor">
      {/* Header */}
      <header className="canvas-editor-header">
        <input
          type="text"
          className="canvas-card-name-input"
          placeholder="Card name..."
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
        />
        <div className="header-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
          <button onClick={doSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Card'}
          </button>
        </div>
      </header>

      <div className="canvas-editor-body">
        {/* Toolbar */}
        <aside className="canvas-toolbar">
          <div className="toolbar-section">
            <span className="toolbar-label">Background</span>
            <div className="canvas-color-row">
              <input type="color" value={activeBgColor} onChange={(e) => setActiveBgColor(e.target.value)} />
              <span className="canvas-color-value">{activeBgColor}</span>
            </div>
          </div>

          <div className="toolbar-section">
            <span className="toolbar-label">Add Elements</span>
            <button className="toolbar-btn" onClick={handleAddText}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 3H14M8 3V13M5 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Text
            </button>
            <label className="toolbar-btn toolbar-btn-label">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="5.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 11L5 7.5L8 10.5L11 8L15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Image / Logo
              <input type="file" accept="image/*" onChange={handleAddImage} />
            </label>
            <button className="toolbar-btn" onClick={handleAddRect}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Rectangle
            </button>
            <button className="toolbar-btn" onClick={handleAddCircle}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Circle
            </button>
          </div>

          {selectedEl && (
            <div className="toolbar-section">
              <span className="toolbar-label">Selected</span>

              {selectedEl.type === 'text' && (
                <>
                  <div className="toolbar-row">
                    <label>Color</label>
                    <input type="color" value={selectedEl.color}
                      onChange={(e) => updateElement(selectedId, { color: e.target.value })} />
                  </div>
                  <div className="toolbar-row">
                    <label>Size</label>
                    <input type="number" min="6" max="72" value={selectedEl.fontSize}
                      className="toolbar-number"
                      onChange={(e) => updateElement(selectedId, { fontSize: Number(e.target.value) })} />
                    <span className="toolbar-unit">px</span>
                  </div>
                  <div className="toolbar-row">
                    <button className={`toolbar-style-btn ${selectedEl.bold ? 'active' : ''}`}
                      onClick={() => updateElement(selectedId, { bold: !selectedEl.bold })}>B</button>
                    <button className={`toolbar-style-btn toolbar-italic ${selectedEl.italic ? 'active' : ''}`}
                      onClick={() => updateElement(selectedId, { italic: !selectedEl.italic })}>I</button>
                  </div>
                </>
              )}

              {selectedEl.type === 'shape' && (
                <>
                  <div className="toolbar-row">
                    <label>Fill</label>
                    <input type="color" value={selectedEl.fillColor}
                      onChange={(e) => updateElement(selectedId, { fillColor: e.target.value })} />
                  </div>
                  <div className="toolbar-row">
                    <label>Border</label>
                    <input type="color"
                      value={selectedEl.strokeWidth > 0 ? selectedEl.strokeColor : '#ffffff'}
                      onChange={(e) => updateElement(selectedId, { strokeColor: e.target.value })} />
                  </div>
                  <div className="toolbar-row">
                    <label>Width</label>
                    <input type="number" min="0" max="20" value={selectedEl.strokeWidth}
                      className="toolbar-number"
                      onChange={(e) => updateElement(selectedId, { strokeWidth: Number(e.target.value) })} />
                    <span className="toolbar-unit">px</span>
                  </div>
                </>
              )}

              <button className="toolbar-btn toolbar-btn-danger" onClick={handleDeleteSelected}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H10M2 4H14M12.6667 4L12.1991 11.0129C12.129 12.065 12.0939 12.5911 11.8667 12.99C11.6666 13.3412 11.3648 13.6235 11.0011 13.7998C10.588 14 10.0607 14 9.00623 14H6.99377C5.93927 14 5.41202 14 4.99889 13.7998C4.63517 13.6235 4.33339 13.3412 4.13332 12.99C3.90607 12.5911 3.871 12.065 3.80086 11.0129L3.33333 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </div>
          )}

          <div className="toolbar-hints">
            <p>Drag to move elements</p>
            <p>Double-click text to edit</p>
            <p>Backspace to delete selected</p>
            <p>Elements snap to each other</p>
          </div>
        </aside>

        {/* Canvas Work Area */}
        <div className="canvas-work-area">
          <div className="canvas-side-tabs">
            <button className={`canvas-side-tab ${side === 'front' ? 'active' : ''}`}
              onClick={() => handleSideChange('front')}>Front</button>
            <button className={`canvas-side-tab ${side === 'back' ? 'active' : ''}`}
              onClick={() => handleSideChange('back')}>Back</button>
          </div>

          <div
            ref={canvasRef}
            className="canvas-card"
            style={{ width: `${CARD_W * DISPLAY_SCALE}px`, height: `${CARD_H * DISPLAY_SCALE}px`, backgroundColor: activeBgColor }}
            onClick={handleCanvasClick}
          >
            {/* Snap guide lines */}
            {guides.map((g, i) =>
              g.type === 'v'
                ? <div key={i} className="canvas-guide canvas-guide-v" style={{ left: `${g.pos * DISPLAY_SCALE}px` }} />
                : <div key={i} className="canvas-guide canvas-guide-h" style={{ top: `${g.pos * DISPLAY_SCALE}px` }} />
            )}

            {activeElements.map((el) => (
              <div
                key={el.id}
                className={`canvas-element ${selectedId === el.id ? 'selected' : ''}`}
                style={elementBoxStyle(el)}
                onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                onTouchStart={(e) => handleElementTouchStart(e, el.id)}
                onDoubleClick={(e) => handleElementDoubleClick(e, el.id)}
              >
                {renderElementContent(el)}

                {/* Resize handle — all element types */}
                {selectedId === el.id && (
                  <div
                    className="canvas-resize-handle"
                    onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                    onTouchStart={(e) => handleResizeTouchStart(e, el.id)}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="canvas-size-hint">3.5&quot; × 2&quot; &mdash; drag to move &bull; blue handle to resize &bull; elements snap to each other</p>
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;
