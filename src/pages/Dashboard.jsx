import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessCards } from '../hooks/useBusinessCards';
import BusinessCard from '../components/BusinessCard/BusinessCard';
import CanvasPreview from '../components/Canvas/CanvasPreview';
import CardFlipModal from '../components/BusinessCard/CardFlipModal';
import { templates } from '../components/BusinessCard/templates';
import './Dashboard.css';

const SAMPLE_DATA = {
  name: 'Alex Rivera', title: 'Product Designer', company: 'Studio Co.',
  email: 'alex@studio.co', phone: '+1 555 0192', website: 'studio.co',
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { cards, loading, deleteCard, createCard, updateCard } = useBusinessCards();
  const navigate = useNavigate();
  const [previewCard, setPreviewCard] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [showCanvasStarter, setShowCanvasStarter] = useState(false);

  const handleCreateNew = () => {
    navigate('/editor');
  };

  const handleCreateCanvas = () => {
    setShowCanvasStarter(true);
  };

  const handleEditCard = (card) => {
    if (card.type === 'canvas') {
      navigate(`/canvas?id=${card.id}`);
    } else {
      navigate(`/editor?id=${card.id}`);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard(cardId);
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('Failed to delete card. Please try again.');
      }
    }
  };

  const handleDuplicateCard = async (card) => {
    try {
      const { id, createdAt, updatedAt, ...cardData } = card;
      const label = cardData.cardLabel || cardData.name || 'Card';
      await createCard({ ...cardData, cardLabel: `${label} (Copy)` });
    } catch (error) {
      console.error('Error duplicating card:', error);
      alert('Failed to duplicate card. Please try again.');
    }
  };

  const startRename = (card) => {
    const current = card.cardLabel || card.name || '';
    setRenameValue(current.replace(/ \(Copy\)$/, ''));
    setRenamingId(card.id);
  };

  const saveRename = async (card) => {
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!trimmed || trimmed === (card.cardLabel || card.name)) return;
    try {
      await updateCard(card.id, { ...card, cardLabel: trimmed });
    } catch (error) {
      console.error('Error renaming card:', error);
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  // Sanitize user content before injecting into print HTML to prevent XSS
  const escapeHtml = (str) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const handlePrintCard = (card, e) => {
    // Grab the actual rendered front card from the DOM
    const cardItem = e.currentTarget.closest('.card-item');
    const cardWrapper = cardItem?.querySelector('.business-card-wrapper');
    if (!cardWrapper) return;

    // Clone front and strip the preview scale transform
    const clone = cardWrapper.cloneNode(true);
    const innerDiv = clone.querySelector(':scope > div');
    if (innerDiv) {
      innerDiv.style.transform = 'none';
      innerDiv.style.transformOrigin = 'top left';
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked — please allow popups for this site to print.');
      return;
    }

    // Canvas cards: print front (page 1) and back (page 2) — all styles inline
    if (card.type === 'canvas') {
      // Build back side HTML from card data (inline styles, same approach)
      const backBg = card.bgColorBack || card.bgColor || '#1a1d27';
      const backEls = card.elementsBack || [];
      const backElsHtml = backEls.map(el => {
        if (el.type === 'text') {
          const boxStyle = el.width ? `width:${el.width}px;height:${el.height}px;overflow:hidden;display:block;` : '';
          return `<span style="position:absolute;left:${el.x}px;top:${el.y}px;${boxStyle}font-size:${el.fontSize}px;color:${el.color};font-weight:${el.bold ? 700 : 400};font-style:${el.italic ? 'italic' : 'normal'};white-space:pre-wrap;word-wrap:break-word;line-height:1.3;">${escapeHtml(el.text)}</span>`;
        }
        if (el.type === 'image') {
          return `<img src="${escapeHtml(el.src)}" style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;object-fit:contain;" alt="">`;
        }
        if (el.type === 'shape') {
          const radius = el.shapeType === 'circle' ? '50%' : '4px';
          const border = el.strokeWidth > 0 ? `border:${el.strokeWidth}px solid ${el.strokeColor};` : '';
          return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;background-color:${el.fillColor};${border}border-radius:${radius};box-sizing:border-box;"></div>`;
        }
        return '';
      }).join('');

      const canvasSharedCss = `
    @page { size: 3.5in 2in; margin: 0; }
    .page-break { page-break-after: always; }
    *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 3.5in; background: white; }
    .business-card-wrapper { width: 3.5in !important; height: 2in !important; display: block; }
    .business-card-wrapper > div { width: 3.5in !important; height: 2in !important; border-radius: 0 !important; overflow: hidden; transform: none !important; position: relative; }`;

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print - ${escapeHtml(card.name)}</title>
  <style>${canvasSharedCss}</style>
</head>
<body>
  <div class="page-break">${clone.outerHTML}</div>
  <div class="business-card-wrapper">
    <div style="background-color:${backBg};">${backElsHtml}</div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
      printWindow.document.close();
      return;
    }

    // Build back HTML from card data + template styles
    const template = templates.find(t => t.id === card.template) || templates[0];
    const style = template.style;
    const resolvedBg      = card.cardBgColor       || style.backgroundColor;
    const resolvedPrimary = card.cardPrimaryColor   || style.primaryColor;
    const resolvedText    = card.cardTextColor      || style.textColor;

    const backHTML = `
      <div class="business-card-wrapper">
        <div class="card-back-inner" style="background-color:${resolvedBg};color:${resolvedText};font-family:${style.fontFamily};">
          <div class="card-back-accent" style="border-color:${resolvedPrimary};"></div>
          ${card.backLogo ? `<img src="${card.backLogo}" class="card-back-logo" alt="Logo">` : ''}
          ${card.backTagline ? `<p class="card-back-tagline" style="color:${resolvedPrimary};">${escapeHtml(card.backTagline)}</p>` : ''}
          ${!card.backLogo && !card.backTagline && !card.backQr ? `<p class="card-back-placeholder" style="color:${style.accentColor};">Card Back</p>` : ''}
          ${card.backQr ? `<img src="${card.backQr}" class="card-back-qr" alt="QR Code">` : ''}
        </div>
      </div>`;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print - ${escapeHtml(card.name)}</title>
  <style>
    .page-break { page-break-after: always; }
    @page { size: 3.5in 2in; margin: 0; }
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
    }
    @media print {
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
    html, body { margin: 0; padding: 0; width: 3.5in; background: white; }

    .business-card-wrapper { width: 3.5in !important; height: 2in !important; display: block; }
    .business-card-wrapper > div { width: 3.5in !important; height: 2in !important; border-radius: 0 !important; overflow: hidden; transform: none !important; }

    /* Modern */
    .card-modern { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; justify-content: space-between; }
    .card-modern .card-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; line-height: 1.2; }
    .card-modern .card-header p { margin: 0.35rem 0 0 0; font-size: 0.85rem; line-height: 1.3; }
    .card-modern .card-divider { height: 3px; margin: 0.6rem 0; border-radius: 2px; }
    .card-modern .card-body { font-size: 0.75rem; line-height: 1.4; }
    .card-modern .company { font-weight: 600; margin-bottom: 0.4rem; }
    .card-modern .contact-item { margin: 0.2rem 0; opacity: 0.95; }

    /* Minimal */
    .card-minimal { padding: 1.25rem 1.5rem; display: grid; grid-template-columns: 1.2fr auto 1fr; gap: 1.25rem; align-items: center; }
    .card-minimal .minimal-left h2 { margin: 0; font-size: 1.25rem; font-weight: 700; line-height: 1.2; }
    .card-minimal .minimal-left p { margin: 0.3rem 0; font-size: 0.8rem; line-height: 1.3; }
    .card-minimal .minimal-divider { width: 2px; height: 80%; }
    .card-minimal .minimal-right { font-size: 0.75rem; text-align: right; line-height: 1.4; }
    .card-minimal .minimal-right p { margin: 0.25rem 0; }

    /* Bold */
    .card-bold { display: flex; flex-direction: column; }
    .card-bold .bold-gradient { padding: 1rem 1.5rem; color: white; flex-shrink: 0; }
    .card-bold .bold-gradient h2 { margin: 0; font-size: 1.4rem; font-weight: 800; line-height: 1.2; }
    .card-bold .bold-content { padding: 0.9rem 1.5rem; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .card-bold .title { margin: 0 0 0.4rem 0; font-size: 0.85rem; font-weight: 600; }
    .card-bold .company { margin: 0 0 0.6rem 0; font-size: 0.8rem; }
    .card-bold .bold-contacts p { margin: 0.2rem 0; font-size: 0.75rem; }

    /* Elegant */
    .card-elegant { padding: 0.75rem; }
    .card-elegant .elegant-border { border: 2px solid; height: 100%; padding: 1rem; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-sizing: border-box; }
    .card-elegant h2 { margin: 0; font-size: 1.2rem; font-weight: 400; letter-spacing: 0.05em; line-height: 1.2; }
    .card-elegant .elegant-line { width: 40px; height: 1px; margin: 0.5rem 0; }
    .card-elegant .title { margin: 0 0 0.35rem 0; font-size: 0.75rem; font-style: italic; }
    .card-elegant .company { margin: 0 0 0.5rem 0; font-size: 0.75rem; }
    .card-elegant .elegant-contacts p { margin: 0.15rem 0; font-size: 0.65rem; }

    /* Tech */
    .card-tech { padding: 1.25rem 1.5rem; position: relative; }
    .card-tech .tech-corner { position: absolute; top: 0; right: 0; width: 35px; height: 35px; border-right: 3px solid; border-top: 3px solid; }
    .card-tech .tech-content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .card-tech h2 { margin: 0; font-size: 1.2rem; font-weight: 600; font-family: 'Courier New', monospace; line-height: 1.2; }
    .card-tech .title { margin: 0.4rem 0; font-size: 0.8rem; font-family: 'Courier New', monospace; }
    .card-tech .company { margin: 0 0 0.5rem 0; font-size: 0.75rem; }
    .card-tech .tech-contacts { font-family: 'Courier New', monospace; font-size: 0.7rem; line-height: 1.5; }
    .card-tech .tech-contacts p { margin: 0.15rem 0; }

    /* Creative */
    .card-creative { padding: 1.25rem 1.5rem; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
    .card-creative .creative-blob { position: absolute; width: 100px; height: 100px; border-radius: 50%; top: -30px; right: -30px; opacity: 0.15; }
    .card-creative .creative-content { position: relative; z-index: 1; }
    .card-creative h2 { margin: 0; font-size: 1.35rem; font-weight: 700; line-height: 1.2; }
    .card-creative .title { margin: 0.35rem 0 0.4rem 0; font-size: 0.85rem; }
    .card-creative .company { margin: 0 0 0.6rem 0; font-size: 0.8rem; }
    .card-creative .creative-contacts p { margin: 0.2rem 0; font-size: 0.75rem; }

    /* Card back */
    .card-back-inner { width: 3.5in !important; height: 2in !important; border-radius: 0 !important; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 1.5rem; box-sizing: border-box; position: relative; transform: none !important; }
    .card-back-accent { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-right: 2px solid; border-top: 2px solid; border-radius: 0 4px 0 0; opacity: 0.5; }
    .card-back-logo { max-width: 120px; max-height: 60px; object-fit: contain; }
    .card-back-tagline { font-size: 0.9rem; font-weight: 500; text-align: center; letter-spacing: 0.04em; margin: 0; max-width: 280px; line-height: 1.4; }
    .card-back-placeholder { font-size: 0.8rem; opacity: 0.4; margin: 0; letter-spacing: 0.1em; text-transform: uppercase; }
    .card-back-qr { border-radius: 3px; image-rendering: pixelated; }
    .card-back-qr--center { width: 72px; height: 72px; }
    .card-back-qr--corner { position: absolute; bottom: 10px; right: 10px; width: 54px; height: 54px; }
  </style>
</head>
<body>
  <div class="page-break">${clone.outerHTML}</div>
  ${backHTML}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your business cards...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>My Business Cards</h1>
        <div className="dashboard-header-actions">
          <button onClick={handleCreateCanvas} className="btn-secondary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 10H13M10 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Custom Canvas
          </button>
          <button onClick={handleCreateNew} className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create New Card
          </button>
        </div>
      </header>

      {/* Cards Grid */}
      <div className="dashboard-content">
        {cards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <h2>No Business Cards Yet</h2>
            <p>Create your first professional business card</p>
            <div className="empty-state-actions">
              <button onClick={handleCreateNew} className="btn-primary large">
                Create Your First Card
              </button>
              <button onClick={handleCreateCanvas} className="btn-secondary large">
                Start with Canvas
              </button>
            </div>
          </div>
        ) : (
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.id} className="card-item">
                <div
                  className="card-preview-wrapper"
                  onClick={() => setPreviewCard(card)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${card.name}'s card in 3D`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPreviewCard(card); }}
                >
                  {card.type === 'canvas'
                    ? <CanvasPreview data={card} scale={1} />
                    : <BusinessCard data={card} templateId={card.template} />
                  }
                </div>
                <div className="card-info">
                  {renamingId === card.id ? (
                    <input
                      className="card-rename-input"
                      value={renameValue}
                      autoFocus
                      maxLength={60}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => saveRename(card)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.target.blur(); }
                        if (e.key === 'Escape') { cancelRename(); }
                      }}
                    />
                  ) : (
                    <span
                      className="card-info-name"
                      onClick={() => startRename(card)}
                      title="Click to rename"
                    >
                      {card.cardLabel || card.name || 'Untitled Card'}
                      <svg className="card-rename-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  {card.type === 'canvas' && renamingId !== card.id && (
                    <span className="card-info-badge">Canvas</span>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleEditCard(card)}
                    className="action-btn edit"
                    title="Edit card"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.3333 2L14 4.66667L5 13.6667H2.33333V11L11.3333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicateCard(card)}
                    className="action-btn duplicate"
                    title="Duplicate card"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 11V3.5C3 2.67157 3.67157 2 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => handlePrintCard(card, e)}
                    className="action-btn print"
                    title="Print card"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6V2H12V6M4 12H3C2.44772 12 2 11.5523 2 11V7C2 6.44772 2.44772 6 3 6H13C13.5523 6 14 6.44772 14 7V11C14 11.5523 13.5523 12 13 12H12M4 10H12V14H4V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="action-btn delete"
                    title="Delete card"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 2H10M2 4H14M12.6667 4L12.1991 11.0129C12.129 12.065 12.0939 12.5911 11.8667 12.99C11.6666 13.3412 11.3648 13.6235 11.0011 13.7998C10.588 14 10.0607 14 9.00623 14H6.99377C5.93927 14 5.41202 14 4.99889 13.7998C4.63517 13.6235 4.33339 13.3412 4.13332 12.99C3.90607 12.5911 3.871 12.065 3.80086 11.0129L3.33333 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewCard && (
        <CardFlipModal
          card={previewCard}
          onClose={() => setPreviewCard(null)}
        />
      )}

      {showCanvasStarter && (
        <div className="canvas-starter-overlay" onClick={() => setShowCanvasStarter(false)}>
          <div className="canvas-starter-modal" onClick={e => e.stopPropagation()}>
            <h2>Start Your Canvas</h2>
            <p className="canvas-starter-sub">Pick a starting point — you can customize everything</p>
            <div className="canvas-starter-grid">
              <div className="canvas-starter-option" onClick={() => { setShowCanvasStarter(false); navigate('/canvas'); }}>
                <div className="canvas-starter-blank">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 8V24M8 16H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span>Blank Canvas</span>
              </div>
              {templates.map(tpl => (
                <div key={tpl.id} className="canvas-starter-option"
                  onClick={() => { setShowCanvasStarter(false); navigate(`/canvas?template=${tpl.id}`); }}>
                  <div className="canvas-starter-preview">
                    <BusinessCard data={SAMPLE_DATA} templateId={tpl.id} scale={0.48} />
                  </div>
                  <span>{tpl.name}</span>
                </div>
              ))}
            </div>
            <button className="canvas-starter-close" onClick={() => setShowCanvasStarter(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
