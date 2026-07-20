import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

let toastContainer = null;

const createContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    Object.assign(toastContainer.style, {
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 9999,
      pointerEvents: 'none'
    });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

export const toast = (message, type = 'success') => {
  const container = createContainer();
  const id = Date.now().toString() + Math.random().toString();
  const wrapper = document.createElement('div');
  wrapper.id = `toast-${id}`;
  container.appendChild(wrapper);

  const root = createRoot(wrapper);

  const icons = {
    success: <CheckCircle size={18} color="var(--halal)" />,
    error: <AlertTriangle size={18} color="var(--non-halal)" />,
    info: <Info size={18} color="var(--primary)" />
  };

  root.render(
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      borderRadius: '16px',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      pointerEvents: 'auto',
      animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <div style={{ flexShrink: 0, display: 'flex' }}>{icons[type]}</div>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: 1.3 }}>{message}</span>
    </div>
  );

  setTimeout(() => {
    if (wrapper.children[0]) {
      wrapper.children[0].style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }
    setTimeout(() => {
      root.unmount();
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    }, 300);
  }, 3500);
};

export const toastError = (msg) => toast(msg, 'error');
export const toastSuccess = (msg) => toast(msg, 'success');
export const toastInfo = (msg) => toast(msg, 'info');
