import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import { TermoProvider } from './context/TermoContext'; // Importe o TermoProvider
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Verify2FA from './pages/Auth/Verify2FA';
import OfflineStatus from './components/OfflineStatus';
import ChangePassword from './pages/Account/ChangePassword';
import DeleteAccount from './pages/Account/DeleteAccount';
import { AccountProvider } from './context/AccountContext';


function App() {
  return (
    <Router>
      <AuthProvider>
        <AccountProvider>
          <TermoProvider>
            <FileProvider>
              <OfflineStatus />
              <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-2fa" element={<Verify2FA />} />

                {/* Rotas protegidas */}
                <Route element={<Layout />}>
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Home />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/change-password"
                    element={
                      <PrivateRoute>
                        <ChangePassword />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/delete-account"
                    element={
                      <PrivateRoute>
                        <DeleteAccount />
                      </PrivateRoute>
                    }
                  />
                </Route>

                {/* Redirecionamento para rota padrão */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </FileProvider>
          </TermoProvider>
        </AccountProvider>
      </AuthProvider>
    </Router>
  );
}
export default App;