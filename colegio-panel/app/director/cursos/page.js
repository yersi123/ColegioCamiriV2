'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const COURSE_STRUCTURE = {
  1: { cursos: ['PreKinder', 'Kinder'], paralelos: ['A', 'B', 'C'] },
  2: { cursos: ['1ro', '2do', '3ro', '4to', '5to', '6to'], paralelos: ['A', 'B', 'C', 'D'] },
  3: { cursos: ['1ro', '2do', '3ro', '4to', '5to', '6to'], paralelos: ['A', 'B', 'C'] },
};

export default function CursosPage() {
  const [token, setToken] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [selectedNivel, setSelectedNivel] = useState(1);
  const [modal, setModal] = useState(null);
  const [editCurso, setEditCurso] = useState(null);
  const [createStep, setCreateStep] = useState({ curso: null, paralelo: null, capacidad: '' });
  const [editCapacidad, setEditCapacidad] = useState('');
  const [errors, setErrors] = useState({});
  const [creando, setCreando] = useState(false);
  const [capacidadError, setCapacidadError] = useState('');
  const [editCapError, setEditCapError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    Promise.all([
      api.niveles.listar(t),
      api.cursos.listar(t),
    ]).then(([resN, resC]) => {
      setNiveles(resN.data);
      setCursos(resC.data);
    });
  }, []);

  const nivelNombre = (id) => {
    const n = niveles.find(n => n.idnivel === Number(id));
    return n ? n.nombre : '';
  };

  const cursosFiltrados = cursos.filter(c => c.idnivel === Number(selectedNivel));
  const cantidadPorNivel = (id) => cursos.filter(c => c.idnivel === id).length;

  const structure = COURSE_STRUCTURE[Number(selectedNivel)] || { cursos: [], paralelos: [] };

  const validarCapacidad = (value) => {
    if (!value && value !== 0) return 'La capacidad es requerida';
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) return 'Debe ser un número entero';
    if (num < 1) return 'Mínimo 1 estudiante';
    if (num > 50) return 'Máximo 50 estudiantes por curso';
    return '';
  };

  const abrirCrear = () => {
    setCreateStep({ curso: null, paralelo: null, capacidad: '' });
    setModal('create');
    setErrors({});
    setCapacidadError('');
  };

  const abrirEditar = (c) => {
    setEditCurso(c);
    setEditCapacidad(String(c.capacidad_maxima));
    setModal('edit');
    setErrors({});
    setEditCapError('');
  };

  const crearCurso = async () => {
    const { curso, paralelo, capacidad } = createStep;
    if (!curso || !paralelo || !capacidad) return;
    const capErr = validarCapacidad(capacidad);
    if (capErr) { setCapacidadError(capErr); return; }
    const duplicado = cursosFiltrados.find(c => c.descripcion === curso && c.paralelo === paralelo);
    if (duplicado) {
      setErrors({ general: `Ya existe ${curso} Paralelo ${paralelo} en ${nivelNombre(selectedNivel)}` });
      return;
    }
    setCreando(true);
    setErrors({});
    try {
      await api.cursos.crear(token, {
        idnivel: Number(selectedNivel),
        descripcion: curso,
        capacidad_maxima: Number(capacidad),
        paralelo,
      });
      setModal(null);
      const res = await api.cursos.listar(token);
      setCursos(res.data);
    } catch (err) {
      const msg = err.message || err.error || 'Error';
      setErrors({ general: msg });
    } finally {
      setCreando(false);
    }
  };

  const guardarCapacidad = async () => {
    if (!editCapacidad || Number(editCapacidad) < 1) return;
    const capErr = validarCapacidad(editCapacidad);
    if (capErr) { setEditCapError(capErr); return; }
    setErrors({});
    try {
      await api.cursos.actualizar(token, editCurso.idcurso, { capacidad_maxima: Number(editCapacidad) });
      setModal(null);
      const res = await api.cursos.listar(token);
      setCursos(res.data);
    } catch (err) {
      const msg = err.message || err.error || 'Error';
      setErrors({ general: msg });
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-book"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Cursos</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Gestiona los cursos por nivel educativo</p>
            </div>
          </div>
          <button className="btn-sm btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus"></i> Nuevo
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1.5px solid #e5e7eb' }}>
          {niveles.map((n) => {
            const isActive = Number(selectedNivel) === n.idnivel;
            const count = cantidadPorNivel(n.idnivel);
            return (
              <div
                key={n.idnivel}
                onClick={() => { setSelectedNivel(n.idnivel); setErrors({}); }}
                style={{
                  flex: 1, padding: '14px 20px', textAlign: 'center', cursor: 'pointer',
                  borderBottom: `2.5px solid ${isActive ? '#5F9EA0' : 'transparent'}`,
                  color: isActive ? '#1f2937' : '#6b7280',
                  fontWeight: isActive ? 700 : 500, fontSize: 14,
                  transition: 'border-color 0.2s, color 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <i className="fas fa-layer-group" style={{ fontSize: 13, color: '#5F9EA0' }}></i>
                {n.nombre}
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 999, background: '#edf5f5', color: '#111827', fontSize: 12, fontWeight: 600 }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        <div className="card-header" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 12 }}>
              <i className="fas fa-layer-group"></i>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{nivelNombre(selectedNivel)}</h3>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th>Curso</th>
                <th style={{ textAlign: 'center' }}>Paralelo</th>
                <th style={{ textAlign: 'center' }}>Capacidad</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <i className="fas fa-book"></i>
                      <p>No hay cursos en {nivelNombre(selectedNivel)}</p>
                      <span className="empty-sub">Crea los cursos usando el botón "Nuevo"</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cursosFiltrados.map((c) => (
                  <tr key={c.idcurso}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {c.idcurso}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{c.descripcion}</div></td>
                    <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>{c.paralelo}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: '#edf5f5', color: '#111827' }}>{c.capacidad_maxima} cupos</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions" style={{ justifyContent: 'center' }}>
                        <button className="btn-sm btn-secondary" onClick={() => abrirEditar(c)} title="Editar capacidad">
                          <i className="fas fa-pencil-alt"></i>
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

      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-book"></i>
              </span>
              Nuevo Curso — {nivelNombre(selectedNivel)}
            </h3>

            {createStep.curso && createStep.paralelo && (
              <div style={{ padding: '8px 14px', background: '#edf5f5', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#5F9EA0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-check-circle"></i>
                {nivelNombre(selectedNivel)} &gt; {createStep.curso} &gt; Paralelo {createStep.paralelo}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#5F9EA0', color: '#fff', fontSize: 12, fontWeight: 700, marginRight: 8 }}>1</span>
                Selecciona el curso
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {structure.cursos.map((curso) => (
                  <div
                    key={curso}
                    onClick={() => setCreateStep({ ...createStep, curso, paralelo: null })}
                    style={{
                      padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                      background: createStep.curso === curso ? '#5F9EA0' : '#f3f4f6',
                      color: createStep.curso === curso ? '#fff' : '#374151',
                      border: createStep.curso === curso ? '2px solid #5F9EA0' : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (createStep.curso !== curso) { e.currentTarget.style.background = '#e6f4f5'; e.currentTarget.style.borderColor = '#5F9EA0'; } }}
                    onMouseLeave={(e) => { if (createStep.curso !== curso) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = 'transparent'; } }}
                  >
                    {curso}
                  </div>
                ))}
              </div>
            </div>

            {createStep.curso && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#5F9EA0', color: '#fff', fontSize: 12, fontWeight: 700, marginRight: 8 }}>2</span>
                  Selecciona el paralelo
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {structure.paralelos.map((p) => (
                    <div
                      key={p}
                      onClick={() => setCreateStep({ ...createStep, paralelo: p })}
                      style={{
                        padding: '8px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                        background: createStep.paralelo === p ? '#5F9EA0' : '#f3f4f6',
                        color: createStep.paralelo === p ? '#fff' : '#374151',
                        border: createStep.paralelo === p ? '2px solid #5F9EA0' : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { if (createStep.paralelo !== p) { e.currentTarget.style.background = '#e6f4f5'; e.currentTarget.style.borderColor = '#5F9EA0'; } }}
                      onMouseLeave={(e) => { if (createStep.paralelo !== p) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = 'transparent'; } }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {createStep.curso && createStep.paralelo && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#5F9EA0', color: '#fff', fontSize: 12, fontWeight: 700, marginRight: 8 }}>3</span>
                    Capacidad máxima de estudiantes
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={createStep.capacidad}
                    onChange={(e) => { 
                      setCreateStep({ ...createStep, capacidad: e.target.value });
                      setCapacidadError(e.target.value ? validarCapacidad(e.target.value) : '');
                    }}
                    placeholder="Ej: 30"
                    className={capacidadError ? 'input-error' : ''}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => e.target.style.borderColor = '#5F9EA0'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    required
                  />
                </div>

                {capacidadError && <span className="error-text">{capacidadError}</span>}

                {errors.general && (
                  <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                    {errors.general}
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-sm btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button
                    type="button"
                    className="btn-sm btn-primary"
                    onClick={crearCurso}
                    disabled={creando || !createStep.capacidad}
                  >
                    {creando ? 'Creando...' : 'Crear Curso'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal === 'edit' && editCurso && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-pencil-alt"></i>
              </span>
              Editar Capacidad
            </h3>

            <div style={{ padding: '12px 16px', background: '#edf5f5', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#5F9EA0', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nivel</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#111827' }}>{editCurso.nivel_nombre}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#5F9EA0', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paralelo</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#111827' }}>{editCurso.paralelo}</p>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 600, color: '#5F9EA0', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Curso</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#111827' }}>{editCurso.descripcion}</p>
              </div>
            </div>

            <div className="form-group">
              <label>Capacidad Máxima</label>
              <input
                type="number"
                min="1"
                max="50"
                value={editCapacidad}
                onChange={(e) => { 
                  setEditCapacidad(e.target.value); 
                  setErrors({});
                  setEditCapError(e.target.value ? validarCapacidad(e.target.value) : '');
                }}
                className={editCapError ? 'input-error' : ''}
                required
              />
            </div>

            {editCapError && <span className="error-text">{editCapError}</span>}

            {errors.general && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                {errors.general}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-sm btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="btn-sm btn-primary" onClick={guardarCapacidad}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
