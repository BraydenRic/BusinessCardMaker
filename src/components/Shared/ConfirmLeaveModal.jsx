import './ConfirmLeaveModal.css';

const ConfirmLeaveModal = ({ onSave, onDiscard, onStay, saving }) => (
  <div className="confirm-leave-overlay">
    <div className="confirm-leave-box">
      <h3>Unsaved Changes</h3>
      <p>You have unsaved changes that will be lost if you leave.</p>
      <div className="confirm-leave-actions">
        <button className="confirm-leave-stay" onClick={onStay}>
          Keep Editing
        </button>
        <button className="confirm-leave-discard" onClick={onDiscard}>
          Leave Without Saving
        </button>
        <button className="btn-primary confirm-leave-save" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Leave'}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmLeaveModal;
