import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Pricing from './Pricing';

const PricingModal = ({ onClose }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="pricing-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your plan"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="pricing-modal-dialog">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close pricing dialog"
          className="pricing-modal-close"
        >
          <X size={20} />
        </button>

        <div className="pricing-modal-wrapper">
          <Pricing isModal={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
