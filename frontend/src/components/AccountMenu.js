import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './style/AccountMenu.css';

const AccountMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="account-menu-container" ref={menuRef}>
      <button className="account-menu-button" onClick={toggleMenu}>
        <span>Conta</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="account-menu-dropdown">
          <button 
            className="account-menu-item"
            onClick={() => {
              navigate('/change-password');
              setIsOpen(false);
            }}
          >
            Mudar Senha
          </button>
          <hr className="account-menu-divider" />
          <button 
            className="account-menu-item"
            onClick={() => {
              navigate('/delete-account');
              setIsOpen(false);
            }}
          >
            Deletar Conta
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;