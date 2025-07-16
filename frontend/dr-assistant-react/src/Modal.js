// Modal.js
import React from "react";
import "./Modal.css";

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>❌</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
