'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const emptyForm = { nombrebeca: '', porcentaje: '', idgestion: '' };

export default function BecasPage() {
  const [token, setToken] = useState(null);
  const [becas, setBecas] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editBeca, setEditBeca] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchBeca, setSearchBeca] = useState('');

  const validarForm = () => {
    const e = {};
    if (!form.nombrebeca.trim()) e.nombrebeca = 'El nombre es requerido';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.nombrebeca.trim())) e.nombrebeca = 'Solo se permiten letras y espacios';
    else if (form.nombrebeca.trim().length < 3) e.nombrebeca = 'Mínimo 3 caracteres';
    const pct = Number(form.porcentaje);
    if (!form.porcentaje && form.porcentaje !== 0) e.porcentaje = 'El porcentaje es requerido';
    else if (isNaN(pct) || !Number.isInteger(pct) || pct < 1 || pct > 100) e.porcentaje = 'Ingrese un valor entre 1 y 100';
    return e;
  };

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) { cargarBecas(t); cargarGestiones(t); }
  }, []);

  const cargarBecas = async (t, searchVal) => {
    try {
      const params = {};
      if (searchVal || searchBeca) params.search = searchVal || searchBeca;
      const res = await api.becas.listar(t || token, params);
      setBecas(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => cargarBecas(token), 400);
    return () => clearTimeout(timer);
  }, [searchBeca]);

  const cargarGestiones = async (t) => {
    try {
      const res = await api.gestiones.listar(t || token);
      setGestiones(res.data);
    } catch (e) { console.error(e); }
  };

  const abrirCrear = () => {
    const activa = gestiones.find(g => g.estado === '1');
    setForm({ ...emptyForm, idgestion: activa ? String(activa.idgestion) : '' });
    setEditId(null); setEditBeca(null); setModal('create'); setErrors({});
  };

  const abrirEditar = (b) => {
    setForm({ nombrebeca: b.nombrebeca, porcentaje: String(b.porcentaje), idgestion: String(b.idgestion) });
    setEditId(b.codbeca);
    setEditBeca(b);
    setModal('edit');
    setErrors({});
  };

  const guardar = async (e) => {
    e.preventDefault();
    const valErrors = validarForm();
    if (Object.keys(valErrors).length > 0) { setErrors(valErrors); return; }
    const payload = {
      nombrebeca: form.nombrebeca,
      porcentaje: Number(form.porcentaje),
      idgestion: Number(form.idgestion),
    };
    try {
      if (modal === 'create') {
        await api.becas.crear(token, payload);
      } else {
        await api.becas.actualizar(token, editId, payload);
      }
      setModal(null);
      setErrors({});
      cargarBecas(token);
    } catch (err) {
      const msg = err.message || err.error || 'Error';
      if (msg.toLowerCase().includes('nombre') || msg.toLowerCase().includes('ya existe')) {
        setErrors({ nombrebeca: msg });
      } else {
        setErrors({ general: msg });
      }
    }
  };

  const gestionActiva = gestiones.find(g => g.estado === '1');

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-award"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Gestión de Becas</h2>
            </div>
          </div>
          <button className="btn-sm btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus"></i> Nueva
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-wrap" style={{ maxWidth: '100%', width: '100%' }}>
            <i className="fas fa-search"></i>
            <input
              placeholder="Buscar por nombre de beca..."
              value={searchBeca}
              onChange={(e) => setSearchBeca(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th><i className="fas fa-hashtag" style={{ marginRight: 8 }}></i>Código</th>
                <th><i className="fas fa-award" style={{ marginRight: 8 }}></i>Nombre</th>
                <th><i className="fas fa-percent" style={{ marginRight: 8 }}></i>Porcentaje</th>
                <th><i className="fas fa-calendar" style={{ marginRight: 8 }}></i>Gestión</th>
                <th><i className="fas fa-cog" style={{ marginRight: 8 }}></i>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {becas.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <i className="fas fa-award"></i>
                      <p>No hay registros disponibles</p>
                      <span className="empty-sub">No se encontraron becas</span>
                    </div>
                  </td>
                </tr>
              ) : (
                becas.map((b) => (
                  <tr key={b.codbeca}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {b.codbeca}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{b.nombrebeca}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
                        <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(b.porcentaje, 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)', height: '100%', borderRadius: 999, transition: 'width 0.3s' }}></div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{b.porcentaje}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#edf5f5', color: '#111827' }}>{b.gestion_nombre || `ID ${b.idgestion}`}</span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-sm btn-secondary" onClick={() => abrirEditar(b)} title="Editar nombre de beca">
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', fontSize: 14 }}>
                <i className="fas fa-award"></i>
              </span>
              Nueva Beca
            </h3>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre de la Beca</label>
                <input
                  className={errors.nombrebeca ? 'input-error' : ''}
                  value={form.nombrebeca}
                  onChange={(e) => { setForm({ ...form, nombrebeca: e.target.value }); setErrors(prev => ({ ...prev, nombrebeca: '' })); }}
                  maxLength={100}
                  required
                  placeholder="Ej: Beca Excelencia Académica"
                />
                {errors.nombrebeca && <span className="error-text">{errors.nombrebeca}</span>}
              </div>
              <div className="form-group">
                <label>Porcentaje de Descuento</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" min="1" max="100" className={errors.porcentaje ? 'input-error' : ''} value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })} required style={{ width: 100 }} />
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#0d9488' }}>%</span>
                  <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(form.porcentaje) || 0, 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)', height: '100%', borderRadius: 999, transition: 'width 0.3s' }}></div>
                  </div>
                </div>
                {errors.porcentaje && <span className="error-text">{errors.porcentaje}</span>}
              </div>
              <div className="form-group">
                <label>Gestión</label>
                <input
                  type="text"
                  value={gestionActiva ? (gestionActiva.descripcion || `Gestión ${gestionActiva.idgestion}`) : 'Sin gestión activa'}
                  disabled
                  style={{ background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
                />
                <input type="hidden" value={form.idgestion} />
              </div>
              {errors.general && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                  {errors.general}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-sm btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn-sm btn-primary">Registrar Beca</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'edit' && editBeca && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', fontSize: 14 }}>
                <i className="fas fa-award"></i>
              </span>
              Editar Beca
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#6b7280' }}>Código:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>{editBeca.codbeca}</span>
            </div>

            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre de la Beca</label>
                <input
                  className={errors.nombrebeca ? 'input-error' : ''}
                  value={form.nombrebeca}
                  onChange={(e) => { setForm({ ...form, nombrebeca: e.target.value }); setErrors(prev => ({ ...prev, nombrebeca: '' })); }}
                  maxLength={100}
                  required
                />
                {errors.nombrebeca && <span className="error-text">{errors.nombrebeca}</span>}
              </div>
              {errors.general && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                  {errors.general}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-sm btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn-sm btn-primary">Actualizar Nombre</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
