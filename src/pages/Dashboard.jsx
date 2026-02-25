import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessCards } from '../hooks/useBusinessCards';
import BusinessCard from '../components/BusinessCard/BusinessCard';
import { templates } from '../components/BusinessCard/templates';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { cards, loading, deleteCard } = useBusinessCards();
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate('/editor');
  };

  const handleEditCard = (cardId) => {
    navigate(`/editor?id=${cardId}`);
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard(cardId);
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handlePrintCard = (card) => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    const template = templates.find(t => t.id === card.template);
    const style = template?.style || templates[0].style;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Business Card - ${card.name}</title>
        <style>
          @page {
            size: 3.5in 2in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: ${style.fontFamily};
          }
          .card {
            width: 3.5in;
            height: 2in;
            background-color: ${style.backgroundColor};
            color: ${style.textColor};
            padding: 0.5in;
            box-sizing: border-box;
          }
          h2 { color: ${style.primaryColor}; margin: 0; }
          p { margin: 0.1in 0; font-size: 10pt; }
          .title { color: ${style.secondaryColor}; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${card.name}</h2>
          <p class="title">${card.title}</p>
          ${card.company ? `<p>${card.company}</p>` : ''}
          ${card.email ? `<p>${card.email}</p>` : ''}
          ${card.phone ? `<p>${card.phone}</p>` : ''}
          ${card.website ? `<p>${card.website}</p>` : ''}
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `);
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
        <button onClick={handleCreateNew} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create New Card
        </button>
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
            <button onClick={handleCreateNew} className="btn-primary large">
              Create Your First Card
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {cards.map((card) => (
              <div key={card.id} className="card-item">
                <div className="card-preview-wrapper">
                  <BusinessCard data={card} templateId={card.template} />
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleEditCard(card.id)}
                    className="action-btn edit"
                    title="Edit card"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.3333 2L14 4.66667L5 13.6667H2.33333V11L11.3333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handlePrintCard(card)}
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
    </div>
  );
};

export default Dashboard;
