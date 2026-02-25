import { templates } from './templates';
import './BusinessCard.css';
import './CardBack.css';

const CardBack = ({ data, templateId, scale = 1 }) => {
  const template = templates.find(t => t.id === templateId) || templates[0];
  const style = template.style;

  const resolvedBg = (data.backBgColor && data.backBgColor !== '')
    ? data.backBgColor
    : style.backgroundColor;

  const innerStyle = {
    backgroundColor: resolvedBg,
    color: style.textColor,
    fontFamily: style.fontFamily,
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
  };

  return (
    <div
      className="business-card-wrapper"
      style={{ width: `${350 * scale}px`, height: `${200 * scale}px` }}
    >
      <div className="card-back-inner" style={innerStyle}>
        <div
          className="card-back-accent"
          style={{ borderColor: style.primaryColor }}
        />

        {data.backLogo && (
          <img
            src={data.backLogo}
            alt="Logo"
            className="card-back-logo"
          />
        )}

        {data.backTagline && (
          <p
            className="card-back-tagline"
            style={{ color: style.primaryColor }}
          >
            {data.backTagline}
          </p>
        )}

        {!data.backLogo && !data.backTagline && (
          <p className="card-back-placeholder" style={{ color: style.accentColor }}>
            Card Back
          </p>
        )}
      </div>
    </div>
  );
};

export default CardBack;
