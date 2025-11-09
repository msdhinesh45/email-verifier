// components/LoginForm.js
import React, { useState } from 'react';
import '../assets/styles/components/login.css';
import logo from "../assets/imgaes/tneb.png";

const LoginForm = ({ onLogin }) => {
  const [isActive, setIsActive] = useState(false);

  // toggleForm was defined but never used; removed to satisfy ESLint no-unused-vars.

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Check default credentials
    // Parenthesize mixed &&/|| expressions to avoid no-mixed-operators ESLint errors
    if (
      (email === 'flareminds@gmail.com' && password === 'flareminds@123') ||
      (email === 'flaremindstech@gmail.com' && password === 'flaremindstech@123') ||
      (email === 'admin@gmail.com' && password === 'admin@123')
    ) {
      // Store authentication data in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('lastLogin', new Date().toISOString());
      
      // Call the login callback
      onLogin();
    } else {
      alert('Invalid credentials! Please use the correct email and password.');
    }
  };

  return (
    <div className={`wrapper ${isActive ? 'active' : ''}`} id="formWrapper">
      {/* Login Form */}
      <div className="form-container login">
        <div className="logo-container">
          {/* <img src={logo} alt="TNEB Logo" className="login-logo" /> */}
        </div>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email, username..." required />
          <input type="password" placeholder="Password" required />
          <div className="forgot-password" tabIndex="0">Forgot password?</div>
          <button type="submit" className="submit-btn">Login</button>
        </form>
      </div>

      {/* Right side */}
      <div className="toggle-container">
        <div className="logo-side">
          <img src={logo} alt="TNEB Logo" className="side-logo" />
          <h2>Welcome Back</h2>
          {/* <p>Please login to access your account</p> */}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;