// App.js
import React, { useState, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./pages/Header";
import Footer from "./pages/Footer";
import Dashboard from "./pages/Dashboard";
import ResultTable from "./pages/ResultTable";
import LoginForm from "./pages/LoginForm";
import "./assets/styles/main.css";

// Create Theme Context
export const ThemeContext = createContext();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage when app loads
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear localStorage on logout
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('lastLogin');
    setIsAuthenticated(false);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        {/* show header full width outside of centered container when authenticated */}
        {isAuthenticated && <Header onLogout={logout} />}

  <div className={`container ${theme} ${isAuthenticated ? 'with-fixed-header' : ''}`}>
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginForm onLogin={login} />
              } 
            />
            <Route 
              path="/*" 
              element={
                isAuthenticated ? (
                  <>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/results" element={<ResultTable />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </div>

        {isAuthenticated && <Footer />}
      </Router>
    </ThemeContext.Provider>
  );
};

export default App;