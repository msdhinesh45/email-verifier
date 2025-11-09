// components/Header.js
import React from "react";
import "../assets/styles/components/Header.css";
import logo from "../assets/imgaes/tneb.png";

const Header = ({ onLogout }) => {
  return (
    <header className="header-card">
      <div className="header-content">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={logo} alt="TNEB" className="header-logo" />
          <div className="header-text">
            <h1>TNEB Email Verifier</h1>
            <p>Validate email lists professionally and efficiently.</p>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;