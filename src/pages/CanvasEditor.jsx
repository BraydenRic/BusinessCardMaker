import { useState, useEffect, useRef, useCallback } from 'react';
import BusinessCard from '../components/BusinessCard/BusinessCard';
import { useNavigate, useSearchParams, useBlocker, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessCards } from '../hooks/useBusinessCards';
import QRCode from 'qrcode';
import ConfirmLeaveModal from '../components/Shared/ConfirmLeaveModal';
import { templates } from '../components/BusinessCard/templates';
import './CanvasEditor.css';

const MEASURE_DATA = {
  name: 'Your Name', title: 'Your Title', company: 'Company Name',
  email: 'email@example.com', phone: '+1 (555) 123-4567', website: 'www.yourwebsite.com',
};

// Card logical size is 350×200; canvas renders at 2× for crisp display on high-DPI screens
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

// Converts a template card into canvas elements matching the exact colors/layout of BusinessCard.jsx.
// cardData is optional; when provided real field values are used and empty fields are omitted.
const buildTemplateElements = (templateId, cardData = {}) => {
  const tpl = templates.find(t => t.id === templateId) || templates[0];
  const bg = cardData.cardBgColor        || tpl.style.backgroundColor;
  const pc = cardData.cardPrimaryColor   || tpl.style.primaryColor;
  const sc = cardData.cardSecondaryColor || tpl.style.secondaryColor;
  const tc = cardData.cardTextColor      || tpl.style.textColor;
  const ac = cardData.cardAccentColor    || tpl.style.accentColor;

  // Only treat cardData as "real" when at least one text field has a value.
  // An all-empty card (e.g. opened from Editor before filling anything in) should
  // show placeholders, matching the Custom Canvas starter path.
  const hasData = !!(cardData.name || cardData.title || cardData.company ||
                     cardData.email || cardData.phone || cardData.website);
  const val = (field, placeholder) => {
    if (hasData) return cardData[field] || null;
    return placeholder;
  };

  const name    = val('name',    'Your Name');
  const title   = val('title',   'Your Title');
  const company = val('company', 'Company Name');
  const email   = val('email',   'email@example.com');
  const phone   = val('phone',   '+1 (555) 123-4567');
  const website = val('website', 'www.yourwebsite.com');

  const mkId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  // textAlign added as optional last param
  const txt = (x, y, w, h, text, fontSize, color, bold = false, italic = false, textAlign = 'left') =>
    ({ id: mkId(), type: 'text', x, y, width: w, height: h, text, fontSize, color, bold, italic, textAlign });
  const rect = (x, y, w, h, fillColor) =>
    ({ id: mkId(), type: 'shape', shapeType: 'rect', x, y, width: w, height: h, fillColor, strokeColor: '#ffffff', strokeWidth: 0 });
  const circle = (x, y, w, h, fillColor) =>
    ({ id: mkId(), type: 'shape', shapeType: 'circle', x, y, width: w, height: h, fillColor, strokeColor: '#ffffff', strokeWidth: 0 });

  // Colors match BusinessCard.jsx exactly per template:
  //   modern:   name=pc, title=ac, company=tc, contacts=tc
  //   minimal:  name=pc, title=sc, company=tc, contacts=tc (right-aligned)
  //   bold:     name=#fff (hardcoded in CSS .bold-gradient), title=pc, company=tc, contacts=tc
  //   elegant:  name=pc, title=sc(italic), company=ac, contacts=tc (center-aligned)
  //   tech:     name=pc, title=sc, company=ac, contacts=tc
  //   creative: name=pc, title=sc, company=tc, contacts=tc

  const modern = () => {
    const els = [];
    if (name)    els.push(txt(24, 20,  220, 28, name,    22, pc, true));
    if (title)   els.push(txt(24, 50,  200, 18, title,   13, ac));
    els.push(rect(24, 73, 110, 3, pc));
    if (company) els.push(txt(24, 84,  200, 18, company, 12, tc, true));
    if (email)   els.push(txt(24, 108, 240, 16, email,   11, tc));
    if (phone)   els.push(txt(24, 126, 240, 16, phone,   11, tc));
    if (website) els.push(txt(24, 144, 240, 16, website, 11, tc));
    return els;
  };

  const minimal = () => {
    const els = [];
    if (name)    els.push(txt(24,  74, 128, 22, name,    18, pc, true));
    if (title)   els.push(txt(24,  98, 128, 16, title,   12, sc));
    if (company) els.push(txt(24, 116, 128, 16, company, 11, tc));
    els.push(rect(162, 20, 2, 160, pc));
    if (email)   els.push(txt(172,  62, 156, 16, email,   11, tc, false, false, 'right'));
    if (phone)   els.push(txt(172,  80, 156, 16, phone,   11, tc, false, false, 'right'));
    if (website) els.push(txt(172,  98, 156, 16, website, 11, tc, false, false, 'right'));
    return els;
  };

  const bold = () => {
    const els = [];
    // Gradient header background (primary→secondary; approximate with pc fill)
    els.push(rect(0, 0, 350, 62, pc));
    if (name)    els.push(txt(24,  16, 280, 28, name,    22, '#ffffff', true));
    // Title/company/contacts are in bold-content BELOW the gradient header
    if (title)   els.push(txt(24,  76, 260, 18, title,   13, pc, true));
    if (company) els.push(txt(24,  96, 260, 16, company, 12, tc));
    if (email)   els.push(txt(24, 118, 280, 14, email,   11, tc));
    if (phone)   els.push(txt(24, 134, 280, 14, phone,   11, tc));
    if (website) els.push(txt(24, 150, 280, 14, website, 11, tc));
    return els;
  };

  const elegant = () => {
    const els = [];
    // Border rect matches CSS: card-elegant padding=12px, elegant-border border=2px → x=12,y=12,w=326,h=176
    els.push({ id: mkId(), type: 'shape', shapeType: 'rect', x: 12, y: 12, width: 326, height: 176, fillColor: bg, strokeColor: pc, strokeWidth: 2 });
    // Content is flex-column justify-center inside a 290×140 area starting at (30,30).
    // Total stack height ≈137px → top offset ≈1.5px → content starts at y≈31.
    if (name)    els.push(txt(30,  31, 290, 23, name,    20, pc, false, false, 'center'));
    // elegant-line: CSS width=40px, centered in 290px box (x=155), margin 8px above+below name
    els.push(rect(155, 62, 40, 1, pc));
    if (title)   els.push(txt(30,  71, 290, 14, title,   12, sc, false, true,  'center'));
    if (company) els.push(txt(30,  91, 290, 14, company, 12, ac, false, false, 'center'));
    // elegant-contacts: font 0.65rem≈10px, line-height 1.3, margin 0.15rem each side ≈2.4px
    if (email)   els.push(txt(30, 115, 290, 14, email,   10, tc, false, false, 'center'));
    if (phone)   els.push(txt(30, 134, 290, 14, phone,   10, tc, false, false, 'center'));
    if (website) els.push(txt(30, 152, 290, 14, website, 10, tc, false, false, 'center'));
    return els;
  };

  const tech = () => {
    const els = [];
    els.push(rect(314, 0, 36, 3, pc));
    els.push(rect(347, 0, 3, 36, pc));
    if (name)    els.push(txt(24,  18, 260, 24, `> ${name}`,    18, pc, true));
    if (title)   els.push(txt(24,  44, 260, 18, `// ${title}`,  12, sc));
    if (company) els.push(txt(24,  64, 220, 16, company,        12, ac));
    if (email)   els.push(txt(24,  92, 300, 16, `$ ${email}`,   11, tc));
    if (phone)   els.push(txt(24, 110, 300, 16, `$ ${phone}`,   11, tc));
    if (website) els.push(txt(24, 128, 300, 16, `$ ${website}`, 11, tc));
    return els;
  };

  const creative = () => {
    const els = [];
    els.push(circle(250, -50, 150, 150, sc));
    if (name)    els.push(txt(24,  26, 240, 30, name,    22, pc, true));
    if (title)   els.push(txt(24,  58, 240, 20, title,   13, sc));
    if (company) els.push(txt(24,  80, 220, 16, company, 12, tc));
    if (email)   els.push(txt(24, 110, 280, 16, email,   11, tc));
    if (phone)   els.push(txt(24, 128, 280, 16, phone,   11, tc));
    if (website) els.push(txt(24, 146, 280, 16, website, 11, tc));
    return els;
  };

  const builders = { modern, minimal, bold, elegant, tech, creative };
  const build = builders[templateId] || modern;

  return { bgColor: bg, bgColorBack: bg, elements: build() };
};

// Convert template card back-side data (logo, QR, tagline) into canvas image/text elements.
const buildBackElementsFromCardData = (cardData, templateId) => {
  const tpl = templates.find(t => t.id === templateId) || templates[0];
  const pc = cardData.cardPrimaryColor || tpl.style.primaryColor;
  const hasLogo = !!cardData.backLogo;
  const hasQr   = !!cardData.backQr;
  const els = [];

  if (hasLogo && hasQr) {
    els.push({ id: genId(), type: 'image', x: 85,  y: 60,  width: 100, height: 60, src: cardData.backLogo });
    els.push({ id: genId(), type: 'image', x: 240, y: 148, width: 54,  height: 54, src: cardData.backQr });
  } else if (hasLogo) {
    els.push({ id: genId(), type: 'image', x: 125, y: 70,  width: 100, height: 60, src: cardData.backLogo });
  } else if (hasQr) {
    els.push({ id: genId(), type: 'image', x: 135, y: 60,  width: 80,  height: 80, src: cardData.backQr });
  }

  if (cardData.backTagline) {
    const tagY = (hasLogo || hasQr) ? 155 : 88;
    els.push({
      id: genId(), type: 'text',
      x: 35, y: tagY, width: 280, height: 30,
      text: cardData.backTagline,
      fontSize: 14, color: pc, bold: false, italic: false, textAlign: 'center',
    });
  }

  return els;
};

const CanvasEditor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cards, createCard, updateCard } = useBusinessCards();
  const cardId = searchParams.get('id');
  const templateParam = searchParams.get('template');

  const [cardName, setCardName] = useState('');
  const [side, setSide] = useState('front');
  const [bgColor, setBgColor] = useState('#1a1d27');
  const [bgColorBack, setBgColorBack] = useState('#1a1d27');
  const [elements, setElements] = useState([]);
  const [elementsBack, setElementsBack] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const draggingRef = useRef(null);
  const resizingRef = useRef(null);
  const rubberBandRef = useRef(null);
  const rubberBandStateRef = useRef(null);
  const [rubberBand, setRubberBand] = useState(null);
  const setRubberBandState = (value) => { rubberBandStateRef.current = value; setRubberBand(value); };
  const [guides, setGuides] = useState([]);
  const [qrText, setQrText] = useState('');
  const [showQrInput, setShowQrInput] = useState(false);
  const [shouldMeasure, setShouldMeasure] = useState(false);
  const measureRef = useRef(null);

  const shiftHeldRef = useRef(false);
  const clipboardRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => { isDirtyRef.current = true; setIsDirty(true); }, []);
  const markClean = useCallback(() => { isDirtyRef.current = false; setIsDirty(false); }, []);

  const blocker = useBlocker(() => isDirtyRef.current);

  useEffect(() => {
    const handler = (e) => { if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    const down = (e) => { if (e.key === 'Shift') shiftHeldRef.current = true; };
    const up   = (e) => { if (e.key === 'Shift') shiftHeldRef.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const canvasRef = useRef(null);
  const workAreaRef = useRef(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasScaleRef = useRef(1);

  // Scale the canvas to fit the available work area
  useEffect(() => {
    const el = workAreaRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      const scaleX = (width  - 80)  / (CARD_W * DISPLAY_SCALE);
      const scaleY = (height - 160) / (CARD_H * DISPLAY_SCALE);
      const s = Math.min(1, scaleX, scaleY);
      canvasScaleRef.current = s;
      setCanvasScale(s);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Refs so memoized callbacks always read the latest values without stale closures
  const sideRef = useRef('front');
  const activeElementsRef = useRef([]);
  // Undo history
  const historyStackRef = useRef([]);
  const preDragStateRef = useRef(null);
  const elementsRef = useRef([]);
  const elementsBackRef = useRef([]);

  useEffect(() => { sideRef.current = side; }, [side]);

  const activeElements = side === 'front' ? elements : elementsBack;
  const activeBgColor  = side === 'front' ? bgColor  : bgColorBack;
  const setActiveBgColor = side === 'front' ? setBgColor : setBgColorBack;

  useEffect(() => { activeElementsRef.current = activeElements; }, [activeElements]);
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { elementsBackRef.current = elementsBack; }, [elementsBack]);

  const pushHistory = useCallback(() => {
    historyStackRef.current.push({
      elements: JSON.parse(JSON.stringify(elementsRef.current)),
      elementsBack: JSON.parse(JSON.stringify(elementsBackRef.current)),
    });
    if (historyStackRef.current.length > 50) historyStackRef.current.shift();
  }, []);

  const handleUndo = useCallback(() => {
    if (historyStackRef.current.length === 0) return;
    const state = historyStackRef.current.pop();
    setElements(state.elements);
    setElementsBack(state.elementsBack);
    setSelectedIds(new Set());
    setEditingId(null);
  }, []);

  // For the properties panel: only show element controls when exactly one is selected
  const selectedEl = selectedIds.size === 1
    ? (activeElements.find(el => el.id === [...selectedIds][0]) ?? null)
    : null;
  const selectedId = selectedEl?.id ?? null;

  // Load existing card on edit, or initialize from template — runs once only.
  // cards is a dependency so we wait for it to load when editing an existing card,
  // but hasInitializedRef prevents re-running if cards reloads later (e.g. after a save).
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (hasInitializedRef.current) return;

    // Conversion from a template card: navigate('/canvas', { state: { fromEditor, templateId, cardData } })
    const fromState = location.state?.fromEditor;
    if (fromState) {
      hasInitializedRef.current = true;
      const { templateId, cardData } = location.state;
      const { bgColor: tBg, bgColorBack: tBgBack, elements: tEls } = buildTemplateElements(templateId, cardData);
      const backEls = buildBackElementsFromCardData(cardData, templateId);
      setCardName(cardData.cardLabel || cardData.name || '');
      setBgColor(tBg);
      setBgColorBack(tBgBack);
      setElements(tEls);
      setElementsBack(backEls);
      return;
    }

    if (cardId) {
      if (cards.length === 0) return; // wait for cards to finish loading
      const existing = cards.find(c => c.id === cardId);
      if (existing && existing.type === 'canvas') {
        hasInitializedRef.current = true;
        setCardName(existing.cardLabel || existing.name || '');
        setBgColor(existing.bgColor || '#1a1d27');
        setBgColorBack(existing.bgColorBack || existing.bgColor || '#1a1d27');
        setElements(existing.elements || []);
        setElementsBack(existing.elementsBack || []);
      }
    } else if (templateParam) {
      setShouldMeasure(true);
      // hasInitializedRef is set by the measurement effect after DOM measurement completes
    } else {
      hasInitializedRef.current = true; // blank canvas — nothing to load
    }
  }, [cardId, templateParam, cards, user, navigate, location.state]);

  // When starting from a template picker (templateParam), render a hidden BusinessCard and measure
  // the actual DOM positions of each element. This gives pixel-perfect matching with the live preview
  // instead of trying to manually reproduce CSS flexbox layout with hardcoded coordinates.
  useEffect(() => {
    if (!shouldMeasure || !measureRef.current || hasInitializedRef.current) return;
    const container = measureRef.current;
    const tpl = templates.find(t => t.id === templateParam) || templates[0];
    const s = tpl.style;
    const inner = container.querySelector('.business-card-wrapper > div');
    if (!inner) return;

    const base = inner.getBoundingClientRect();
    const getPos = (el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left - base.left), y: Math.round(r.top - base.top), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const getField = (field) => container.querySelector(`[data-canvas-field="${field}"]`);

    const makeText = (field, text, color, bold = false, italic = false) => {
      const el = getField(field);
      if (!el) return null;
      const p = getPos(el);
      const cs = window.getComputedStyle(el);
      const fontSize = Math.round(parseFloat(cs.fontSize));
      const rawAlign = cs.textAlign;
      const textAlign = rawAlign === 'start' ? 'left' : rawAlign === 'end' ? 'right' : (rawAlign || 'left');
      return { id: genId(), type: 'text', ...p, text, fontSize, color, bold, italic, textAlign };
    };

    const makeShape = (field, fillColor, strokeColor = '#ffffff', strokeWidth = 0, shapeType = 'rect') => {
      const el = getField(field);
      if (!el) return null;
      const p = getPos(el);
      return { id: genId(), type: 'shape', shapeType, ...p, fillColor, strokeColor, strokeWidth };
    };

    const els = [];
    const push = (el) => { if (el) els.push(el); };

    // Background shapes first (renders behind text)
    push(makeShape('border', s.backgroundColor, s.primaryColor, 2));
    push(makeShape('header-bg', s.primaryColor));
    push(makeShape('blob', s.primaryColor, '#ffffff', 0, 'circle'));

    // Tech corner = two rects built from the corner element's bounding box
    const cornerEl = getField('corner');
    if (cornerEl) {
      const p = getPos(cornerEl);
      els.push({ id: genId(), type: 'shape', shapeType: 'rect', x: p.x, y: p.y, width: p.width, height: 3, fillColor: s.primaryColor, strokeColor: '#ffffff', strokeWidth: 0 });
      els.push({ id: genId(), type: 'shape', shapeType: 'rect', x: p.x + p.width - 3, y: p.y, width: 3, height: p.height, fillColor: s.primaryColor, strokeColor: '#ffffff', strokeWidth: 0 });
    }

    // Name
    const nameBold = templateParam !== 'elegant';
    const nameColor = templateParam === 'bold' ? '#ffffff' : s.primaryColor;
    push(makeText('name', 'Your Name', nameColor, nameBold));

    // Dividers / decorative lines
    push(makeShape('divider', s.primaryColor));
    push(makeShape('line', s.primaryColor));

    // Title
    const titleColor = templateParam === 'modern' ? s.accentColor : s.secondaryColor;
    push(makeText('title', 'Your Title', titleColor, templateParam === 'bold', templateParam === 'elegant'));

    // Company
    const companyColor = ['elegant', 'tech'].includes(templateParam) ? s.accentColor : s.textColor;
    push(makeText('company', 'Company Name', companyColor, templateParam === 'modern'));

    // Contacts (tech gets $ prefix to match the BusinessCard rendering)
    const pre = templateParam === 'tech' ? '$ ' : '';
    push(makeText('email',   `${pre}email@example.com`,    s.textColor));
    push(makeText('phone',   `${pre}+1 (555) 123-4567`,   s.textColor));
    push(makeText('website', `${pre}www.yourwebsite.com`,  s.textColor));

    hasInitializedRef.current = true;
    setBgColor(s.backgroundColor);
    setBgColorBack(s.backgroundColor);
    setElements(els);
    setShouldMeasure(false);
  }, [shouldMeasure, templateParam]);

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+C copy, Ctrl+V paste, Backspace/Delete remove
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (!selectedId) return;
        const el = activeElementsRef.current.find(el => el.id === selectedId);
        if (el) clipboardRef.current = JSON.parse(JSON.stringify(el));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (!clipboardRef.current) return;
        e.preventDefault();
        const pasted = { ...JSON.parse(JSON.stringify(clipboardRef.current)), id: genId(), x: clipboardRef.current.x + 8, y: clipboardRef.current.y + 8 };
        pushHistory();
        markDirty();
        if (sideRef.current === 'front') setElements(prev => [...prev, pasted]);
        else setElementsBack(prev => [...prev, pasted]);
        setSelectedIds(new Set([pasted.id]));
        return;
      }
      if (selectedIds.size === 0) return;
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      e.preventDefault();
      pushHistory();
      markDirty();
      const toDelete = new Set(selectedIds);
      if (sideRef.current === 'front') setElements(prev => prev.filter(el => !toDelete.has(el.id)));
      else setElementsBack(prev => prev.filter(el => !toDelete.has(el.id)));
      setSelectedIds(new Set());
      setEditingId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIds, selectedId, handleUndo, pushHistory, markDirty]);

  const handleSideChange = (newSide) => {
    setSide(newSide);
    setSelectedIds(new Set());
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

  const commitUpdate = useCallback((id, updates) => {
    pushHistory();
    markDirty();
    updateElement(id, updates);
  }, [pushHistory, markDirty, updateElement]);

  const addToActive = (el) => {
    pushHistory();
    markDirty();
    if (side === 'front') setElements(prev => [...prev, el]);
    else setElementsBack(prev => [...prev, el]);
    setSelectedIds(new Set([el.id]));
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
      bold: false, italic: false, textAlign: 'left',
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

  const handleAddQr = async () => {
    const text = qrText.trim();
    if (!text) return;
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 200, margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
      addToActive({ id: genId(), type: 'image', x: 120, y: 55, width: 80, height: 80, src: dataUrl });
      setQrText('');
      setShowQrInput(false);
    } catch (err) {
      console.error('QR error:', err);
      alert('Failed to generate QR code.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    pushHistory();
    markDirty();
    const toDelete = new Set(selectedIds);
    if (side === 'front') setElements(prev => prev.filter(el => !toDelete.has(el.id)));
    else setElementsBack(prev => prev.filter(el => !toDelete.has(el.id)));
    setSelectedIds(new Set());
    setEditingId(null);
  };

  // ── Layer ordering ────────────────────────────────────────────────────────

  const handleBringToFront = () => {
    if (!selectedId) return;
    pushHistory(); markDirty();
    const reorder = (els) => { const el = els.find(e => e.id === selectedId); return [...els.filter(e => e.id !== selectedId), el]; };
    if (side === 'front') setElements(prev => reorder(prev));
    else setElementsBack(prev => reorder(prev));
  };

  const handleSendToBack = () => {
    if (!selectedId) return;
    pushHistory(); markDirty();
    const reorder = (els) => { const el = els.find(e => e.id === selectedId); return [el, ...els.filter(e => e.id !== selectedId)]; };
    if (side === 'front') setElements(prev => reorder(prev));
    else setElementsBack(prev => reorder(prev));
  };

  // ── Drag ─────────────────────────────────────────────────────────────────

  const saveDragState = () => {
    preDragStateRef.current = {
      elements: JSON.parse(JSON.stringify(elementsRef.current)),
      elementsBack: JSON.parse(JSON.stringify(elementsBackRef.current)),
    };
  };

  const handleElementMouseDown = (e, id) => {
    if (editingId === id) return;
    e.stopPropagation();
    e.preventDefault();
    setEditingId(null);

    // Determine new selection set
    let newSelectedIds;
    if (e.shiftKey) {
      newSelectedIds = new Set(selectedIds);
      if (newSelectedIds.has(id)) newSelectedIds.delete(id);
      else newSelectedIds.add(id);
    } else if (selectedIds.has(id)) {
      newSelectedIds = new Set(selectedIds); // keep multi-selection for dragging
    } else {
      newSelectedIds = new Set([id]);
    }
    setSelectedIds(newSelectedIds);

    // Build per-element origins for drag
    const origins = {};
    for (const sid of newSelectedIds) {
      const el = activeElementsRef.current.find(el => el.id === sid);
      if (el) origins[sid] = { origX: el.x, origY: el.y };
    }
    if (Object.keys(origins).length === 0) return;
    saveDragState();
    draggingRef.current = { ids: [...newSelectedIds], startX: e.clientX, startY: e.clientY, origins };
  };

  const handleElementTouchStart = (e, id) => {
    if (editingId === id) return;
    e.stopPropagation();
    e.preventDefault(); // prevents browser from generating synthetic mouse/click events after touch
    const t = e.touches[0];
    setSelectedIds(new Set([id]));
    setEditingId(null);
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    saveDragState();
    draggingRef.current = { ids: [id], startX: t.clientX, startY: t.clientY, origins: { [id]: { origX: el.x, origY: el.y } } };
  };

  const handleResizeMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    saveDragState();
    resizingRef.current = { id, startX: e.clientX, startY: e.clientY,
      origW: el.width ?? 80, origH: el.height ?? 30 };
  };

  const handleResizeTouchStart = (e, id) => {
    e.stopPropagation();
    const t = e.touches[0];
    const el = activeElementsRef.current.find(el => el.id === id);
    if (!el) return;
    saveDragState();
    resizingRef.current = { id, startX: t.clientX, startY: t.clientY,
      origW: el.width ?? 80, origH: el.height ?? 30 };
  };

  const applyMove = useCallback((clientX, clientY) => {
    const dragging = draggingRef.current;
    const resizing = resizingRef.current;
    if (dragging) {
      const dx = (clientX - dragging.startX) / (DISPLAY_SCALE * canvasScaleRef.current);
      const dy = (clientY - dragging.startY) / (DISPLAY_SCALE * canvasScaleRef.current);
      // Snap using the lead element (first in the selection)
      const leadId = dragging.ids[0];
      const leadOrigin = dragging.origins[leadId];
      const { x: snappedX, y: snappedY, guides: g } = computeDragSnap(
        activeElementsRef.current, leadId,
        leadOrigin.origX + dx, leadOrigin.origY + dy
      );
      const actualDx = snappedX - leadOrigin.origX;
      const actualDy = snappedY - leadOrigin.origY;
      for (const id of dragging.ids) {
        const origin = dragging.origins[id];
        if (origin) updateElement(id, { x: origin.origX + actualDx, y: origin.origY + actualDy });
      }
      setGuides(g);
    }
    if (resizing) {
      const dx = (clientX - resizing.startX) / (DISPLAY_SCALE * canvasScaleRef.current);
      const dy = (clientY - resizing.startY) / (DISPLAY_SCALE * canvasScaleRef.current);
      let rawW = Math.max(20, resizing.origW + dx);
      let rawH = Math.max(10, resizing.origH + dy);
      if (shiftHeldRef.current && resizing.origW > 0 && resizing.origH > 0) {
        // Lock aspect ratio: use whichever axis has scaled more to drive both dimensions
        const scale = Math.max(rawW / resizing.origW, rawH / resizing.origH);
        rawW = Math.max(20, resizing.origW * scale);
        rawH = Math.max(10, resizing.origH * scale);
      }
      const { w, h, guides: g } = computeResizeSnap(activeElementsRef.current, resizing.id, rawW, rawH);
      updateElement(resizing.id, { width: w, height: h });
      setGuides(g);
    }
  }, [updateElement]);

  const handleMouseMove = useCallback((e) => {
    applyMove(e.clientX, e.clientY);
    if (rubberBandRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const curX = (e.clientX - rect.left) / (DISPLAY_SCALE * canvasScaleRef.current);
      const curY = (e.clientY - rect.top) / (DISPLAY_SCALE * canvasScaleRef.current);
      const { startX, startY } = rubberBandRef.current;
      setRubberBandState({ x: Math.min(startX, curX), y: Math.min(startY, curY), w: Math.abs(curX - startX), h: Math.abs(curY - startY) });
    }
  }, [applyMove]);

  const handleTouchMove = useCallback((e) => {
    if (!draggingRef.current && !resizingRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    applyMove(t.clientX, t.clientY);
  }, [applyMove]);

  const handleMouseUp = useCallback(() => {
    const wasDragging = draggingRef.current !== null || resizingRef.current !== null;
    draggingRef.current = null;
    resizingRef.current = null;
    setGuides([]);
    if (wasDragging && preDragStateRef.current) {
      historyStackRef.current.push(preDragStateRef.current);
      if (historyStackRef.current.length > 50) historyStackRef.current.shift();
      preDragStateRef.current = null;
      markDirty();
    }
    // Commit rubber-band selection
    if (rubberBandRef.current) {
      const band = rubberBandStateRef.current;
      rubberBandRef.current = null;
      rubberBandStateRef.current = null;
      setRubberBand(null);
      if (band && (band.w > 3 || band.h > 3)) {
        const matched = activeElementsRef.current.filter(el => {
          const elRight  = el.x + (el.width  ?? 0);
          const elBottom = el.y + (el.height ?? 0);
          return elRight > band.x && el.x < band.x + band.w &&
                 elBottom > band.y && el.y < band.y + band.h;
        });
        if (matched.length > 0) setSelectedIds(new Set(matched.map(el => el.id)));
      }
    }
  }, [markDirty]);

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

  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current) return;
    setEditingId(null);
    if (!e.shiftKey) setSelectedIds(new Set());
    // Start rubber-band
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / (DISPLAY_SCALE * canvasScaleRef.current);
    const startY = (e.clientY - rect.top) / (DISPLAY_SCALE * canvasScaleRef.current);
    rubberBandRef.current = { startX, startY };
    setRubberBandState({ x: startX, y: startY, w: 0, h: 0 });
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
      const data = { type: 'canvas', name: cardName.trim(), cardLabel: cardName.trim(), bgColor, bgColorBack, elements, elementsBack };
      if (cardId) await updateCard(cardId, data);
      else await createCard(data);
      markClean();
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
        textAlign: el.textAlign || 'left',
        width: '100%',
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
      cursor: draggingRef.current?.id === el.id ? 'grabbing' : 'grab',
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
              <input type="color" value={activeBgColor} onChange={(e) => { pushHistory(); markDirty(); setActiveBgColor(e.target.value); }} />
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
            <button className="toolbar-btn" onClick={() => setShowQrInput(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="10" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="1" y="10" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="2.5" y="2.5" width="2" height="2" fill="currentColor"/>
                <rect x="11.5" y="2.5" width="2" height="2" fill="currentColor"/>
                <rect x="2.5" y="11.5" width="2" height="2" fill="currentColor"/>
                <path d="M10 10H11V11H10zM12 10H13V11H12zM11 11H12V12H11zM10 12H11V13H10zM12 12H13V13H12zM13 13H14V14H13zM11 13H12V14H11zM10 14H11V15H10zM12 14H13V15H12z" fill="currentColor"/>
              </svg>
              QR Code
            </button>
            {showQrInput && (
              <div className="toolbar-qr-input">
                <input
                  type="text"
                  placeholder="URL or text..."
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddQr(); if (e.key === 'Escape') setShowQrInput(false); }}
                  autoFocus
                />
                <button className="toolbar-btn" onClick={handleAddQr} disabled={!qrText.trim()}>Add</button>
              </div>
            )}
          </div>

          {selectedIds.size > 1 && (
            <div className="toolbar-section">
              <span className="toolbar-label">Selection</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{selectedIds.size} elements selected</span>
              <button className="toolbar-btn toolbar-btn-danger" onClick={handleDeleteSelected}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H10M2 4H14M12.6667 4L12.1991 11.0129C12.129 12.065 12.0939 12.5911 11.8667 12.99C11.6666 13.3412 11.3648 13.6235 11.0011 13.7998C10.588 14 10.0607 14 9.00623 14H6.99377C5.93927 14 5.41202 14 4.99889 13.7998C4.63517 13.6235 4.33339 13.3412 4.13332 12.99C3.90607 12.5911 3.871 12.065 3.80086 11.0129L3.33333 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete All
              </button>
            </div>
          )}

          {selectedEl && (
            <div className="toolbar-section">
              <span className="toolbar-label">Selected</span>

              {selectedEl.type === 'text' && (
                <>
                  <div className="toolbar-row">
                    <label>Color</label>
                    <input type="color" value={selectedEl.color}
                      onChange={(e) => commitUpdate(selectedId, { color: e.target.value })} />
                  </div>
                  <div className="toolbar-row">
                    <label>Size</label>
                    <input type="number" min="6" max="72" value={selectedEl.fontSize}
                      className="toolbar-number"
                      onChange={(e) => commitUpdate(selectedId, { fontSize: Number(e.target.value) })} />
                    <span className="toolbar-unit">px</span>
                  </div>
                  <div className="toolbar-row">
                    <button className={`toolbar-style-btn ${selectedEl.bold ? 'active' : ''}`}
                      onClick={() => commitUpdate(selectedId, { bold: !selectedEl.bold })}>B</button>
                    <button className={`toolbar-style-btn toolbar-italic ${selectedEl.italic ? 'active' : ''}`}
                      onClick={() => commitUpdate(selectedId, { italic: !selectedEl.italic })}>I</button>
                  </div>
                  <div className="toolbar-row">
                    {['left','center','right'].map(align => (
                      <button key={align}
                        className={`toolbar-style-btn ${(selectedEl.textAlign || 'left') === align ? 'active' : ''}`}
                        onClick={() => commitUpdate(selectedId, { textAlign: align })}
                        title={`Align ${align}`}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          {align === 'left'   && <><line x1="1" y1="2" x2="11" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="5" x2="8"  y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="11" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
                          {align === 'center' && <><line x1="1" y1="2" x2="11" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="5" x2="9"  y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="11" x2="10" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
                          {align === 'right'  && <><line x1="1" y1="2" x2="11" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="4" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selectedEl.type === 'shape' && (
                <>
                  <div className="toolbar-row">
                    <label>Fill</label>
                    <input type="color" value={selectedEl.fillColor}
                      onChange={(e) => commitUpdate(selectedId, { fillColor: e.target.value })} />
                  </div>
                  <div className="toolbar-row">
                    <label>Border</label>
                    <input type="color"
                      value={selectedEl.strokeWidth > 0 ? selectedEl.strokeColor : '#ffffff'}
                      onChange={(e) => commitUpdate(selectedId, { strokeColor: e.target.value })} />
                  </div>
                  <div className="toolbar-row">
                    <label>Width</label>
                    <input type="number" min="0" max="20" value={selectedEl.strokeWidth}
                      className="toolbar-number"
                      onChange={(e) => commitUpdate(selectedId, { strokeWidth: Number(e.target.value) })} />
                    <span className="toolbar-unit">px</span>
                  </div>
                </>
              )}

              <div className="toolbar-row">
                <button className="toolbar-btn toolbar-btn-sm" onClick={handleBringToFront} title="Bring to Front">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="2" y="2" width="9" height="9" rx="1.5" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6 5V3M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Front
                </button>
                <button className="toolbar-btn toolbar-btn-sm" onClick={handleSendToBack} title="Send to Back">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="5" y="5" width="9" height="9" rx="1.5" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 11v2M10 13l-2-2M10 13l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              </div>

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
            <p>Shift+drag to resize proportionally</p>
            <p>Elements snap to each other</p>
            <p>Ctrl+C / Ctrl+V to copy &amp; paste</p>
            <p>Ctrl+Z to undo</p>
            <p>Shift+click to multi-select</p>
            <p>Drag empty area to select multiple</p>
          </div>
        </aside>

        {/* Canvas Work Area */}
        <div className="canvas-work-area" ref={workAreaRef}>
          <div className="canvas-side-tabs">
            <button className={`canvas-side-tab ${side === 'front' ? 'active' : ''}`}
              onClick={() => handleSideChange('front')}>Front</button>
            <button className={`canvas-side-tab ${side === 'back' ? 'active' : ''}`}
              onClick={() => handleSideChange('back')}>Back</button>
          </div>

          {/* Outer wrapper holds the visual (scaled) dimensions so layout doesn't overflow */}
          <div style={{ width: `${CARD_W * DISPLAY_SCALE * canvasScale}px`, height: `${CARD_H * DISPLAY_SCALE * canvasScale}px`, flexShrink: 0 }}>
          <div
            ref={canvasRef}
            className="canvas-card"
            style={{ width: `${CARD_W * DISPLAY_SCALE}px`, height: `${CARD_H * DISPLAY_SCALE}px`, backgroundColor: activeBgColor, transform: canvasScale < 1 ? `scale(${canvasScale})` : undefined, transformOrigin: 'top left' }}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Snap guide lines */}
            {guides.map((g, i) =>
              g.type === 'v'
                ? <div key={i} className="canvas-guide canvas-guide-v" style={{ left: `${g.pos * DISPLAY_SCALE}px` }} />
                : <div key={i} className="canvas-guide canvas-guide-h" style={{ top: `${g.pos * DISPLAY_SCALE}px` }} />
            )}

            {rubberBand && rubberBand.w > 0 && rubberBand.h > 0 && (
              <div className="canvas-rubber-band" style={{ left: `${rubberBand.x * DISPLAY_SCALE}px`, top: `${rubberBand.y * DISPLAY_SCALE}px`, width: `${rubberBand.w * DISPLAY_SCALE}px`, height: `${rubberBand.h * DISPLAY_SCALE}px` }} />
            )}

            {activeElements.map((el) => (
              <div
                key={el.id}
                className={`canvas-element ${selectedIds.has(el.id) ? 'selected' : ''}`}
                style={elementBoxStyle(el)}
                onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                onTouchStart={(e) => handleElementTouchStart(e, el.id)}
                onDoubleClick={(e) => handleElementDoubleClick(e, el.id)}
                onClick={(e) => e.stopPropagation()}
              >
                {renderElementContent(el)}

                {/* Resize handle — only for single selection */}
                {selectedIds.size === 1 && selectedIds.has(el.id) && (
                  <div
                    className="canvas-resize-handle"
                    onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                    onTouchStart={(e) => handleResizeTouchStart(e, el.id)}
                  />
                )}
              </div>
            ))}
          </div>
          </div>{/* end scale wrapper */}

          <p className="canvas-size-hint">3.5&quot; × 2&quot; &mdash; drag to move &bull; blue handle to resize &bull; elements snap to each other</p>
        </div>
      </div>

      {/* Hidden off-screen BusinessCard used to measure exact element positions for canvas initialization */}
      {shouldMeasure && templateParam && (
        <div ref={measureRef} style={{ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
          <BusinessCard data={MEASURE_DATA} templateId={templateParam} scale={1} />
        </div>
      )}

      {blocker.state === 'blocked' && (
        <ConfirmLeaveModal
          saving={saving}
          onStay={() => blocker.reset()}
          onDiscard={() => blocker.proceed()}
          onSave={async () => {
            if (!cardName.trim()) { alert('Please enter a card name before saving.'); return; }
            try {
              setSaving(true);
              const data = { type: 'canvas', name: cardName.trim(), cardLabel: cardName.trim(), bgColor, bgColorBack, elements, elementsBack };
              if (cardId) await updateCard(cardId, data);
              else await createCard(data);
              markClean();
              blocker.proceed();
            } catch {
              alert('Error saving card. Please try again.');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default CanvasEditor;
