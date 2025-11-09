import React from "react";
import "../assets/styles/components/Header.css";

const Footer = () => {
  return (
    <footer style={{
      marginTop: '24px',
      padding: '16px 20px',
      textAlign: 'center',
      color: 'white',
      background: 'linear-gradient(90deg, #173662 0%, #1f4777 100%)',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{maxWidth: 1200, margin: '0 auto'}}>
        <small>© {new Date().getFullYear()} TNEB Email Verifier. All rights reserved.</small>
      </div>
    </footer>
  );
};

export default Footer;
