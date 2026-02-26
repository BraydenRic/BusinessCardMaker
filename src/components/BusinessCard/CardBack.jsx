import { templates } from './templates';
import './BusinessCard.css';
import './CardBack.css';

const CardBack = ({ data, templateId, scale = 1 }) => {
  const template = templates.find(t => t.id === templateId) || templates[0];
  const base = template.style;

  const style = {
    ...base,
    backgroundColor: data.cardBgColor       || base.backgroundColor,
    primaryColor:    data.cardPrimaryColor   || base.primaryColor,
    secondaryColor:  data.cardSecondaryColor || base.secondaryColor,
    textColor:       data.cardTextColor      || base.textColor,
    accentColor:     data.cardAccentColor    || base.accentColor,
  };

  const resolvedBg = style.backgroundColor;

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
