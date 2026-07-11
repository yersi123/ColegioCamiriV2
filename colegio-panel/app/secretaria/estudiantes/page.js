'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function EstudiantesPage() {
  const [token, setToken] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [search, setSearch] = useState('');
  const [tutorModal, setTutorModal] = useState(null);
  const [reasignarSearchText, setReasignarSearchText] = useState('');
  const [reasignarTutorInfo, setReasignarTutorInfo] = useState(null);
  const [reasignarOpciones, setReasignarOpciones] = useState([]);
  const [reasignarMostrarDropdown, setReasignarMostrarDropdown] = useState(false);
  const [reasignarBuscando, setReasignarBuscando] = useState(false);
  const [reasignarSelectedTutor, setReasignarSelectedTutor] = useState('');
  const [tutores, setTutores] = useState([]);
  const [viewEstudiante, setViewEstudiante] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ ci: '', citutor: '', idgestion: '' });
  const [gestiones, setGestiones] = useState([]);
  const [codigoGenerado, setCodigoGenerado] = useState('');

  const [personaSearchText, setPersonaSearchText] = useState('');
  const [personaInfo, setPersonaInfo] = useState(null);
  const [opcionesPersonas, setOpcionesPersonas] = useState([]);
  const [mostrarDropdownPersona, setMostrarDropdownPersona] = useState(false);
  const [buscandoPersona, setBuscandoPersona] = useState(false);

  const [tutorSearchText, setTutorSearchText] = useState('');
  const [tutorInfo, setTutorInfo] = useState(null);
  const [opcionesTutores, setOpcionesTutores] = useState([]);
  const [mostrarDropdownTutor, setMostrarDropdownTutor] = useState(false);
  const [buscandoTutor, setBuscandoTutor] = useState(false);

  const [errors, setErrors] = useState({});
  const [personaError, setPersonaError] = useState('');
  const [tutorErrorField, setTutorErrorField] = useState('');

  const gestionActiva = gestiones.find(g => g.estado === '1');

  const validarBusqueda = (value) => {
    if (!value.trim()) return 'Este campo es requerido';
    if (value.trim().length < 3) return 'Ingrese al menos 3 caracteres';
    return '';
  };

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) { cargar(t); cargarTutores(t); cargarGestiones(t); }
  }, []);

  const cargar = async (t, s) => {
    try {
      const params = {};
      if (s || search) params.search = s || search;
      const res = await api.secretaria.listarEstudiantes(t || token, params);
      setEstudiantes(res.data);
    } catch (e) { console.error(e); }
  };

  const cargarTutores = async (t) => {
    try {
      const res = await api.secretaria.listarTutores(t || token);
      setTutores(res.data);
    } catch (e) { console.error(e); }
  };

  const cargarGestiones = async (t) => {
    try {
      const res = await api.gestiones.listar(t || token);
      setGestiones(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (token) cargar(token, search);
  }, [search]);

  const getToken = () => token || localStorage.getItem('token');

  const abrirCrear = async () => {
    const t = getToken();
    const activa = gestiones.find(g => g.estado === '1');
    setForm({ ci: '', citutor: '', idgestion: activa ? String(activa.idgestion) : '' });
    setPersonaSearchText('');
    setPersonaInfo(null);
    setTutorSearchText('');
    setTutorInfo(null);
    setErrors({});
    setCreateModal(true);
    if (!t) return;
    try {
      const res = await api.secretaria.nextCodigoEstudiante(t);
      setCodigoGenerado(res.data.codestudiante);
    } catch { setCodigoGenerado('EST-00001'); }
  };

  // Persona autocomplete
  useEffect(() => {
    if (!createModal) {
      setOpcionesPersonas([]);
      setMostrarDropdownPersona(false);
      return;
    }
    const q = personaSearchText.trim();
    if (q.length === 0) { setOpcionesPersonas([]); setMostrarDropdownPersona(false); return; }
    const t = getToken();
    if (!t) return;
    setBuscandoPersona(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.personas.listar(t, { search: q, limit: 10 });
        const lista = res.data.data || [];
        setOpcionesPersonas(lista);
        setMostrarDropdownPersona(lista.length > 0);
      } catch { setOpcionesPersonas([]); } finally { setBuscandoPersona(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [personaSearchText, createModal]);

  // Tutor autocomplete
  useEffect(() => {
    if (!createModal) {
      setOpcionesTutores([]);
      setMostrarDropdownTutor(false);
      return;
    }
    const q = tutorSearchText.trim();
    if (q.length === 0) { setOpcionesTutores([]); setMostrarDropdownTutor(false); return; }
    setBuscandoTutor(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.secretaria.listarTutores(getToken());
        const lista = (res.data || []).filter(t =>
          t.ci.toLowerCase().includes(q) || t.nombre.toLowerCase().includes(q) || t.apellido.toLowerCase().includes(q)
        );
        setOpcionesTutores(lista);
        setMostrarDropdownTutor(lista.length > 0);
      } catch { setOpcionesTutores([]); } finally { setBuscandoTutor(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [tutorSearchText, createModal]);

  // Reasignar tutor autocomplete
  useEffect(() => {
    if (!tutorModal) {
      setReasignarOpciones([]);
      setReasignarMostrarDropdown(false);
      return;
    }
    const q = reasignarSearchText.trim();
    if (q.length === 0 || reasignarTutorInfo) { setReasignarOpciones([]); setReasignarMostrarDropdown(false); return; }
    setReasignarBuscando(true);
    const timer = setTimeout(() => {
      const lista = (tutores || []).filter(t =>
        t.ci.toLowerCase().includes(q) || t.nombre.toLowerCase().includes(q) || t.apellido.toLowerCase().includes(q)
      );
      setReasignarOpciones(lista);
      setReasignarMostrarDropdown(lista.length > 0);
      setReasignarBuscando(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [reasignarSearchText, tutorModal, tutores, reasignarTutorInfo]);

  const guardarCrear = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.ci) {
      setErrors({ general: 'Seleccione una persona para el estudiante' });
      return;
    }
    const t = getToken();
    try {
      await api.secretaria.crearEstudiante(t, {
        ci: form.ci,
        citutor: form.citutor || null,
        idgestion: Number(form.idgestion),
      });
      setCreateModal(false);
      cargar(t);
    } catch (err) {
      const msg = err.message || err.error || 'Error al crear estudiante';
      setErrors({ general: msg });
    }
  };

  const abrirReasignar = (e) => {
    setTutorModal(e);
    const tutorActual = e.citutor || '';
    setReasignarSelectedTutor(tutorActual);
    if (tutorActual) {
      const info = tutores.find(t => t.ci === tutorActual);
      if (info) {
        setReasignarTutorInfo(info);
        setReasignarSearchText(`${info.nombre} ${info.apellido} — ${info.ci}`);
      }
    } else {
      setReasignarTutorInfo(null);
      setReasignarSearchText('');
    }
    setReasignarOpciones([]);
    setReasignarMostrarDropdown(false);
    setReasignarBuscando(false);
  };

  const abrirVer = (e) => {
    setViewEstudiante(e);
  };

  const guardarReasignar = async (e) => {
    e.preventDefault();
    try {
      await api.secretaria.asignarTutor(token, tutorModal.ci, reasignarSelectedTutor);
      setTutorModal(null);
      cargar(token);
    } catch (err) { alert(err.message || 'Error'); }
  };

  useEffect(() => {
    if (!createModal) {
      setPersonaInfo(null);
      setPersonaSearchText('');
      setTutorInfo(null);
      setTutorSearchText('');
      setErrors({});
      setPersonaError('');
      setTutorErrorField('');
    }
  }, [createModal]);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Estudiantes</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Listado completo de estudiantes registrados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-wrap" style={{ maxWidth: '100%', width: '100%' }}>
            <i className="fas fa-search"></i>
            <input placeholder="Buscar por CI, nombre, apellido o código..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}><i className="fas fa-hashtag" style={{ marginRight: 6 }}></i>Código</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-id-card" style={{ marginRight: 6 }}></i>CI</th>
                <th><i className="fas fa-user" style={{ marginRight: 6 }}></i>Nombre</th>
                <th><i className="fas fa-user" style={{ marginRight: 6 }}></i>Apellido</th>
                <th><i className="fas fa-venus-mars" style={{ marginRight: 6 }}></i>Sexo</th>
                <th><i className="fas fa-phone" style={{ marginRight: 6 }}></i>Teléfono</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-cog" style={{ marginRight: 6 }}></i>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <i className="fas fa-user-graduate"></i>
                      <p>No hay estudiantes registrados</p>
                      <span className="empty-sub">No se encontraron estudiantes registrados</span>
                    </div>
                  </td>
                </tr>
              ) : (
                estudiantes.map((e) => (
                  <tr key={e.ci}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {e.codestudiante}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {e.ci}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{e.nombre}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{e.apellido}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{mapValue('sexo', e.sexo)}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{e.telefono || '-'}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions" style={{ justifyContent: 'center' }}>
                        <button className="btn-sm btn-secondary" onClick={() => abrirVer(e)} title="Ver información completa">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-sm btn-secondary" onClick={() => abrirReasignar(e)} title="Cambiar tutor">
                          <i className="fas fa-user-tie"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-user-graduate"></i>
              </span>
              Nuevo Estudiante
            </h3>
            <form onSubmit={guardarCrear}>
              <div className="form-group">
                <label>Persona</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={personaSearchText}
                    onChange={(e) => { 
                      setPersonaSearchText(e.target.value); 
                      setPersonaInfo(null); 
                      setErrors({});
                      setPersonaError(e.target.value.trim() ? validarBusqueda(e.target.value) : '');
                    }}
                    onFocus={() => { if (opcionesPersonas.length > 0 && !personaInfo) setMostrarDropdownPersona(true); }}
                    onBlur={() => setTimeout(() => setMostrarDropdownPersona(false), 200)}
                    placeholder="Buscar por CI, nombre o apellido..."
                    required
                    autoComplete="off"
                    className={personaError ? 'input-error' : ''}
                  />
                  {buscandoPersona && <div style={{ fontSize: 13, marginTop: 4, color: '#888' }}>Buscando...</div>}
                  {personaInfo && (
                    <div style={{ fontSize: 13, marginTop: 4, color: '#27ae60' }}>
                      ✓ {personaInfo.nombre} {personaInfo.apellido} — CI: {personaInfo.ci}
                    </div>
                  )}
                  {mostrarDropdownPersona && opcionesPersonas.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {opcionesPersonas.map(p => (
                        <div
                          key={p.ci}
                          onMouseDown={() => {
                            setForm({ ...form, ci: p.ci });
                            setPersonaInfo(p);
                            setPersonaSearchText(`${p.nombre} ${p.apellido} — ${p.ci}`);
                            setMostrarDropdownPersona(false);
                            setOpcionesPersonas([]);
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
                {personaError && <span className="error-text">{personaError}</span>}
              </div>

              <div className="form-group">
                <label>Código Estudiante</label>
                <input
                  type="text"
                  value={codigoGenerado}
                  disabled
                  style={{ background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
                />
              </div>

              <div className="form-group">
                <label>Tutor</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={tutorSearchText}
                    onChange={(e) => { 
                      setTutorSearchText(e.target.value); 
                      setTutorInfo(null); 
                      setForm({ ...form, citutor: '' }); 
                      setErrors({});
                      setTutorErrorField('');
                    }}
                    onFocus={() => { if (opcionesTutores.length > 0 && !tutorInfo) setMostrarDropdownTutor(true); }}
                    onBlur={() => setTimeout(() => setMostrarDropdownTutor(false), 200)}
                    placeholder="Buscar tutor por CI, nombre o apellido..."
                    autoComplete="off"
                    className={tutorErrorField ? 'input-error' : ''}
                  />
                  {buscandoTutor && <div style={{ fontSize: 13, marginTop: 4, color: '#888' }}>Buscando...</div>}
                  {tutorInfo && (
                    <div style={{ fontSize: 13, marginTop: 4, color: '#27ae60' }}>
                      ✓ {tutorInfo.nombre} {tutorInfo.apellido} — CI: {tutorInfo.ci}
                    </div>
                  )}
                  {!tutorSearchText && !tutorInfo && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Opcional — dejar vacío si no tiene tutor</div>
                  )}
                  {mostrarDropdownTutor && opcionesTutores.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {opcionesTutores.map(t => (
                        <div
                          key={t.ci}
                          onMouseDown={() => {
                            setForm({ ...form, citutor: t.ci });
                            setTutorInfo(t);
                            setTutorSearchText(`${t.nombre} ${t.apellido} — ${t.ci}`);
                            setMostrarDropdownTutor(false);
                            setOpcionesTutores([]);
                          }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13, transition: 'background 0.1s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#1f2937' }}>{t.ci}</span>
                          {' '}
                          <span style={{ color: '#374151' }}>{t.nombre} {t.apellido}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Gestión</label>
                <input
                  type="text"
                  value={gestionActiva ? (gestionActiva.descripcion || `Gestión ${gestionActiva.idgestion}`) : 'Sin gestión activa'}
                  disabled
                  style={{ background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
                />
              </div>

              {errors.general && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}></i>
                  {errors.general}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-sm btn-secondary" onClick={() => setCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn-sm btn-primary" disabled={!form.ci}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tutorModal && (
        <div className="modal-overlay" onClick={() => setTutorModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-user-tie"></i>
              </span>
              Cambiar Tutor
            </h3>

            <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Estudiante</strong>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{tutorModal.nombre} {tutorModal.apellido}</span>
              <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>CI: {tutorModal.ci} &middot; Código: {tutorModal.codestudiante}</div>
            </div>

            <form onSubmit={guardarReasignar}>
              <div className="form-group">
                <label>Tutor</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={reasignarSearchText}
                    onChange={(e) => { setReasignarSearchText(e.target.value); setReasignarTutorInfo(null); setReasignarSelectedTutor(''); }}
                    onFocus={() => { if (reasignarOpciones.length > 0 && !reasignarTutorInfo) setReasignarMostrarDropdown(true); }}
                    onBlur={() => setTimeout(() => setReasignarMostrarDropdown(false), 200)}
                    placeholder="Buscar tutor por CI, nombre o apellido..."
                    required
                    autoComplete="off"
                  />
                  {reasignarBuscando && <div style={{ fontSize: 13, marginTop: 4, color: '#888' }}>Buscando...</div>}
                  {reasignarTutorInfo && (
                    <div style={{ fontSize: 13, marginTop: 4, color: '#27ae60' }}>
                      ✓ {reasignarTutorInfo.nombre} {reasignarTutorInfo.apellido} — CI: {reasignarTutorInfo.ci}
                    </div>
                  )}
                  {reasignarMostrarDropdown && reasignarOpciones.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, maxHeight: 220, overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {reasignarOpciones.map(t => (
                        <div
                          key={t.ci}
                          onMouseDown={() => {
                            setReasignarSelectedTutor(t.ci);
                            setReasignarTutorInfo(t);
                            setReasignarSearchText(`${t.nombre} ${t.apellido} — ${t.ci}`);
                            setReasignarMostrarDropdown(false);
                            setReasignarOpciones([]);
                          }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13, transition: 'background 0.1s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#1f2937' }}>{t.ci}</span>
                          {' '}
                          <span style={{ color: '#374151' }}>{t.nombre} {t.apellido}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-sm btn-secondary" onClick={() => setTutorModal(null)}>Cancelar</button>
                <button type="submit" className="btn-sm btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEstudiante && (
        <div className="modal-overlay" onClick={() => setViewEstudiante(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-user-graduate"></i>
              </span>
              Información del Estudiante
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Código Estudiante</strong>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{viewEstudiante.codestudiante}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>CI</strong>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{viewEstudiante.ci}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Nombre Completo</strong>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{viewEstudiante.nombre} {viewEstudiante.apellido}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Sexo</strong>
                <span style={{ fontSize: 15, color: '#111827' }}>{mapValue('sexo', viewEstudiante.sexo)}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Teléfono</strong>
                <span style={{ fontSize: 15, color: '#111827' }}>{viewEstudiante.telefono || '-'}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Correo</strong>
                <span style={{ fontSize: 15, color: '#111827' }}>{viewEstudiante.correo || '-'}</span>
              </div>
              <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                <strong style={{ color: '#5F9EA0', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Tutor</strong>
                <span style={{ fontSize: 15, color: '#111827' }}>{viewEstudiante.tutor_nombre ? `${viewEstudiante.tutor_nombre} ${viewEstudiante.tutor_apellido}` : 'Sin tutor'}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-sm btn-secondary" onClick={() => setViewEstudiante(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
