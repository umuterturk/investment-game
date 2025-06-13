import React from 'react';
import '../styles/Modal.css';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    {title && <h2>{title}</h2>}
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal; 