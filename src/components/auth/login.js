// frontend/src/components/auth/login.js

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { loginUser } = useAppContext();

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Login va parol kiritilishi shart.");
      return;
    }
    setError('');
    setLoading(true);
    const result = await loginUser(username, password);
    setLoading(false);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
    } else {
      setError(result.message || 'Login yoki parol xato');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Tizimga kirish</h2>
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text" id="username" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder=" " required disabled={loading} autoComplete="username"
            />
            <label htmlFor="username" className="input-label"><b>Username</b></label>
          </div>
          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"} id="password" className="input-field" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder=" " required disabled={loading} autoComplete="current-password"
            />
            <label htmlFor="password" className="input-label"><b>Password</b></label>
            <button
              type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} disabled={loading}
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              <i className={showPassword ? "fas fa-eye-slash" : "fa-solid fa-eye"}></i>
            </button>
          </div>
          <div className="remember-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={loading}/>
              <span><b>Meni eslab qol</b></span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary d-block mx-auto px-5 w-100" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Kirilmoqda...</>
            ) : ('Kirish')}
          </button>
        </form>
        <div className='havola mt-3'>
          <div className="contact-info">
            <div className="flex-col text-success"><i className="fas fa-phone"></i> Tel: +998947779891</div>
            <div className="flex-col"><a href="https://t.me/Laz1zbek_Quvond1qov"><i className="fab fa-telegram-plane"></i> Admin bilan bog'lanish</a></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
