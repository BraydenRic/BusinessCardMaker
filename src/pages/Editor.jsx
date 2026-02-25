import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessCards } from '../hooks/useBusinessCards';
import BusinessCard from '../components/BusinessCard/BusinessCard';
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
          <div className="form-section">
            <h3>Card Information</h3>

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
                    <BusinessCard data={cardData} templateId={template.id} scale={0.4} />
                  </div>
                  <p>{template.name}</p>
                  {selectedTemplate === template.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="editor-preview">
          <div className="preview-sticky">
            <h3>Live Preview</h3>
            <div className="preview-container">
              <BusinessCard data={cardData} templateId={selectedTemplate} scale={1.0} />
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
