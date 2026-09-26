import React from 'react';
import { X } from 'lucide-react';
import Pricing from './Pricing';

const PricingModal = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px',
        width: '100%', maxWidth: '1100px', maxHeight: '90vh',
        overflowY: 'auto', position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '24px', right: '24px',
            background: 'rgba(0,0,0,0.05)', border: 'none',
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10
          }}
        >
          <X size={20} color="#333" />
        </button>
        
        {/* Pass a prop to hide footer in modal if possible, but for now just wrap it */}
        <div className="pricing-modal-wrapper" style={{ padding: '20px 0' }}>
          <Pricing isModal={true} />
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
