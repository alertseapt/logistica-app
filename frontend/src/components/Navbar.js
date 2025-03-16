import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { ambiente, changeAmbiente } = useAuth();
  
  return (
    <div className="navbar">
      <div className="logo">
        <h2>Logística</h2>
      </div>
      <nav>
        <ul>
          <li 
            className={ambiente === 'operacional' ? 'active' : ''}
            onClick={() => changeAmbiente('operacional')}
          >
            <span>Operacional</span>
          </li>
          <li 
            className={ambiente === 'administrativo' ? 'active' : ''}
            onClick={() => changeAmbiente('administrativo')}
          >
            <span>Administrativo</span>
          </li>
          <li 
            className={ambiente === 'leitura' ? 'active' : ''}
            onClick={() => changeAmbiente('leitura')}
          >
            <span>Leitura</span>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;