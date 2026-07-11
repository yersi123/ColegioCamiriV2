'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

const emptyForm = { ci: '', rol: 'secretaria' };

function UsuariosContent() {
  const searchParams = useSearchParams();
  const rol = searchParams.get('rol') || 'admin';
  const [token, setToken] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personaInfo, setPersonaInfo] = useState(null);
  const [buscandoPersona, setBuscandoPersona] = useState(false);
  const [personaError, setPersonaError] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [opcionesBusqueda, setOpcionesBusqueda] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [crearError, setCrearError] = useState(null);
  const [ciError, setCiError] = useState('');

  const validarCI = (value) => {
    if (!value.trim()) return 'El CI es requerido';
    if (!/^\d+$/.test(value)) return 'El CI solo debe contener números';
    if (value.length < 5 || value.length > 10) return 'El CI debe tener entre 5 y 10 dígitos';
    return '';
  };

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) cargar(t);
  }, []);

  useEffect(() => {
    if (token) { setPage(1); cargar(token, 1); }
  }, [rol]);

  useEffect(() => {
    if (token) cargar(token);
  }, [page]);

  useEffect(() => {
    if (modal !== 'create') {
      setPersonaInfo(null);
      setPersonaError(null);
      setOpcionesBusqueda([]);
      setMostrarDropdown(false);
      return;
    }
    const ci = form.ci.trim();
    if (ci.length === 0) {
      setPersonaInfo(null);
      setPersonaError(null);
      setOpcionesBusqueda([]);
      setMostrarDropdown(false);
      return;
    }
    const t = token || localStorage.getItem('token');
    if (!t) return;
    setBuscandoPersona(true);
    setPersonaError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await api.personas.listar(t, { search: ci, limit: 10 });
        const lista = res.data.data || [];
        setOpcionesBusqueda(lista);
        setMostrarDropdown(lista.length > 0 && lista[0].ci !== ci);
        if (lista.length === 1 && lista[0].ci === ci) {
          setPersonaInfo(lista[0]);
          setPersonaError(null);
          setMostrarDropdown(false);
        } else if (lista.length === 0) {
          setPersonaInfo(null);
          setPersonaError(null);
        }
      } catch {
        setOpcionesBusqueda([]);
      } finally {
        setBuscandoPersona(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.ci, modal, token]);

  const getToken = () => token || localStorage.getItem('token');

  const cargar = async (t, pg) => {
    t = t || getToken();
    if (!t) return;
    try {
      const res = await api.usuarios.listar(t, rol, { page: pg || page, limit: 5 });
      setUsuarios(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setForm({ ci: '', rol });
    setPersonaInfo(null);
    setPersonaError(null);
    setBuscandoPersona(false);
    setCrearError(null);
    setCiError('');
  };

  const cerrarModal = () => {
    resetForm();
    setModal(null);
  };

  const abrirCrear = () => {
    resetForm();
    setModal('create');
  };

  const guardarCrear = async (e) => {
    e.preventDefault();
    setCrearError(null);
    const ciErr = validarCI(form.ci);
    if (ciErr) { setCiError(ciErr); return; }
    const t = getToken();
    try {
      await api.usuarios.crear(t, { ci: form.ci, rol });
      cerrarModal();
      cargar(t);
    } catch (err) {
      setCrearError(err.message || err.error || 'Error al crear usuario');
    }
  };

  const restablecer = async (ci) => {
    const t = getToken();
    try {
      await api.usuarios.restablecer(t, rol, ci);
      setConfirmModal(null);
      alert('Contraseña restablecida al CI');
    } catch (err) { alert(err.message || 'Error'); }
  };

  const activar = async (ci) => {
    const t = getToken();
    try {
      await api.usuarios.activar(t, rol, ci);
      setConfirmModal(null);
      cargar(t);
    } catch (err) { alert(err.message || 'Error'); }
  };

  const eliminar = async (ci) => {
    const t = getToken();
    try {
      await api.usuarios.eliminar(t, rol, ci);
      setConfirmModal(null);
      cargar(t);
    } catch (err) { alert(err.message || 'Error'); }
  };

  const ejecutarAccion = () => {
    if (!confirmModal) return;
    const { action, ci } = confirmModal;
    if (action === 'restablecer') restablecer(ci);
    else if (action === 'desactivar') eliminar(ci);
    else if (action === 'activar') activar(ci);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-user-shield"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>{rol === 'secretaria' ? 'Secretarias' : mapValue('rol', rol) + 'es'}</h2>
            </div>
          </div>
          <button className="btn-sm btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus"></i> Nuevo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th><i className="fas fa-id-card" style={{ marginRight: 8 }}></i>CI</th>
                <th><i className="fas fa-user" style={{ marginRight: 8 }}></i>Nombre</th>
                <th><i className="fas fa-user" style={{ marginRight: 8 }}></i>Apellido</th>
                <th><i className="fas fa-envelope" style={{ marginRight: 8 }}></i>Usuario</th>
                <th><i className="fas fa-circle" style={{ marginRight: 8 }}></i>Estado</th>
                <th><i className="fas fa-cog" style={{ marginRight: 8 }}></i>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <i className="fas fa-user-shield"></i>
                      <p>No hay registros disponibles</p>
                      <span className="empty-sub">No se encontraron usuarios</span>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.ci}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {u.ci}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{u.nombre}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{u.apellido}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{u.usuario}</div></td>
                    <td><span className={`badge ${u.estado === 'A' ? 'badge-active' : 'badge-inactive'}`}>{mapValue('estado', u.estado)}</span></td>
                    <td>
                      <div className="actions">
                        {u.estado === 'A' && (
                          <>
                            <button className="btn-sm btn-secondary" onClick={() => setConfirmModal({ action: 'restablecer', ci: u.ci, nombre: u.nombre + ' ' + u.apellido })} title="Restablecer contraseña">
                              <i className="fas fa-key"></i>
                            </button>
                            <button className="btn-sm btn-secondary" onClick={() => setConfirmModal({ action: 'desactivar', ci: u.ci, nombre: u.nombre + ' ' + u.apellido })} title="Desactivar">
                              <i className="fas fa-ban"></i>
                            </button>
                          </>
                        )}
                        {u.estado === 'I' && (
                          <button className="btn-sm btn-secondary" onClick={() => setConfirmModal({ action: 'activar', ci: u.ci, nombre: u.nombre + ' ' + u.apellido })} title="Activar">
                            <i className="fas fa-check-circle"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid #e5e7eb' }}>
            <button
              className="btn-sm btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <i className="fas fa-chevron-left"></i> Anterior
            </button>
            <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
              Página {page} de {totalPages}
            </span>
            <button
              className="btn-sm btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Siguiente <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {modal === 'create' && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo Usuario</h3>
            <form onSubmit={guardarCrear}>
              <div className="form-group">
                <label>Rol</label>
                <input type="text" value={mapValue('rol', rol)} disabled />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>CI (debe existir en Personas)</label>
                <input
                  value={form.ci}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, ci: val });
                    setPersonaInfo(null);
                    setCrearError(null);
                    setCiError(val.trim() ? validarCI(val) : '');
                  }}
                  onFocus={() => { if (form.ci.trim() && opcionesBusqueda.length > 0 && !personaInfo) setMostrarDropdown(true); }}
                  onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                  maxLength={10}
                  required
                  autoComplete="off"
                  className={ciError ? 'input-error' : ''}
                />
                {ciError && <span className="error-text">{ciError}</span>}
                {buscandoPersona && <div style={{ fontSize: 13, marginTop: 4, color: '#888' }}>Buscando...</div>}
                {personaInfo && (
                  <div style={{ fontSize: 13, marginTop: 4, color: '#27ae60' }}>
                    ✓ {personaInfo.nombre} {personaInfo.apellido} — {personaInfo.correo || 'sin correo'}
                  </div>
                )}
                {mostrarDropdown && opcionesBusqueda.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {opcionesBusqueda.map(p => (
                      <div
                        key={p.ci}
                        onMouseDown={() => {
                          setForm({ ...form, ci: p.ci });
                          setPersonaInfo(p);
                          setPersonaError(null);
                          setMostrarDropdown(false);
                          setOpcionesBusqueda([]);
                        }}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13, transition: 'background 0.1s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#1f2937' }}>{p.ci}</span>
                        {' '}
                        <span style={{ color: '#374151' }}>{p.nombre} {p.apellido}</span>
                        {p.correo && <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>{p.correo}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {crearError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}></i>
                  {crearError}
                </div>
              )}

              {personaInfo && (
                <div style={{ padding: '12px 16px', background: '#e8f5e9', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  <strong>Asignación automática:</strong><br />
                  Usuario: <strong>{personaInfo.correo || '(sin correo)'}</strong><br />
                  Contraseña: <strong>{personaInfo.ci}</strong> (el CI)
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-sm btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-sm btn-primary" disabled={!personaInfo || buscandoPersona || !personaInfo.correo}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ color: '#1f2937' }}>{confirmModal.action === 'restablecer' ? 'Restablecer Contraseña' : confirmModal.action === 'activar' ? 'Activar Usuario' : 'Desactivar Usuario'}</h3>
            <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
              {confirmModal.action === 'restablecer'
                ? '¿Restablecer la contraseña al CI del usuario?'
                : confirmModal.action === 'activar'
                  ? '¿Activar este usuario?'
                  : '¿Desactivar este usuario?'}
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 20 }}>
              Usuario: <strong>{confirmModal.nombre}</strong> (CI: {confirmModal.ci})
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-sm btn-secondary" onClick={() => setConfirmModal(null)}>Cancelar</button>
              <button type="button" className="btn-sm btn-primary" onClick={ejecutarAccion}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <Suspense fallback={<div className="card" style={{ padding: 24 }}>Cargando...</div>}>
      <UsuariosContent />
    </Suspense>
  );
}
