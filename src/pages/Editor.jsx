import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessCards } from '../hooks/useBusinessCards';
import BusinessCard from '../components/BusinessCard/BusinessCard';
import CardBack from '../components/BusinessCard/CardBack';
import { templates, defaultCardData } from '../components/BusinessCard/templates';
import './Editor.css';

const Editor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, createCard, updateCard } = useBusinessCards();

  const cardId = searchParams.get('id');
  const templateParam = searchParams.get('template');

  const [cardData, setCardData] = useState(defaultCardData);
  const [selectedTemplate, setSelectedTemplate] = useState(templateParam || 'modern');
  const [saving, setSaving] = useState(false);
  const [previewScale, setPreviewScale] = useState(1.0);
  const [previewTab, setPreviewTab] = useState('front');
  const [advancedMode, setAdvancedMode] = useState(false);
  const previewRef = useRef(null);

  // Sample data for template previews
  const sampleData = {
    name: 'John Doe',
    title: 'Senior Developer',
    company: 'Tech Solutions Inc.',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    website: 'www.example.com'
  };

  useEffect(() => {
    const updateScale = () => {
      if (previewRef.current) {
        const containerWidth = previewRef.current.clientWidth - 64; // subtract padding
        setPreviewScale(Math.min(1.0, containerWidth / 350));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (cardId && cards.length > 0) {
      const existingCard = cards.find(c => c.id === cardId);
      if (existingCard) {
        setCardData(existingCard);
        setSelectedTemplate(existingCard.template);
      }
    } else if (templateParam) {
      setSelectedTemplate(templateParam);
    }
  }, [cardId, cards, user, navigate, templateParam]);

  const handleInputChange = (field, value) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!cardData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      setSaving(true);
      const dataToSave = {
        ...cardData,
        template: selectedTemplate
      };

      if (cardId) {
        await updateCard(cardId, dataToSave);
      } else {
        await createCard(dataToSave);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Error saving card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="editor">
      {/* Header */}
      <header className="editor-header">
        <h1>{cardId ? 'Edit Business Card' : 'Create New Business Card'}</h1>
        <div className="header-actions">
          <button onClick={handleCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Card'}
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <div className="editor-content">
        {/* Form Section */}
        <div className="editor-form">
          {/* Card Name */}
          <div className="form-section card-label-section">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="cardLabel">Card Name</label>
              <input
                type="text"
                id="cardLabel"
                value={cardData.cardLabel || ''}
                onChange={(e) => handleInputChange('cardLabel', e.target.value)}
                placeholder="e.g. Work Card, Personal, Freelance..."
                maxLength={60}
              />
              <p className="form-hint">Used to identify this card on your dashboard</p>
            </div>
          </div>

          {/* Template Selection */}
          <div className="form-section">
            <h3>Choose Template</h3>
            <div className="template-selector">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="template-mini-preview">
                    <BusinessCard data={{ ...cardData, cardBgColor: '' }} templateId={template.id} scale={0.75} />
                  </div>
                  <p>{template.name}</p>
                  {selectedTemplate === template.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
              <label htmlFor="cardBgColor">Background Color</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  id="cardBgColor"
                  value={
                    cardData.cardBgColor ||
                    (templates.find(t => t.id === selectedTemplate)?.style.backgroundColor ?? '#1a1d27')
                  }
                  onChange={(e) => handleInputChange('cardBgColor', e.target.value)}
                />
                <span className="color-value">
                  {cardData.cardBgColor || 'Template default'}
                </span>
                {cardData.cardBgColor && (
                  <button
                    type="button"
                    className="btn-reset-color"
                    onClick={() => handleInputChange('cardBgColor', '')}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setAdvancedMode(v => !v)}
            >
              {advancedMode ? '▲ Hide Advanced Colors' : '▼ Advanced Colors'}
            </button>

            {advancedMode && (() => {
              const tplStyle = templates.find(t => t.id === selectedTemplate)?.style ?? {};
              const colorField = (id, label, field, fallback) => (
                <div className="form-group advanced-color-group" key={field}>
                  <label htmlFor={field}>{label}</label>
                  <div className="color-picker-row">
                    <input
                      type="color"
                      id={field}
                      value={cardData[field] || fallback}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                    />
                    <span className="color-value">{cardData[field] || 'Template default'}</span>
                    {cardData[field] && (
                      <button type="button" className="btn-reset-color" onClick={() => handleInputChange(field, '')}>
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
              return (
                <div className="advanced-colors">
                  {colorField('primaryColor',   'Primary Color',   'cardPrimaryColor',   tplStyle.primaryColor   ?? '#3b82f6')}
                  {colorField('secondaryColor', 'Secondary Color', 'cardSecondaryColor', tplStyle.secondaryColor ?? '#60a5fa')}
                  {colorField('textColor',      'Text Color',      'cardTextColor',      tplStyle.textColor      ?? '#f1f5f9')}
                  {colorField('accentColor',    'Accent Color',    'cardAccentColor',    tplStyle.accentColor    ?? '#94a3b8')}
                </div>
              );
            })()}
          </div>

          <div className="form-section">
            <h3>Front Side</h3>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={cardData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="title">Job Title</label>
              <input
                type="text"
                id="title"
                value={cardData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Senior Developer"
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                value={cardData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Tech Solutions Inc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={cardData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={cardData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                value={cardData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="www.example.com"
              />
            </div>
          </div>

          {/* Card Back Section */}
          <div className="form-section">
            <h3>Card Back</h3>

            <div className="form-group">
              <label htmlFor="backLogo">Logo (optional)</label>
              {cardData.backLogo && (
                <div className="back-logo-preview">
                  <img src={cardData.backLogo} alt="Logo preview" />
                  <button
                    type="button"
                    className="btn-remove-logo"
                    onClick={() => handleInputChange('backLogo', '')}
                  >
                    Remove
                  </button>
                </div>
              )}
              <input
                type="file"
                id="backLogo"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 200 * 1024) {
                    alert('Logo must be under 200 KB. Please resize your image.');
                    e.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => handleInputChange('backLogo', ev.target.result);
                  reader.readAsDataURL(file);
                }}
              />
              <p className="form-hint">PNG, JPG, SVG — max 200 KB</p>
            </div>

            <div className="form-group">
              <label htmlFor="backTagline">Tagline / Short Text</label>
              <input
                type="text"
                id="backTagline"
                value={cardData.backTagline || ''}
                onChange={(e) => handleInputChange('backTagline', e.target.value)}
                placeholder="Building the future."
                maxLength={80}
              />
            </div>

          </div>
        </div>

        {/* Preview Section */}
        <div className="editor-preview">
          <div className="preview-sticky">
            <h3>Live Preview</h3>
            <div className="preview-tabs">
              <button
                type="button"
                className={`preview-tab ${previewTab === 'front' ? 'active' : ''}`}
                onClick={() => setPreviewTab('front')}
              >
                Front
              </button>
              <button
                type="button"
                className={`preview-tab ${previewTab === 'back' ? 'active' : ''}`}
                onClick={() => setPreviewTab('back')}
              >
                Back
              </button>
            </div>
            <div className="preview-container" ref={previewRef}>
              {previewTab === 'front' ? (
                <BusinessCard data={cardData} templateId={selectedTemplate} scale={previewScale} />
              ) : (
                <CardBack data={cardData} templateId={selectedTemplate} scale={previewScale} />
              )}
            </div>
            <p className="preview-info">
              Standard business card size: 3.5" × 2"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
