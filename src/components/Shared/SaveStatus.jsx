import { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import './SaveStatus.css';

const SaveStatus = () => {
  const { formData } = useBuilder();
  const [status, setStatus] = useState('saved');

  useEffect(() => {
    setStatus('saving');
    const timer = setTimeout(() => {
      setStatus('saved');
    }, 800);

    return () => clearTimeout(timer);
  }, [formData]);

  return (
    <div className={`save-status ${status}`}>
      <div className="status-indicator"></div>
      <span className="status-text">
        {status === 'saving' ? 'Saving...' : 'All changes saved'}
      </span>
    </div>
  );
};

export default SaveStatus;
