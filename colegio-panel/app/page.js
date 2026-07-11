'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const roles = [
  { value: 'admin', label: 'Administrador', icon: 'fa-user-gear' },
  { value: 'director', label: 'Director', icon: 'fa-user-tie' },
  { value: 'secretaria', label: 'Secretaria', icon: 'fa-clipboard-user' },
  { value: 'tutor', label: 'Tutor', icon: 'fa-people-group' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({ usuario: '', contraseña: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.usuario || form.usuario.length < 3) {
      newErrors.usuario = 'Ingrese su usuario';
    }
    if (!form.contraseña || form.contraseña.length < 6) {
      newErrors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
    }
    return newErrors;
  };

  const handleRoleClick = (value) => {
    setSelectedRole(value);
    setError('');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await api.login({ ...form, rol: selectedRole });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.usuario));
      router.push(`/${selectedRole}/dashboard`);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split">
      <div className="login-left">
        <div className="login-brand animate-slide-up">
          <div className="login-brand-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1>Escuela Cristiana Camireña</h1>
          <p>Sistema de Gestión Escolar</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-content animate-fade-in">
          <h2 className="login-subtitle">ACCEDE COMO</h2>

          <div className="role-grid">
            {roles.map((r) => (
              <button
                key={r.value}
                className={`role-card ${selectedRole === r.value ? 'role-card--selected' : ''}`}
                onClick={() => handleRoleClick(r.value)}
              >
                <i className={`fas ${r.icon}`}></i>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {selectedRole && (
            <div className="login-form-wrap animate-slide-up">
              <h3>
                <i className={`fas ${roles.find(r => r.value === selectedRole).icon}`}></i>
                {' '}{roles.find(r => r.value === selectedRole).label}
              </h3>

              {error && (
                <div className="login-error animate-shake">
                  <i className="fas fa-exclamation-circle"></i>
                  <div>
                    <span className="login-error-title">Error al iniciar sesión</span>
                    <span className="login-error-msg">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="usuario">Usuario</label>
                  <div className="login-input-wrap">
                    <i className="fas fa-envelope"></i>
                    <input
                      id="usuario"
                      type="text"
                      className={errors.usuario ? 'input-error' : ''}
                      value={form.usuario}
                      onChange={(e) => {
                        setForm({ ...form, usuario: e.target.value });
                        if (errors.usuario) setErrors({ ...errors, usuario: '' });
                      }}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  {errors.usuario && <span className="error-text">{errors.usuario}</span>}
                </div>

                <div className="login-field">
                  <label htmlFor="contraseña">Contraseña</label>
                  <div className="login-input-wrap">
                    <i className="fas fa-lock"></i>
                    <input
                      id="contraseña"
                      type="password"
                      className={errors.contraseña ? 'input-error' : ''}
                      value={form.contraseña}
                      onChange={(e) => {
                        setForm({ ...form, contraseña: e.target.value });
                        if (errors.contraseña) setErrors({ ...errors, contraseña: '' });
                      }}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {errors.contraseña && <span className="error-text">{errors.contraseña}</span>}
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
                  <i className={`fas fa-arrow-right ${loading ? '' : 'btn-icon'}`}></i>
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="login-copyright">
          <p>&copy; {new Date().getFullYear()} Escuela Cristiana Camireña</p>
        </div>
      </div>
    </div>
  );
}