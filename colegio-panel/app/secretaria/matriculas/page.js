'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function MatriculasPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [filtros, setFiltros] = useState({ idgestion: '', ciestudiante: '', estado: '', idnivel: '' });
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState('');

  // Modal principal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCursos, setCreateCursos] = useState([]);
  const [createBecas, setCreateBecas] = useState([]);
  const [createIdgestion, setCreateIdgestion] = useState('');
  const [createGestionDesc, setCreateGestionDesc] = useState('');
  const [createIdnivel, setCreateIdnivel] = useState('');
  const [createIdcurso, setCreateIdcurso] = useState('');
  const [createCodbeca, setCreateCodbeca] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createDeudas, setCreateDeudas] = useState(null);
  const [createIgnorarDeudas, setCreateIgnorarDeudas] = useState(false);

  // Estudiante seleccionado/creado
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [codigoEstudiante, setCodigoEstudiante] = useState('');

  // Sub-modal Estudiante
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentTab, setStudentTab] = useState('buscar');
  const [studentSearchText, setStudentSearchText] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [studentBuscando, setStudentBuscando] = useState(false);
  const [studentForm, setStudentForm] = useState({ ci: '', nombre: '', apellido: '', sexo: 'M', telefono: '', correo: '' });
  const [studentFormErrors, setStudentFormErrors] = useState({});
  const [studentCodigoAutogenerado, setStudentCodigoAutogenerado] = useState('');

  // Sub-modal Tutor
  const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [tutorTab, setTutorTab] = useState('buscar');
  const [tutorSearchText, setTutorSearchText] = useState('');
  const [tutorSearchResults, setTutorSearchResults] = useState([]);
  const [tutorBuscando, setTutorBuscando] = useState(false);
  const [tutorForm, setTutorForm] = useState({ ci: '', nombre: '', apellido: '', sexo: 'M', telefono: '', correo: '' });
  const [tutorFormErrors, setTutorFormErrors] = useState({});

  const studentDebounceRef = useRef(null);
  const tutorDebounceRef = useRef(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    api.niveles.listar(t).then((n) => setNiveles(n.data)).catch(() => {});
    api.gestiones.listar(t).then((g) => {
      const activa = g.data.find((gx) => gx.estado === '1');
      if (activa) {
        setFiltros((prev) => ({ ...prev, idgestion: String(activa.idgestion) }));
        setCreateIdgestion(String(activa.idgestion));
        setCreateGestionDesc(activa.descripcion);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !filtros.idgestion) return;
    cargar(token);
  }, [token, filtros]);

  useEffect(() => {
    if (!showCreateModal || !token) return;
    const params = {};
    if (createIdgestion) params.idgestion = createIdgestion;
    if (createIdnivel) params.nivel = createIdnivel;
    api.cursos.listar(token, params)
      .then((c) => setCreateCursos(c.data))
      .catch((e) => console.error('Error al cargar cursos:', e));
    api.becas.listar(token)
      .then((b) => setCreateBecas(b.data))
      .catch((e) => console.error('Error al cargar becas:', e));
  }, [showCreateModal, token, createIdgestion, createIdnivel]);

  useEffect(() => {
    if (!showCreateModal || !token) return;
    api.secretaria.nextCodigoEstudiante(token).then((r) => {
      setStudentCodigoAutogenerado(r.data?.codestudiante || 'EST-00001');
    }).catch(() => setStudentCodigoAutogenerado('EST-00001'));
  }, [showCreateModal, token]);

  const cargar = async (t) => {
    const t2 = t || token;
    if (!t2) return;
    const params = {};
    if (filtros.idgestion) params.idgestion = filtros.idgestion;
    if (filtros.ciestudiante) params.ciestudiante = filtros.ciestudiante;
    if (filtros.estado) params.estado = filtros.estado;
    try {
      const res = await api.matriculacion.listar(t2, params);
      setMatriculas(res.data);
    } catch (e) { console.error(e); }
  };

  const validarCI = (v) => { if (!v.trim()) return 'CI requerido'; if (!/^\d+$/.test(v)) return 'Solo números'; if (v.length < 5 || v.length > 10) return 'Debe tener 5-10 dígitos'; return ''; };
  const validarNombre = (v) => { if (!v.trim()) return 'Requerido'; if (v.trim().length < 3) return 'Mínimo 3 caracteres'; return ''; };
  const validarApellido = (v) => { if (!v.trim()) return 'Requerido'; if (v.trim().length < 3) return 'Mínimo 3 caracteres'; return ''; };
  const validarTelefono = (v) => { if (v && !/^\d{8}$/.test(v)) return 'Debe tener 8 dígitos'; return ''; };
  const validarCorreo = (v) => { if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo inválido'; return ''; };

  const openCreateModal = () => {
    setEstudianteSeleccionado(null);
    setCodigoEstudiante('');
    setTutorSeleccionado(null);
    setCreateIdnivel('');
    setCreateIdcurso('');
    setCreateCodbeca('');
    setCreateError('');
    setCreateDeudas(null);
    setCreateIgnorarDeudas(false);
    setCreateLoading(false);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const createCursosFiltrados = createCursos.filter((c) => !createIdnivel || c.idnivel === Number(createIdnivel));

  useEffect(() => {
    setCreateIdcurso('');
  }, [createIdnivel]);

  const limpiarEstudiante = () => {
    setEstudianteSeleccionado(null);
    setCodigoEstudiante('');
    setCreateIdnivel('');
    setCreateIdcurso('');
  };

  const limpiarTutor = () => {
    setTutorSeleccionado(null);
  };

  // --- Student modal handlers ---
  const abrirStudentModal = () => {
    setStudentTab('buscar');
    setStudentSearchText('');
    setStudentSearchResults([]);
    setStudentForm({ ci: '', nombre: '', apellido: '', sexo: 'M', telefono: '', correo: '' });
    setStudentFormErrors({});
    setShowStudentModal(true);
  };

  const studentBuscarPersonas = (search) => {
    setStudentSearchText(search);
    if (studentDebounceRef.current) clearTimeout(studentDebounceRef.current);
    if (search.trim().length < 2) { setStudentSearchResults([]); return; }
    studentDebounceRef.current = setTimeout(async () => {
      setStudentBuscando(true);
      try {
        const res = await api.personas.listar(token, { search, limit: 100 });
        setStudentSearchResults(res.data?.data || []);
      } catch { setStudentSearchResults([]); }
      setStudentBuscando(false);
    }, 300);
  };

  const seleccionarEstudiante = async (persona) => {
    // Verificar deudas
    setCreateDeudas(null);
    setCreateIgnorarDeudas(false);
    try {
      const res = await api.matriculacion.verificarDeudas(token, persona.ci, createIdgestion);
      if (res.data && res.data.total > 0) {
        setCreateDeudas(res.data);
      }
    } catch { /* continue */ }

    // Obtener codigo estudiante si ya existe
    try {
      const estRes = await api.secretaria.listarEstudiantes(token, { search: persona.ci });
      const found = (estRes.data || []).find(e => e.ci === persona.ci);
      setCodigoEstudiante(found?.codestudiante || studentCodigoAutogenerado);
    } catch {
      setCodigoEstudiante(studentCodigoAutogenerado);
    }

    setEstudianteSeleccionado(persona);
    setShowStudentModal(false);
  };

  const guardarNuevoEstudiante = async () => {
    const errs = {};
    const ce = validarCI(studentForm.ci); if (ce) errs.ci = ce;
    const ne = validarNombre(studentForm.nombre); if (ne) errs.nombre = ne;
    const ae = validarApellido(studentForm.apellido); if (ae) errs.apellido = ae;
    const te = validarTelefono(studentForm.telefono); if (te) errs.telefono = te;
    const coe = validarCorreo(studentForm.correo); if (coe) errs.correo = coe;
    setStudentFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const existente = await api.personas.obtener(token, studentForm.ci);
      if (existente.success && existente.data) {
        setStudentFormErrors({ ci: 'Este CI ya existe. Use la pestaña Buscar.' });
        return;
      }
    } catch (e) {
      if (e.status !== 404) {
        setStudentFormErrors({ ci: 'Error al verificar CI' });
        return;
      }
    }

    setEstudianteSeleccionado(studentForm);
    setCodigoEstudiante(studentCodigoAutogenerado);
    setShowStudentModal(false);
  };

  // --- Tutor modal handlers ---
  const abrirTutorModal = () => {
    setTutorTab('buscar');
    setTutorSearchText('');
    setTutorSearchResults([]);
    setTutorForm({ ci: '', nombre: '', apellido: '', sexo: 'M', telefono: '', correo: '' });
    setTutorFormErrors({});
    setShowTutorModal(true);
  };

  const tutorBuscarTutores = (search) => {
    setTutorSearchText(search);
    if (tutorDebounceRef.current) clearTimeout(tutorDebounceRef.current);
    if (search.trim().length < 2) { setTutorSearchResults([]); return; }
    tutorDebounceRef.current = setTimeout(async () => {
      setTutorBuscando(true);
      try {
        const res = await api.personas.listar(token, { search, limit: 100 });
        setTutorSearchResults(res.data?.data || []);
      } catch { setTutorSearchResults([]); }
      setTutorBuscando(false);
    }, 300);
  };

  const seleccionarTutor = (tutor) => {
    setTutorSeleccionado(tutor);
    setShowTutorModal(false);
  };

  const guardarNuevoTutor = async () => {
    const errs = {};
    const ce = validarCI(tutorForm.ci); if (ce) errs.ci = ce;
    const ne = validarNombre(tutorForm.nombre); if (ne) errs.nombre = ne;
    const ae = validarApellido(tutorForm.apellido); if (ae) errs.apellido = ae;
    const te = validarTelefono(tutorForm.telefono); if (te) errs.telefono = te;
    if (!tutorForm.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutorForm.correo)) errs.correo = 'Correo obligatorio para crear tutor';
    setTutorFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const existente = await api.personas.obtener(token, tutorForm.ci);
      if (existente.success && existente.data) {
        setTutorFormErrors({ ci: 'Este CI ya existe. Use la pestaña Buscar.' });
        return;
      }
    } catch (e) {
      if (e.status !== 404) {
        setTutorFormErrors({ ci: 'Error al verificar CI' });
        return;
      }
    }

    setTutorSeleccionado(tutorForm);
    setShowTutorModal(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!estudianteSeleccionado) { setCreateError('Seleccione o registre un estudiante'); return; }
    if (!createIdgestion) { setCreateError('No hay gestión activa'); return; }
    if (!createIdcurso) { setCreateError('Seleccione un curso'); return; }

    setCreateLoading(true);
    try {
      if (createDeudas && !createIgnorarDeudas) {
        setCreateError('Debe marcar "Matricular con deuda pendiente" para continuar');
        setCreateLoading(false);
        return;
      }
      const data = {
        ci: estudianteSeleccionado.ci,
        nombre: estudianteSeleccionado.nombre,
        apellido: estudianteSeleccionado.apellido,
        sexo: estudianteSeleccionado.sexo || 'M',
        telefono: estudianteSeleccionado.telefono || undefined,
        correo: estudianteSeleccionado.correo || undefined,
        idgestion: Number(createIdgestion),
        idcurso: Number(createIdcurso),
        codbeca: createCodbeca ? Number(createCodbeca) : null,
        ignorarDeudas: !!createIgnorarDeudas,
      };
      if (tutorSeleccionado) {
        data.tutor = {
          ci: tutorSeleccionado.ci,
          nombre: tutorSeleccionado.nombre,
          apellido: tutorSeleccionado.apellido,
          sexo: tutorSeleccionado.sexo || 'M',
          telefono: tutorSeleccionado.telefono || undefined,
          correo: tutorSeleccionado.correo,
        };
      }
      await api.request('POST', '/matriculacion/registro-completo', token, data);
      closeCreateModal();
      cargar(token);
    } catch (err) {
      setCreateError(err.message || err.error || 'Error al registrar matrícula');
    } finally {
      setCreateLoading(false);
    }
  };

  const matriculasFiltradas = matriculas.filter((m) => {
    if (filtros.idnivel) {
      return m.nivel_nombre === niveles.find((n) => n.idnivel === Number(filtros.idnivel))?.nombre;
    }
    return true;
  });

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'A': return { background: '#d1fae5', color: '#065f46' };
      case 'R': return { background: '#fef3c7', color: '#92400e' };
      case 'X': return { background: '#fee2e2', color: '#991b1b' };
      default: return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.matriculacion.cambiarEstado(token, id, estado);
      const res = await api.matriculacion.listar(token);
      setMatriculas(res.data);
    } catch (err) {
      const msg = err.message || err.error || 'Error';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-file-signature"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Matrículas</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Gestiona las matrículas de los estudiantes</p>
            </div>
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5F9EA0, #3D7B7D)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(95,158,160,0.3)', transition: 'all 0.15s ease' }}
            onClick={openCreateModal}>
            <i className="fas fa-plus-circle" style={{ fontSize: 18 }}></i> Nueva Matrícula
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="card">
        <div className="toolbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginBottom: 0 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nivel</label>
            <select value={filtros.idnivel} onChange={(e) => setFiltros({ ...filtros, idnivel: e.target.value })}>
              <option value="">Todos</option>
              {niveles.map((n) => (
                <option key={n.idnivel} value={n.idnivel}>{n.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>CI Estudiante</label>
            <div className="search-wrap" style={{ margin: 0, width: '100%', padding: '10px 14px' }}>
              <i className="fas fa-search" style={{ fontSize: 15 }}></i>
              <input placeholder="Buscar por CI..." value={filtros.ciestudiante} onChange={(e) => setFiltros({ ...filtros, ciestudiante: e.target.value })} style={{ width: '100%', fontSize: 14 }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Estado</label>
            <select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
              <option value="">Todos</option>
              <option value="R">Registrado</option>
              <option value="A">Activo</option>
              <option value="X">Anulado</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>#</th>
                <th>Estudiante</th>
                <th style={{ textAlign: 'center' }}>CI</th>
                <th>Curso</th>
                <th style={{ textAlign: 'center' }}>Nivel</th>
                <th style={{ textAlign: 'center' }}>Fecha</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matriculasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <i className="fas fa-file-signature"></i>
                      <p>No hay matrículas registradas</p>
                      <span className="empty-sub">Usa los filtros para refinar la búsqueda</span>
                    </div>
                  </td>
                </tr>
              ) : (
                matriculasFiltradas.map((m) => (
                  <tr key={m.idmatriculacion}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {m.idmatriculacion}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{m.estudiante_nombre}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {m.estudiante_ci}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{m.curso_descripcion}</div></td>
                    <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>{m.nivel_nombre}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{formatFecha(m.fecharegis)}</span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span className="badge" style={getEstadoStyle(m.estado)}>{mapValue('estado', m.estado)}</span>
                      {m.estado === 'R' && <>
                        <button className="btn-sm" style={{ marginLeft: 4, padding: '3px 7px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => cambiarEstado(m.idmatriculacion, 'A')} title="Activar">
                          <i className="fas fa-check"></i>
                        </button>
                        <button className="btn-sm" style={{ marginLeft: 2, padding: '3px 7px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => cambiarEstado(m.idmatriculacion, 'X')} title="Anular">
                          <i className="fas fa-times"></i>
                        </button>
                      </>}
                      {m.estado === 'A' && <>
                        <button className="btn-sm" style={{ marginLeft: 4, padding: '3px 7px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => cambiarEstado(m.idmatriculacion, 'X')} title="Anular">
                          <i className="fas fa-times"></i>
                        </button>
                      </>}
                      {m.estado === 'X' && <>
                        <button className="btn-sm" style={{ marginLeft: 4, padding: '3px 7px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => cambiarEstado(m.idmatriculacion, 'R')} title="Restaurar">
                          <i className="fas fa-undo"></i>
                        </button>
                      </>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions" style={{ justifyContent: 'center' }}>
                        <button className="btn-sm btn-secondary" onClick={() => setDetalle(m)} title="Ver detalle">
                          <i className="fas fa-eye"></i>
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

      {/* MODAL PRINCIPAL: Nueva Matrícula */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #5F9EA0, #3D7B7D)',
              borderRadius: '8px 8px 0 0',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Nueva Matrícula</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>Registrar estudiante, tutor y matrícula en un solo paso</p>
                </div>
                <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeCreateModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {createError && <div className="error-msg" style={{ marginBottom: 16 }}>{createError}</div>}

              {createDeudas && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: 16 }}></i>
                    <strong>Deuda pendiente</strong>
                  </div>
                  <p style={{ margin: '0 0 8px 0' }}>
                    El estudiante tiene <strong>{createDeudas.total} mensualidad(es) pendiente(s)</strong> de gestiones anteriores por un total de <strong>Bs {Number(createDeudas.monto_total).toFixed(2)}</strong>.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={createIgnorarDeudas} onChange={(e) => setCreateIgnorarDeudas(e.target.checked)} />
                    Matricular con deuda pendiente
                  </label>
                </div>
              )}

              <form onSubmit={handleCreateSubmit}>
                {/* SECCIÓN 1: ESTUDIANTE */}
                <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#5F9EA0', color: '#fff', fontSize: 13 }}>
                      <i className="fas fa-user-graduate"></i>
                    </span>
                    <strong style={{ fontSize: 14, color: '#1f2937' }}>ESTUDIANTE</strong>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>— Si ya existe como persona, búscalo por CI. Si no, créalo desde aquí.</span>
                  </div>

                  {estudianteSeleccionado ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, padding: '10px 14px', background: '#edf5f5', borderRadius: 8, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}</span>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>CI: {estudianteSeleccionado.ci}</span>
                          {codigoEstudiante && <span className="badge" style={{ background: '#5F9EA0', color: '#fff', fontSize: 11 }}>{codigoEstudiante}</span>}
                        </div>
                      </div>
                      <button type="button" className="btn-sm btn-secondary" onClick={limpiarEstudiante} title="Cambiar estudiante">
                        <i className="fas fa-redo"></i>
                      </button>
                    </div>
                  ) : (
                    <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 16px', borderRadius: 8, border: '2px dashed #d1d5db', background: '#fff', color: '#5F9EA0', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                      onClick={abrirStudentModal}>
                      <i className="fas fa-plus-circle" style={{ fontSize: 18 }}></i>
                      Buscar o Registrar Estudiante
                      <i className="fas fa-chevron-right" style={{ fontSize: 12, opacity: 0.5 }}></i>
                    </button>
                  )}
                </div>

                {/* SECCIÓN 2: TUTOR (opcional) */}
                <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#8b5cf6', color: '#fff', fontSize: 13 }}>
                      <i className="fas fa-user-tie"></i>
                    </span>
                    <strong style={{ fontSize: 14, color: '#1f2937' }}>TUTOR</strong>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>— Opcional. Si el tutor ya existe, búscalo. Si no, créalo y se generará su cuenta.</span>
                  </div>

                  {tutorSeleccionado ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, padding: '10px 14px', background: '#f3e8ff', borderRadius: 8, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{tutorSeleccionado.nombre} {tutorSeleccionado.apellido}</span>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>CI: {tutorSeleccionado.ci}</span>
                          {tutorSeleccionado.correo && <span style={{ fontSize: 12, color: '#7c3aed' }}>📧 {tutorSeleccionado.correo}</span>}
                        </div>
                      </div>
                      <button type="button" className="btn-sm btn-secondary" onClick={limpiarTutor} title="Cambiar tutor">
                        <i className="fas fa-redo"></i>
                      </button>
                    </div>
                  ) : (
                    <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, border: '2px dashed #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
                      onClick={abrirTutorModal}>
                      <i className="fas fa-plus-circle" style={{ fontSize: 16 }}></i>
                      Agregar Tutor (opcional)
                    </button>
                  )}
                </div>

                {/* SECCIÓN 3: MATRÍCULA */}
                <div style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: 13 }}>
                      <i className="fas fa-book"></i>
                    </span>
                    <strong style={{ fontSize: 14, color: '#1f2937' }}>MATRÍCULA</strong>
                  </div>

                  <div className="form-group">
                    <label>Gestión</label>
                    <div style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{createGestionDesc || 'Cargando...'}</span>
                      <span className="badge" style={{ background: '#d1fae5', color: '#065f46', fontSize: 11 }}>Activa</span>
                    </div>
                  </div>

                  {estudianteSeleccionado && (
                    <>
                      <div className="form-group">
                        <label>Nivel</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {niveles.map((n) => (
                            <button
                              key={n.idnivel}
                              type="button"
                              onClick={() => setCreateIdnivel(n.idnivel)}
                              style={{
                                padding: '8px 18px',
                                borderRadius: '999px',
                                border: `2px solid ${createIdnivel === n.idnivel ? '#5F9EA0' : '#e5e7eb'}`,
                                background: createIdnivel === n.idnivel ? '#edf5f5' : '#fff',
                                color: createIdnivel === n.idnivel ? '#3D7B7D' : '#374151',
                                fontWeight: createIdnivel === n.idnivel ? 700 : 500,
                                fontSize: 14,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {n.nombre}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Curso</label>
                        {!createIdnivel ? (
                          <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Seleccione un nivel primero</p>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {createCursosFiltrados.map((c) => {
                              const inscritos = c.inscritos || 0;
                              const capacidad = c.capacidad_maxima || 0;
                              const disponible = inscritos < capacidad;
                              return (
                                <button
                                  key={c.idcurso}
                                  type="button"
                                  onClick={() => disponible && setCreateIdcurso(c.idcurso)}
                                  disabled={!disponible}
                                  style={{
                                    padding: '10px 16px',
                                    borderRadius: 8,
                                    border: `2px solid ${createIdcurso === c.idcurso ? '#5F9EA0' : !disponible ? '#fee2e2' : '#e5e7eb'}`,
                                    background: createIdcurso === c.idcurso ? '#edf5f5' : !disponible ? '#fef2f2' : '#fff',
                                    color: createIdcurso === c.idcurso ? '#3D7B7D' : !disponible ? '#dc2626' : '#374151',
                                    fontWeight: createIdcurso === c.idcurso ? 700 : 500,
                                    fontSize: 13,
                                    cursor: disponible ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {c.descripcion} {c.paralelo}
                                  <span style={{ display: 'block', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                                    {inscritos}/{capacidad} {disponible ? '✅' : '❌'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Beca <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                    <select value={createCodbeca} onChange={(e) => setCreateCodbeca(e.target.value)}>
                      <option value="">Sin beca</option>
                      {createBecas.map((b) => (
                        <option key={b.codbeca} value={b.codbeca}>
                          {b.nombrebeca} ({b.porcentaje}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: 24 }}>
                  <button type="button" className="btn-sm btn-secondary" onClick={closeCreateModal}>Cancelar</button>
                  <button type="submit" className="btn-sm btn-primary" disabled={createLoading || !estudianteSeleccionado || !createIdcurso}>
                    {createLoading ? 'Registrando...' : '✓ Registrar Matrícula'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL ESTUDIANTE */}
      {showStudentModal && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #5F9EA0, #3D7B7D)',
              borderRadius: '8px 8px 0 0',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Registrar Estudiante</h3>
                <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowStudentModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              <button style={{ flex: 1, padding: '10px', border: 'none', background: studentTab === 'buscar' ? '#fff' : '#f9fafb', color: studentTab === 'buscar' ? '#5F9EA0' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderBottom: studentTab === 'buscar' ? '2px solid #5F9EA0' : '2px solid transparent' }}
                onClick={() => setStudentTab('buscar')}>
                <i className="fas fa-search" style={{ marginRight: 6 }}></i> Buscar
              </button>
              <button style={{ flex: 1, padding: '10px', border: 'none', background: studentTab === 'nuevo' ? '#fff' : '#f9fafb', color: studentTab === 'nuevo' ? '#5F9EA0' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderBottom: studentTab === 'nuevo' ? '2px solid #5F9EA0' : '2px solid transparent' }}
                onClick={() => setStudentTab('nuevo')}>
                <i className="fas fa-plus-circle" style={{ marginRight: 6 }}></i> Nuevo
              </button>
            </div>

            <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>
              {studentTab === 'buscar' && (
                <div>
                  <div className="form-group">
                    <label>Buscar por CI, nombre o apellido</label>
                    <input
                      value={studentSearchText}
                      onChange={(e) => studentBuscarPersonas(e.target.value)}
                      placeholder="Escriba al menos 2 caracteres..."
                      autoFocus
                    />
                  </div>
                  {studentBuscando && <p style={{ fontSize: 13, color: '#9ca3af' }}>Buscando...</p>}
                  {studentSearchResults.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {studentSearchResults.map((p) => (
                        <div key={p.ci} onClick={() => seleccionarEstudiante(p)}
                          style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#edf5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#5F9EA0', fontWeight: 700 }}>
                            {p.nombre?.[0]}{p.apellido?.[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.nombre} {p.apellido}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>CI: {p.ci}{p.correo ? ` — ${p.correo}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {studentSearchText.length >= 2 && studentSearchResults.length === 0 && !studentBuscando && (
                    <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                      <i className="fas fa-search" style={{ display: 'block', fontSize: 24, marginBottom: 8, opacity: 0.5 }}></i>
                      No se encontraron personas. Use la pestaña "Nuevo" para registrar.
                    </p>
                  )}
                </div>
              )}

              {studentTab === 'nuevo' && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-info-circle"></i>
                    Complete los datos del nuevo estudiante. Código auto-generado: <strong>{studentCodigoAutogenerado}</strong>
                  </div>
                  <div className="form-group">
                    <label>CI</label>
                    <input className={studentFormErrors.ci ? 'input-error' : ''} value={studentForm.ci}
                      onChange={(e) => { setStudentForm({ ...studentForm, ci: e.target.value.replace(/\D/g, '') }); setStudentFormErrors({}); }}
                      maxLength={10} placeholder="Cédula de identidad (5-10 dígitos)" />
                    {studentFormErrors.ci && <span className="error-text">{studentFormErrors.ci}</span>}
                  </div>
                  <div className="form-group">
                    <label>Nombre</label>
                    <input className={studentFormErrors.nombre ? 'input-error' : ''} value={studentForm.nombre}
                      onChange={(e) => { setStudentForm({ ...studentForm, nombre: e.target.value }); setStudentFormErrors({}); }}
                      maxLength={100} placeholder="Nombre" />
                    {studentFormErrors.nombre && <span className="error-text">{studentFormErrors.nombre}</span>}
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input className={studentFormErrors.apellido ? 'input-error' : ''} value={studentForm.apellido}
                      onChange={(e) => { setStudentForm({ ...studentForm, apellido: e.target.value }); setStudentFormErrors({}); }}
                      maxLength={100} placeholder="Apellido" />
                    {studentFormErrors.apellido && <span className="error-text">{studentFormErrors.apellido}</span>}
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select value={studentForm.sexo} onChange={(e) => setStudentForm({ ...studentForm, sexo: e.target.value })}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Teléfono <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                    <input className={studentFormErrors.telefono ? 'input-error' : ''} value={studentForm.telefono}
                      onChange={(e) => { setStudentForm({ ...studentForm, telefono: e.target.value.replace(/\D/g, '') }); setStudentFormErrors({}); }}
                      maxLength={8} placeholder="8 dígitos" />
                    {studentFormErrors.telefono && <span className="error-text">{studentFormErrors.telefono}</span>}
                  </div>
                  <div className="form-group">
                    <label>Correo <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                    <input className={studentFormErrors.correo ? 'input-error' : ''} value={studentForm.correo}
                      onChange={(e) => { setStudentForm({ ...studentForm, correo: e.target.value }); setStudentFormErrors({}); }}
                      placeholder="correo@ejemplo.com" />
                    {studentFormErrors.correo && <span className="error-text">{studentFormErrors.correo}</span>}
                  </div>
                  <div className="modal-actions" style={{ marginTop: 12 }}>
                    <button type="button" className="btn-sm btn-secondary" onClick={() => setShowStudentModal(false)}>Cancelar</button>
                    <button type="button" className="btn-sm btn-primary" onClick={guardarNuevoEstudiante}>
                      <i className="fas fa-check"></i> Guardar y Seleccionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL TUTOR */}
      {showTutorModal && (
        <div className="modal-overlay" onClick={() => setShowTutorModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '8px 8px 0 0',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Registrar Tutor</h3>
                <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowTutorModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              <button style={{ flex: 1, padding: '10px', border: 'none', background: tutorTab === 'buscar' ? '#fff' : '#f9fafb', color: tutorTab === 'buscar' ? '#7c3aed' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderBottom: tutorTab === 'buscar' ? '2px solid #7c3aed' : '2px solid transparent' }}
                onClick={() => setTutorTab('buscar')}>
                <i className="fas fa-search" style={{ marginRight: 6 }}></i> Buscar
              </button>
              <button style={{ flex: 1, padding: '10px', border: 'none', background: tutorTab === 'nuevo' ? '#fff' : '#f9fafb', color: tutorTab === 'nuevo' ? '#7c3aed' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderBottom: tutorTab === 'nuevo' ? '2px solid #7c3aed' : '2px solid transparent' }}
                onClick={() => setTutorTab('nuevo')}>
                <i className="fas fa-plus-circle" style={{ marginRight: 6 }}></i> Nuevo
              </button>
            </div>

            <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>
              {tutorTab === 'buscar' && (
                <div>
                  <div className="form-group">
                    <label>Buscar tutor por CI, nombre o apellido</label>
                    <input
                      value={tutorSearchText}
                      onChange={(e) => tutorBuscarTutores(e.target.value)}
                      placeholder="Escriba al menos 2 caracteres..."
                      autoFocus
                    />
                  </div>
                  {tutorBuscando && <p style={{ fontSize: 13, color: '#9ca3af' }}>Buscando...</p>}
                  {tutorSearchResults.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {tutorSearchResults.map((t) => (
                          <div key={t.ci} onClick={() => seleccionarTutor(t)}
                          style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>
                            {t.nombre?.[0]}{t.apellido?.[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{t.nombre} {t.apellido}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>CI: {t.ci}{t.correo ? ` — ${t.correo}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {tutorSearchText.length >= 2 && tutorSearchResults.length === 0 && !tutorBuscando && (
                    <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20 }}>
                      <i className="fas fa-search" style={{ display: 'block', fontSize: 24, marginBottom: 8, opacity: 0.5 }}></i>
                      No se encontraron tutores. Use la pestaña "Nuevo" para registrar.
                    </p>
                  )}
                </div>
              )}

              {tutorTab === 'nuevo' && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-info-circle"></i>
                    El correo es obligatorio — será usado como nombre de usuario del tutor. Contraseña: su CI.
                  </div>
                  <div className="form-group">
                    <label>CI</label>
                    <input className={tutorFormErrors.ci ? 'input-error' : ''} value={tutorForm.ci}
                      onChange={(e) => { setTutorForm({ ...tutorForm, ci: e.target.value.replace(/\D/g, '') }); setTutorFormErrors({}); }}
                      maxLength={10} placeholder="Cédula de identidad" />
                    {tutorFormErrors.ci && <span className="error-text">{tutorFormErrors.ci}</span>}
                  </div>
                  <div className="form-group">
                    <label>Nombre</label>
                    <input className={tutorFormErrors.nombre ? 'input-error' : ''} value={tutorForm.nombre}
                      onChange={(e) => { setTutorForm({ ...tutorForm, nombre: e.target.value }); setTutorFormErrors({}); }}
                      maxLength={100} placeholder="Nombre" />
                    {tutorFormErrors.nombre && <span className="error-text">{tutorFormErrors.nombre}</span>}
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input className={tutorFormErrors.apellido ? 'input-error' : ''} value={tutorForm.apellido}
                      onChange={(e) => { setTutorForm({ ...tutorForm, apellido: e.target.value }); setTutorFormErrors({}); }}
                      maxLength={100} placeholder="Apellido" />
                    {tutorFormErrors.apellido && <span className="error-text">{tutorFormErrors.apellido}</span>}
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select value={tutorForm.sexo} onChange={(e) => setTutorForm({ ...tutorForm, sexo: e.target.value })}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Teléfono <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                    <input className={tutorFormErrors.telefono ? 'input-error' : ''} value={tutorForm.telefono}
                      onChange={(e) => { setTutorForm({ ...tutorForm, telefono: e.target.value.replace(/\D/g, '') }); setTutorFormErrors({}); }}
                      maxLength={8} placeholder="8 dígitos" />
                    {tutorFormErrors.telefono && <span className="error-text">{tutorFormErrors.telefono}</span>}
                  </div>
                  <div className="form-group">
                    <label>Correo <strong style={{ color: '#dc2626' }}>*</strong></label>
                    <input className={tutorFormErrors.correo ? 'input-error' : ''} value={tutorForm.correo}
                      onChange={(e) => { setTutorForm({ ...tutorForm, correo: e.target.value }); setTutorFormErrors({}); }}
                      placeholder="correo@ejemplo.com (obligatorio)" />
                    {tutorFormErrors.correo && <span className="error-text">{tutorFormErrors.correo}</span>}
                  </div>

                  {/* Vista previa cuenta tutor */}
                  {tutorForm.correo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutorForm.correo) && tutorForm.ci && (
                    <div style={{ padding: '12px 14px', background: '#e8f5e9', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                      <strong>Asignación automática de cuenta:</strong><br />
                      Usuario: <strong>{tutorForm.correo}</strong><br />
                      Contraseña: <strong>{tutorForm.ci}</strong> (su CI)
                    </div>
                  )}

                  <div className="modal-actions" style={{ marginTop: 12 }}>
                    <button type="button" className="btn-sm btn-secondary" onClick={() => setShowTutorModal(false)}>Cancelar</button>
                    <button type="button" className="btn-sm btn-primary" onClick={guardarNuevoTutor}>
                      <i className="fas fa-check"></i> Guardar y Seleccionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #5F9EA0, #3D7B7D)',
              borderRadius: '8px 8px 0 0',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Detalle de Matrícula</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>#{detalle.idmatriculacion}</p>
                </div>
                <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetalle(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Estudiante', value: detalle.estudiante_nombre, icon: 'fa-user' },
                  { label: 'CI', value: detalle.estudiante_ci, icon: 'fa-id-card' },
                  { label: 'Curso', value: detalle.curso_descripcion, icon: 'fa-book' },
                  { label: 'Nivel', value: detalle.nivel_nombre, icon: 'fa-layer-group' },
                  { label: 'Gestión', value: detalle.gestion_nombre || '-', icon: 'fa-calendar' },
                  { label: 'Fecha Registro', value: formatFecha(detalle.fecharegis), icon: 'fa-calendar-day' },
                  { label: 'Estado', value: mapValue('estado', detalle.estado), icon: 'fa-flag' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <i className={`fas ${f.icon}`} style={{ color: '#5F9EA0', fontSize: 11 }}></i>
                      <strong style={{ color: '#5F9EA0', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</strong>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button className="btn-sm btn-secondary" onClick={() => setDetalle(null)}>Cerrar</button>
                <button className="btn-sm btn-primary" onClick={() => { setDetalle(null); router.push(`/secretaria/matriculas/${detalle.idmatriculacion}`); }}>
                  <i className="fas fa-external-link-alt"></i> Ir al detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
