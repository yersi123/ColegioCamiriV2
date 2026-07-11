'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function TutoresPage() {
  const [token, setToken] = useState(null);
  const [tutores, setTutores] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ci: '' });
  const [personaInfo, setPersonaInfo] = useState(null);
  const [buscandoPersona, setBuscandoPersona] = useState(false);
  const [personaError, setPersonaError] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [opcionesBusqueda, setOpcionesBusqueda] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [crearError, setCrearError] = useState(null);
  const [hijos, setHijos] = useState([]);
  const [hijosModal, setHijosModal] = useState(null);
  const [search, setSearch] = useState('');
  const [ciError, setCiError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) cargar(t);
  }, []);

  const cargar = async (t) => {
    t = t || token || localStorage.getItem('token');
    if (!t) return;
    try {
      const res = await api.secretaria.listarTutores(t);
      setTutores(res.data || []);
    } catch (e) { console.error(e); }
  };

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

  const validarCI = (value) => {
    if (!value.trim()) return 'El CI es requerido';
    if (!/^\d+$/.test(value)) return 'El CI solo debe contener números';
    if (value.length < 5 || value.length > 10) return 'El CI debe tener entre 5 y 10 dígitos';
    return '';
  };

  const getToken = () => token || localStorage.getItem('token');

  const resetForm = () => {
    setForm({ ci: '' });
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
      await api.secretaria.crearTutor(t, { ci: form.ci });
      cerrarModal();
      cargar(t);
    } catch (err) {
      setCrearError(err.message || err.error || 'Error al crear tutor');
    }
  };

  const restablecer = async (ci) => {
    const t = getToken();
    try {
      await api.secretaria.restablecerTutor(t, ci);
      setConfirmModal(null);
      alert('Contraseña restablecida al CI');
    } catch (err) { alert(err.message || 'Error'); }
  };

  const activar = async (ci) => {
    const t = getToken();
    try {
      await api.secretaria.activarTutor(t, ci);
      setConfirmModal(null);
      cargar(t);
    } catch (err) { alert(err.message || 'Error'); }
  };

  const desactivar = async (ci) => {
    const t = getToken();
    try {
      await api.secretaria.desactivarTutor(t, ci);
      setConfirmModal(null);
      cargar(t);
    } catch (err) { alert(err.message || 'Error'); }
  };

  const ejecutarAccion = () => {
    if (!confirmModal) return;
    const { action, ci } = confirmModal;
    if (action === 'restablecer') restablecer(ci);
    else if (action === 'desactivar') desactivar(ci);
    else if (action === 'activar') activar(ci);
  };

  const verHijos = async (tutor) => {
    try {
      const res = await api.secretaria.listarHijosTutor(token, tutor.ci);
      setHijos(res.data);
      setHijosModal(tutor);
    } catch (e) { alert(e.message || 'Error al cargar hijos'); }
  };

  const filtrados = tutores.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.ci.includes(q) || u.nombre.toLowerCase().includes(q) || u.apellido.toLowerCase().includes(q) || (u.usuario && u.usuario.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Tutores</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-wrap" style={{ maxWidth: '100%', width: '100%' }}>
            <i className="fas fa-search"></i>
            <input placeholder="Buscar por CI, nombre o usuario..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th><i className="fas fa-id-card" style={{ marginRight: 8 }}></i>CI</th>
                <th><i className="fas fa-user" style={{ marginRight: 8 }}></i>Nombre</th>
                <th><i className="fas fa-user" style={{ marginRight: 8 }}></i>Apellido</th>
                <th><i className="fas fa-envelope" style={{ marginRight: 8 }}></i>Usuario</th>
                <th><i className="fas fa-circle" style={{ marginRight: 8 }}></i>Estado</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-users" style={{ marginRight: 8 }}></i>Hijos</th>
                <th><i className="fas fa-cog" style={{ marginRight: 8 }}></i>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <i className="fas fa-chalkboard-teacher"></i>
                      <p>No hay registros disponibles</p>
                      <span className="empty-sub">No se encontraron tutores</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => (
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
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-sm btn-secondary" onClick={() => verHijos(u)} title="Ver hijos asignados">
                        <i className="fas fa-users"></i>
                      </button>
                    </td>
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
      </div>

      {modal === 'create' && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo Tutor</h3>
            <form onSubmit={guardarCrear}>
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

      {hijosModal && (
        <div className="modal-overlay" onClick={() => setHijosModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-users"></i>
              </span>
              Hijos de {hijosModal.nombre} {hijosModal.apellido}
            </h3>
            {hijos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 14 }}>
                <i className="fas fa-user-slash" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#d1d5db' }}></i>
                No tiene hijos asignados
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hijos.map((h) => (
                  <div key={h.ci} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#edf5f5', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{h.nombre} {h.apellido}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>CI: {h.ci} &middot; Código: {h.codestudiante}</div>
                    </div>
                    <span className="badge" style={{ background: '#e6f4f5', color: '#5F9EA0', fontSize: 11 }}>Estudiante</span>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-sm btn-secondary" onClick={() => setHijosModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ color: '#1f2937' }}>{confirmModal.action === 'restablecer' ? 'Restablecer Contraseña' : confirmModal.action === 'activar' ? 'Activar Tutor' : 'Desactivar Tutor'}</h3>
            <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
              {confirmModal.action === 'restablecer'
                ? '¿Restablecer la contraseña al CI del tutor?'
                : confirmModal.action === 'activar'
                  ? '¿Activar este tutor?'
                  : '¿Desactivar este tutor?'}
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
