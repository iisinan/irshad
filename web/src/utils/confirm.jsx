import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ message, onResolve }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = (result) => {
    setIsOpen(false);
    setTimeout(() => {
      onResolve(result);
    }, 200); // Allow time for any unmount animations if added
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div className="animate-slide-up" style={{
        background: 'var(--bg)', borderRadius: '16px', 
        width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 59, 48, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px', color: '#ff3b30'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', marginTop: 0 }}>Confirm Action</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px', marginTop: 0 }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => handleClose(false)} style={{
              flex: 1, padding: '12px', borderRadius: '30px',
              background: 'var(--bg-section)', color: 'var(--text-dark)', border: '1px solid var(--border)',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
            }}>
              Cancel
            </button>
            <button onClick={() => handleClose(true)} style={{
              flex: 1, padding: '12px', borderRadius: '30px',
              background: '#ff3b30', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 59, 48, 0.3)'
            }}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const customConfirm = (message) => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const onResolve = (result) => {
      root.unmount();
      container.remove();
      resolve(result);
    };

    root.render(<ConfirmModal message={message} onResolve={onResolve} />);
  });
};

export const customAlert = (message, type = 'info') => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = () => {
      root.unmount();
      container.remove();
      resolve(true);
    };

    const isError = type === 'error';
    const IconComponent = isError ? AlertTriangle : AlertTriangle; // We can use Info/CheckCircle if imported, but we'll stick to AlertTriangle for simplicity
    const color = isError ? '#ff3b30' : 'var(--primary)';

    root.render(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: '20px'
      }}>
        <div className="animate-slide-up" style={{
          background: 'var(--bg)', borderRadius: '16px', 
          width: '100%', maxWidth: '400px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
          }}>
            <div style={{
              background: isError ? 'rgba(255, 59, 48, 0.1)' : 'var(--primary-50)', padding: '16px', borderRadius: '50%', marginBottom: '16px', color: color
            }}>
              <IconComponent size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', marginTop: 0 }}>Notice</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px', marginTop: 0 }}>
              {message}
            </p>
            <button onClick={handleClose} style={{
              width: '100%', padding: '12px', borderRadius: '30px',
              background: color, color: 'white', border: 'none',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              boxShadow: `0 4px 12px ${isError ? 'rgba(255, 59, 48, 0.3)' : 'rgba(69, 165, 138,0.3)'}`
            }}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  });
};
