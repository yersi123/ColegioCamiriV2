'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const emptyForm = { fechaapertura: '', fechacierre: '', cantidadmen: '', descripcion: '' };

export default function GestionPage() {
  const [token, setToken] = useState(null);
  const [gestiones, setGestiones] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [precios, setPrecios] = useState({});
  const [guardando, setGuardando] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [errorCarga, setErrorCarga] = useState(null);

  const gestionActiva = gestiones.find(g => g.estado === '1') || null;
  const esGestionEditadaActiva = modal === 'edit' && gestionActiva && editId === gestionActiva.idgestion;
  const gestionesCerradas = gestiones.filter(g => g.estado !== '1');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) { cargarGestiones(t); cargarNiveles(t); }
  }, []);

  useEffect(() => {
    if (!token || !gestionActiva) return;
    api.gestiones.obtener(token, gestionActiva.idgestion).then((res) => {
      const d = res.data.detalles || [];
      setDetalles(d);
      const map = {};
      d.forEach((det) => { map[det.idnivel] = det.monto; });
      setPrecios(map);
    }).catch(() => {});
  }, [token, gestionActiva?.idgestion]);

  const cargarGestiones = async (t) => {
    try {
      setErrorCarga(null);
      const res = await api.gestiones.listar(t || token);
      setGestiones(res.data);
    } catch (e) {
      console.error(e);
      setErrorCarga(e.message || 'Error al cargar gestiones');
    }
  };

  const cargarNiveles = async (t) => {
    try {
      setErrorCarga(null);
      const res = await api.niveles.listar(t || token);
      setNiveles(res.data);
    } catch (e) {
      console.error(e);
      setErrorCarga(e.message || 'Error al cargar niveles');
    }
  };

  const abrirCrear = () => { setForm(emptyForm); setEditId(null); setModal('create'); setErrors({}); };

  const abrirEditar = (g) => {
    setForm({
      fechaapertura: g.fechaapertura ? g.fechaapertura.split('T')[0] : '',
      fechacierre: g.fechacierre ? g.fechacierre.split('T')[0] : '',
      cantidadmen: String(g.cantidadmen),
      descripcion: g.descripcion || '',
    });
    setEditId(g.idgestion);
    setModal('edit');
    setErrors({});
  };

  const guardar = async (e) => {
    e.preventDefault();
    const payload = { fechaapertura: form.fechaapertura, fechacierre: form.fechacierre, cantidadmen: Number(form.cantidadmen), descripcion: form.descripcion };
    try {
      if (modal === 'create') {
        const cm = Number(form.cantidadmen);
        if (!form.cantidadmen || isNaN(cm) || !Number.isInteger(cm) || cm < 1 || cm > 12) {
          setErrors({ cantidadmen: 'Debe ser un número entre 1 y 12' });
          return;
        }
        if (!form.fechaapertura) { setErrors({ fechaapertura: 'Fecha requerida' }); return; }
        if (!form.fechacierre) { setErrors({ fechacierre: 'Fecha requerida' }); return; }
        await api.gestiones.crear(token, payload);
      } else {
        await api.gestiones.actualizar(token, editId, { fechacierre: form.fechacierre, descripcion: form.descripcion });
      }
      setModal(null);
      setErrors({});
      cargarGestiones(token);
    } catch (err) {
      const msg = err.message || err.error || 'Error';
      const lower = msg.toLowerCase();
      if (lower.includes('cierre')) {
        setErrors({ fechacierre: msg });
      } else {
        setErrors({ general: msg });
      }
    }
  };

  const validarMontoPrecio = (valor, nombreNivel) => {
    if (valor === '' || valor === undefined || valor === null) return 'El monto es requerido';
    const str = String(valor).trim();
    if (str === '') return 'El monto es requerido';
    const num = Number(str);
    if (isNaN(num)) return 'No es un número válido';
    if (num < 0) return 'El monto no puede ser negativo';
    if (num === 0) return 'El monto debe ser mayor a 0';
    const partes = str.split('.');
    if (partes.length === 2 && partes[1].length > 2) return 'Debe tener máximo 2 decimales (ej: 750.00)';
    if (partes.length === 1 && num > 1000) return '¿Falta el punto decimal? Ingresaste un número sin decimales';
    return null;
  };

  const guardarPrecio = async (idnivel) => {
    const nivel = niveles.find(n => n.idnivel === idnivel);
    const error = validarMontoPrecio(precios[idnivel], nivel?.nombre || '');
    if (error) {
      setMensaje({ tipo: 'error', texto: `${nivel?.nombre || 'Nivel'}: ${error}` });
      return;
    }
    const monto = Number(precios[idnivel]);
    setGuardando((prev) => ({ ...prev, [idnivel]: true }));
    setMensaje(null);
    try {
      await api.gestiones.asignarPrecio(token, { idgestion: gestionActiva.idgestion, idnivel, monto });
      setDetalles((prev) => {
        const filtered = prev.filter((d) => d.idnivel !== idnivel);
        return [...filtered, { idgestion: gestionActiva.idgestion, idnivel, monto }];
      });
      setMensaje({ tipo: 'exito', texto: `Monto Bs ${monto.toFixed(2)} guardado — ${nivel?.nombre || ''}` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || err.error || 'Error al guardar' });
    } finally {
      setGuardando((prev) => ({ ...prev, [idnivel]: false }));
    }
  };

  const toggleEstado = async (id) => {
    try {
      await api.gestiones.cambiarEstado(token, id);
      cargarGestiones(token);
    } catch (err) {
      const msg = err.message || err.error || 'Error';
      setErrors({ general: msg });
    }
  };


  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const fmtAnio = (f) => f ? new Date(f).getFullYear() : '';

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-calendar"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Gestión Educativa</h2>
            </div>
          </div>
          <button className="btn-sm btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus"></i> Nueva
          </button>
        </div>
      </div>

      {errorCarga && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#991b1b' }}>
          <i className="fas fa-exclamation-circle"></i>
          {errorCarga}
          <button onClick={() => setErrorCarga(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {gestionActiva ? (
        <div className="card" style={{ border: '2px solid #0d9488', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18 }}>
                  <i className="fas fa-check-circle"></i>
                </span>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Gestión Activa</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0' }}>
                    Gestión Académica {fmtAnio(gestionActiva.fechaapertura)}
                    {gestionActiva.descripcion ? ` — ${gestionActiva.descripcion}` : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-sm btn-secondary" style={{ background: 'rgba(255,255,255,0.9)', color: '#0d9488', fontWeight: 600 }} onClick={() => abrirEditar(gestionActiva)}>
                  <i className="fas fa-pencil-alt"></i> Editar
                </button>
                <button className="btn-sm" style={{ background: '#fff', color: '#0d9488', fontWeight: 600 }} onClick={() => { if (confirm('¿Cerrar esta gestión?')) toggleEstado(gestionActiva.idgestion); }}>
                  <i className="fas fa-lock"></i> Cerrar
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9fafb', borderRadius: 10, padding: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', fontSize: 16 }}>
                  <i className="fas fa-play"></i>
                </span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Fecha de Apertura</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '2px 0 0' }}>{fmtFecha(gestionActiva.fechaapertura)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9fafb', borderRadius: 10, padding: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#fed7aa', color: '#c2410c', fontSize: 16 }}>
                  <i className="fas fa-stop"></i>
                </span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Fecha de Cierre</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '2px 0 0' }}>{fmtFecha(gestionActiva.fechacierre)}</p>
                </div>
              </div>
            </div>

            <div>
              {mensaje && (
                <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: mensaje.tipo === 'exito' ? '#d1fae5' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b' }}>
                  <i className={`fas ${mensaje.tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  {mensaje.texto}
                  <button onClick={() => setMensaje(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
                </div>
              )}
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-tags" style={{ color: '#0d9488' }}></i>
                Precios por Nivel Educativo
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {niveles.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: '#6b7280', fontSize: 14 }}>
                    No hay niveles registrados
                  </div>
                ) : (
                  niveles.map((n) => {
                    return (
                      <div key={n.idnivel} style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #d1fae5' }}>
                          <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1f2937' }}>{n.nombre}</h5>
                          <span className="badge" style={{ background: '#ccfbf1', color: '#0f766e', fontSize: 11 }}>Nivel {n.idnivel}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #d1fae5', padding: '0 8px' }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensual</p>
                            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0d9488' }}>Bs {Number(n.montomes).toFixed(2)}</p>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #d1fae5', padding: '0 8px' }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0d9488' }}>Bs {Number(n.montototal).toFixed(2)}</p>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aporte</p>
                            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0d9488' }}>Bs {Number(n.montoaporte)}</p>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', fontSize: 18 }}>
                <i className="fas fa-info-circle"></i>
              </span>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#065f46' }}>No hay gestión activa</h4>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#047857' }}>Actualmente no existe ninguna gestión activa. Crea una nueva para comenzar.</p>
              </div>
            </div>
            <button className="btn-sm btn-primary" onClick={abrirCrear}>
              <i className="fas fa-plus"></i> Nueva Gestión
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-history" style={{ color: '#6b7280' }}></i>
            Historial de Gestiones Cerradas
          </h3>
        </div>
        {gestionesCerradas.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <i className="fas fa-calendar"></i>
            <p>No hay gestiones cerradas</p>
            <span className="empty-sub">El historial de gestiones cerradas aparecerá aquí</span>
          </div>
        ) : (
          <div>
            {gestionesCerradas.map((g) => (
              <div key={g.idgestion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: 14 }}>
                    #{g.idgestion}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                      Gestión Académica {fmtAnio(g.fechaapertura)}
                      {g.descripcion ? ` — ${g.descripcion}` : ''}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-calendar-alt" style={{ fontSize: 10 }}></i>
                      {fmtFecha(g.fechaapertura)} — {fmtFecha(g.fechacierre)}
                      <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11 }}>Cerrada</span>
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', fontSize: 14 }}>
                <i className="fas fa-calendar"></i>
              </span>
              {modal === 'create' ? 'Nueva Gestión' : 'Editar Gestión'}
            </h3>
            <form onSubmit={guardar}>
              {esGestionEditadaActiva && (
                <div style={{ padding: '8px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 6, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-info-circle"></i>
                  Los campos Fecha de Cierre y Mensualidades no se pueden modificar porque la gestión tiene estudiantes matriculados.
                </div>
              )}
              <div className="form-group">
                <label>Fecha Apertura</label>
                <input
                  className={errors.fechaapertura ? 'input-error' : ''}
                  type="date"
                  value={form.fechaapertura}
                  onChange={(e) => { setForm({ ...form, fechaapertura: e.target.value }); setErrors({}); }}
                  disabled={modal === 'edit'}
                  required
                />
                {errors.fechaapertura && <span className="error-text">{errors.fechaapertura}</span>}
              </div>
              <div className="form-group">
                <label>Fecha Cierre</label>
                <input
                  className={errors.fechacierre ? 'input-error' : ''}
                  type="date"
                  value={form.fechacierre}
                  onChange={(e) => { setForm({ ...form, fechacierre: e.target.value }); setErrors({}); }}
                  disabled={esGestionEditadaActiva}
                  title={esGestionEditadaActiva ? 'No se puede modificar: gestión activa con estudiantes matriculados' : ''}
                  required
                />
                {errors.fechacierre && <span className="error-text">{errors.fechacierre}</span>}
              </div>
              <div className="form-group">
                <label>Cantidad de Mensualidades</label>
                <input
                  className={errors.cantidadmen ? 'input-error' : ''}
                  type="number"
                  min="1"
                  max="12"
                  value={form.cantidadmen}
                  onChange={(e) => { 
                    setForm({ ...form, cantidadmen: e.target.value });
                    const val = Number(e.target.value);
                    if (!e.target.value) setErrors(prev => ({ ...prev, cantidadmen: '' }));
                    else if (isNaN(val) || !Number.isInteger(val) || val < 1 || val > 12) setErrors(prev => ({ ...prev, cantidadmen: 'Debe ser un número entre 1 y 12' }));
                    else setErrors(prev => ({ ...prev, cantidadmen: '' }));
                  }}
                  disabled={modal === 'edit'}
                  title={esGestionEditadaActiva ? 'No se puede modificar: gestión activa con estudiantes matriculados' : ''}
                  required
                />
                {errors.cantidadmen && <span className="error-text">{errors.cantidadmen}</span>}
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input maxLength={100} value={form.descripcion} onChange={(e) => { setForm({ ...form, descripcion: e.target.value }); setErrors({}); }} placeholder="Opcional" />
              </div>
              {errors.general && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                  {errors.general}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-sm btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn-sm btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

