'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [form, setForm] = useState({ contraseñaActual: '', nuevaContraseña: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [showPass, setShowPass] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    setToken(t);
    if (u) setUser(JSON.parse(u));
    if (!t || !u) router.push('/');
  }, []);

  const toggleShow = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validarCampos = () => {
    const e = {};
    if (!form.contraseñaActual.trim()) e.contraseñaActual = 'La contraseña actual es requerida';
    if (!form.nuevaContraseña.trim()) e.nuevaContraseña = 'La nueva contraseña es requerida';
    else if (form.nuevaContraseña.length < 6) e.nuevaContraseña = 'Mínimo 6 caracteres';
    if (!form.confirmar.trim()) e.confirmar = 'Confirme la nueva contraseña';
    else if (form.nuevaContraseña !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    const fe = validarCampos();
    if (Object.keys(fe).length > 0) { setFieldErrors(fe); return; }
    setFieldErrors({});

    if (form.nuevaContraseña.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (form.nuevaContraseña !== form.confirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    if (form.contraseñaActual === form.nuevaContraseña) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe ser diferente a la actual' });
      return;
    }

    setLoading(true);
    try {
      await api.cambiarContrasena(token, {
        contraseñaActual: form.contraseñaActual,
        nuevaContraseña: form.nuevaContraseña,
      });
      setMensaje({ tipo: 'exito', texto: 'Contraseña actualizada correctamente' });
      setFieldErrors({});
      setForm({ contraseñaActual: '', nuevaContraseña: '', confirmar: '' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cambiar contraseña' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading">Cargando...</div>;

  const initials = (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '');

  return (
    <div className="admin-dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-bg" />
        <div className="dashboard-hero-content" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #5F9EA0, #3A6B6D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0,
              border: '3px solid rgba(255,255,255,0.3)',
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>
                {user.nombre} {user.apellido}
              </h1>
              <p style={{ margin: '4px 0', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                {mapValue('rol', user.rol)}
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                fontSize: 12, fontWeight: 600,
              }}>
                <i className="fas fa-id-card"></i> CI: {user.ci}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="dashboard-stat-card" style={{ '--card-gradient': 'linear-gradient(135deg, #5F9EA0, #4A7C7E)', '--card-color': '#5F9EA0', cursor: 'default' }}>
          <div className="dashboard-stat-card-bg" />
          <div className="dashboard-stat-card-icon">
            <i className="fas fa-user"></i>
          </div>
          <div className="dashboard-stat-card-info">
            <span className="dashboard-stat-card-label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre Completo</span>
            <span className="dashboard-stat-card-number" style={{ fontSize: 22 }}>{user.nombre} {user.apellido}</span>
          </div>
        </div>

        <div className="dashboard-stat-card" style={{ '--card-gradient': 'linear-gradient(135deg, #4A7C7E, #2D5A5C)', '--card-color': '#4A7C7E', cursor: 'default' }}>
          <div className="dashboard-stat-card-bg" />
          <div className="dashboard-stat-card-icon">
            <i className="fas fa-id-card"></i>
          </div>
          <div className="dashboard-stat-card-info">
            <span className="dashboard-stat-card-label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cédula de Identidad</span>
            <span className="dashboard-stat-card-number" style={{ fontSize: 22 }}>{user.ci}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-gestion-card">
        <div className="dashboard-gestion-card-header">
          <i className="fas fa-lock"></i>
          <span>Cambiar Contraseña</span>
        </div>
        <div className="dashboard-gestion-card-body" style={{ padding: 24, display: 'block' }}>
          {mensaje && (
            <div style={{
              marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              background: mensaje.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
              color: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b',
            }}>
              <i className={`fas ${mensaje.tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {mensaje.texto}
              <button onClick={() => setMensaje(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>
                  <i className="fas fa-key" style={{ marginRight: 6, color: '#5F9EA0' }}></i>
                  Contraseña Actual
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass.actual ? 'text' : 'password'}
                    value={form.contraseñaActual}
                    onChange={(e) => { setForm({ ...form, contraseñaActual: e.target.value }); setFieldErrors(prev => ({ ...prev, contraseñaActual: '' })); }}
                    required
                    placeholder="Ingrese su contraseña actual"
                    style={{ paddingRight: 36 }}
                    className={fieldErrors.contraseñaActual ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('actual')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 4 }}
                  >
                    <i className={`fas ${showPass.actual ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {fieldErrors.contraseñaActual && <span className="error-text">{fieldErrors.contraseñaActual}</span>}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>
                  <i className="fas fa-lock" style={{ marginRight: 6, color: '#5F9EA0' }}></i>
                  Nueva Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass.nueva ? 'text' : 'password'}
                    value={form.nuevaContraseña}
                    onChange={(e) => { setForm({ ...form, nuevaContraseña: e.target.value }); setFieldErrors(prev => ({ ...prev, nuevaContraseña: '' })); }}
                    minLength={6}
                    required
                    placeholder="Mínimo 6 caracteres"
                    style={{ paddingRight: 36 }}
                    className={fieldErrors.nuevaContraseña ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('nueva')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 4 }}
                  >
                    <i className={`fas ${showPass.nueva ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, display: 'block' }}>Debe tener al menos 6 caracteres</span>
                {fieldErrors.nuevaContraseña && <span className="error-text">{fieldErrors.nuevaContraseña}</span>}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>
                  <i className="fas fa-check-circle" style={{ marginRight: 6, color: '#5F9EA0' }}></i>
                  Confirmar Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass.confirmar ? 'text' : 'password'}
                    value={form.confirmar}
                    onChange={(e) => { setForm({ ...form, confirmar: e.target.value }); setFieldErrors(prev => ({ ...prev, confirmar: '' })); }}
                    minLength={6}
                    required
                    placeholder="Repita la nueva contraseña"
                    style={{ paddingRight: 36 }}
                    className={fieldErrors.confirmar ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('confirmar')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 4 }}
                  >
                    <i className={`fas ${showPass.confirmar ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {fieldErrors.confirmar && <span className="error-text">{fieldErrors.confirmar}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="submit"
                className="btn-sm btn-primary"
                disabled={loading || !form.contraseñaActual || !form.nuevaContraseña || !form.confirmar}
                style={{
                  padding: '8px 24px', fontSize: 14,
                  background: 'linear-gradient(135deg, #5F9EA0, #4A7C7E)',
                  border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600,
                  cursor: (loading || !form.contraseñaActual || !form.nuevaContraseña || !form.confirmar) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !form.contraseñaActual || !form.nuevaContraseña || !form.confirmar) ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Guardando...</>
                ) : (
                  <><i className="fas fa-save"></i> Cambiar Contraseña</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Escuela Cristiana Camireña &copy; {new Date().getFullYear()} — Todos los derechos reservados</p>
      </div>
    </div>
  );
}
