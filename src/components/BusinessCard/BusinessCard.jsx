import { templates } from './templates';
import './BusinessCard.css';

const BusinessCard = ({ data, templateId, scale = 1 }) => {
  const template = templates.find(t => t.id === templateId) || templates[0];
  const base = template.style;

  // Allow per-card color overrides (advanced mode) while falling back to template defaults
  const style = {
    ...base,
    backgroundColor: data.cardBgColor      || base.backgroundColor,
    primaryColor:    data.cardPrimaryColor  || base.primaryColor,
    secondaryColor:  data.cardSecondaryColor|| base.secondaryColor,
    textColor:       data.cardTextColor     || base.textColor,
    accentColor:     data.cardAccentColor   || base.accentColor,
  };

  const cardStyle = {
    backgroundColor: style.backgroundColor,
    color: style.textColor,
    fontFamily: style.fontFamily,
    transform: `scale(${scale})`,
    transformOrigin: '0 0'
  };

  const renderModernLayout = () => (
    <div className="card-modern" style={cardStyle}>
      <div className="card-header">
        <h2 style={{ color: style.primaryColor }}>{data.name || 'Your Name'}</h2>
        <p style={{ color: style.accentColor }}>{data.title || 'Your Title'}</p>
      </div>
      <div className="card-divider" style={{ background: `linear-gradient(90deg, ${style.primaryColor}, ${style.secondaryColor})` }}></div>
      <div className="card-body">
        {data.company && <p className="company" style={{ color: style.textColor }}>{data.company}</p>}
        {data.email && <p className="contact-item">{data.email}</p>}
        {data.phone && <p className="contact-item">{data.phone}</p>}
        {data.website && <p className="contact-item">{data.website}</p>}
      </div>
    </div>
  );

  const renderMinimalLayout = () => (
    <div className="card-minimal" style={cardStyle}>
      <div className="minimal-left">
        <h2 style={{ color: style.primaryColor }}>{data.name || 'Your Name'}</h2>
        <p style={{ color: style.secondaryColor }}>{data.title || 'Your Title'}</p>
        {data.company && <p className="company">{data.company}</p>}
      </div>
      <div className="minimal-divider" style={{ backgroundColor: style.primaryColor }}></div>
      <div className="minimal-right">
        {data.email && <p>{data.email}</p>}
        {data.phone && <p>{data.phone}</p>}
        {data.website && <p>{data.website}</p>}
      </div>
    </div>
  );

  const renderBoldLayout = () => (
    <div className="card-bold" style={cardStyle}>
      <div className="bold-gradient" style={{ background: `linear-gradient(135deg, ${style.primaryColor}, ${style.secondaryColor})` }}>
        <h2>{data.name || 'Your Name'}</h2>
      </div>
      <div className="bold-content">
        <p className="title" style={{ color: style.primaryColor }}>{data.title || 'Your Title'}</p>
        {data.company && <p className="company">{data.company}</p>}
        <div className="bold-contacts">
          {data.email && <p>{data.email}</p>}
          {data.phone && <p>{data.phone}</p>}
          {data.website && <p>{data.website}</p>}
        </div>
      </div>
    </div>
  );

  const renderElegantLayout = () => (
    <div className="card-elegant" style={cardStyle}>
      <div className="elegant-border" style={{ borderColor: style.primaryColor }}>
        <div className="elegant-content">
          <h2 style={{ color: style.primaryColor }}>{data.name || 'Your Name'}</h2>
          <div className="elegant-line" style={{ backgroundColor: style.primaryColor }}></div>
          <p className="title" style={{ color: style.secondaryColor }}>{data.title || 'Your Title'}</p>
          {data.company && <p className="company" style={{ color: style.accentColor }}>{data.company}</p>}
          <div className="elegant-contacts">
            {data.email && <p>{data.email}</p>}
            {data.phone && <p>{data.phone}</p>}
            {data.website && <p>{data.website}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTechLayout = () => (
    <div className="card-tech" style={cardStyle}>
      <div className="tech-corner" style={{ borderColor: style.primaryColor }}></div>
      <div className="tech-content">
        <h2 style={{ color: style.primaryColor }}>&gt; {data.name || 'Your Name'}</h2>
        <p className="title" style={{ color: style.secondaryColor }}>{'// '}{data.title || 'Your Title'}</p>
        {data.company && <p className="company" style={{ color: style.accentColor }}>{data.company}</p>}
        <div className="tech-contacts">
          {data.email && <p><span style={{ color: style.primaryColor }}>$</span> {data.email}</p>}
          {data.phone && <p><span style={{ color: style.primaryColor }}>$</span> {data.phone}</p>}
          {data.website && <p><span style={{ color: style.primaryColor }}>$</span> {data.website}</p>}
        </div>
      </div>
    </div>
  );

  const renderCreativeLayout = () => (
    <div className="card-creative" style={cardStyle}>
      <div className="creative-blob" style={{ backgroundColor: style.primaryColor }}></div>
      <div className="creative-content">
        <h2 style={{ color: style.primaryColor }}>{data.name || 'Your Name'}</h2>
        <p className="title" style={{ color: style.secondaryColor }}>{data.title || 'Your Title'}</p>
        {data.company && <p className="company">{data.company}</p>}
        <div className="creative-contacts">
          {data.email && <p>{data.email}</p>}
          {data.phone && <p>{data.phone}</p>}
          {data.website && <p>{data.website}</p>}
        </div>
      </div>
    </div>
  );

  const renderLayout = () => {
    switch (style.layout) {
      case 'modern':
        return renderModernLayout();
      case 'minimal':
        return renderMinimalLayout();
      case 'bold':
        return renderBoldLayout();
      case 'elegant':
        return renderElegantLayout();
      case 'tech':
        return renderTechLayout();
      case 'creative':
        return renderCreativeLayout();
      default:
        return renderModernLayout();
    }
  };

  return (
    <div className="business-card-wrapper" style={{ width: `${350 * scale}px`, height: `${200 * scale}px` }}>
      {renderLayout()}
    </div>
  );
};

export default BusinessCard;
