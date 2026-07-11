'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

const emptyForm = { ci: '', nombre: '', apellido: '', sexo: 'M', telefono: '', correo: '' };

export default function PersonasPage() {
  const [token, setToken] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [form, setForm] = useState(emptyForm);
  const [editCi, setEditCi] = useState(null);
  const [viewPersona, setViewPersona] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const validarForm = () => {
    const errs = {};
    if (modal === 'create') {
      if (!form.ci.trim()) errs.ci = 'CI requerido';
      else if (!/^\d+$/.test(form.ci)) errs.ci = 'CI debe contener solo números';
      else if (form.ci.length < 6 || form.ci.length > 10) errs.ci = 'CI debe tener entre 6 y 10 dígitos';
    }
    if (!form.nombre.trim()) errs.nombre = 'Nombre requerido';
    else if (form.nombre.trim().length < 3) errs.nombre = 'Nombre debe tener al menos 3 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.nombre)) errs.nombre = 'Nombre solo puede contener letras';
    if (!form.apellido.trim()) errs.apellido = 'Apellido requerido';
    else if (form.apellido.trim().length < 3) errs.apellido = 'Apellido debe tener al menos 3 caracteres';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.apellido)) errs.apellido = 'Apellido solo puede contener letras';
    if (form.telefono && !/^\d{8}$/.test(form.telefono)) errs.telefono = 'Teléfono debe tener exactamente 8 dígitos';
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) errs.correo = 'Correo electrónico inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const limpiarErrores = () => setErrors({});

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const getToken = () => {
    const t = localStorage.getItem('token');
    setToken(t);
    return t;
  };

  useEffect(() => { const t = getToken(); if (t) cargar(t); }, []);

  const cargar = async (t, pg) => {
    const t2 = t || token;
    if (!t2) return;
    try {
      const res = await api.personas.listar(t2, { search, page: pg || page, limit: 5 });
      setPersonas(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) { setPage(1); cargar(token, 1); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (token) cargar(token);
  }, [page]);

  const abrirCrear = () => {
    setForm(emptyForm);
    setEditCi(null);
    setModal('create');
    limpiarErrores();
  };

  const abrirEditar = (p) => {
    setForm({ ci: p.ci, nombre: p.nombre, apellido: p.apellido, sexo: p.sexo, telefono: p.telefono || '', correo: p.correo || '' });
    setEditCi(p.ci);
    setModal('edit');
    limpiarErrores();
  };

  const abrirVer = (p) => {
    setViewPersona(p);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!validarForm()) return;
    try {
      if (modal === 'create') {
        await api.personas.crear(token, form);
      } else {
        await api.personas.actualizar(token, editCi, form);
      }
      setModal(null);
      limpiarErrores();
      setSuccessMsg(modal === 'create' ? 'Persona creada exitosamente' : 'Persona actualizada exitosamente');
      cargar(token);
    } catch (err) {
      console.error(err);
      const msg = err.message || err.error || 'Error al guardar';
      if (msg.toLowerCase().includes('ci') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('ya existe')) {
        setErrors({ ci: 'Este CI ya está registrado' });
      } else {
        setErrors({ general: msg });
      }
    }
  };

  const exportarCSV = () => {
    if (personas.length === 0) return;
    const headers = ['CI', 'Nombre', 'Apellido', 'Sexo', 'Teléfono', 'Correo'];
    const rows = personas.map(p => [
      p.ci,
      p.nombre,
      p.apellido,
      p.sexo === 'M' ? 'Masculino' : 'Femenino',
      p.telefono || '',
      p.correo || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Personas</h2>
            </div>
          </div>
          <button className="btn-sm btn-primary" onClick={abrirCrear}>
            <i className="fas fa-plus"></i> Nueva
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '10px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-check-circle"></i> {successMsg}
        </div>
      )}

      <div className="card">
        <div className="toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-wrap">
            <i className="fas fa-search"></i>
            <input
              placeholder="Buscar por CI, nombre o apellido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-sm btn-secondary" onClick={exportarCSV} title="Exportar a CSV">
            <i className="fas fa-download"></i> Exportar
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th><i className="fas fa-id-card" style={{ marginRight: 8 }}></i>CI</th>
                <th><i className="fas fa-user" style={{ marginRight: 8 }}></i>Nombre</th>
                <th><i className="fas fa-user" style={{ marginRight: 8 }}></i>Apellido</th>
                <th><i className="fas fa-venus-mars" style={{ marginRight: 8 }}></i>Sexo</th>
                <th><i className="fas fa-phone" style={{ marginRight: 8 }}></i>Teléfono</th>
                <th><i className="fas fa-envelope" style={{ marginRight: 8 }}></i>Correo</th>
                <th><i className="fas fa-cog" style={{ marginRight: 8 }}></i>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <i className="fas fa-users"></i>
                      <p>No hay registros disponibles</p>
                      <span className="empty-sub">No se encontraron personas</span>
                    </div>
                  </td>
                </tr>
              ) : (
                personas.map((p) => (
                  <tr key={p.ci}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {p.ci}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{p.nombre}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{p.apellido}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{mapValue('sexo', p.sexo)}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{p.telefono || '-'}</div></td>
                    <td><div style={{ fontSize: '14px', color: '#374151' }}>{p.correo || '-'}</div></td>
                    <td>
                      <div className="actions">
                        <button className="btn-sm btn-secondary" onClick={() => abrirVer(p)} title="Ver detalle">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-sm btn-secondary" onClick={() => abrirEditar(p)} title="Editar">
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

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'create' ? 'Nueva Persona' : 'Editar Persona'}</h3>
            <form onSubmit={guardar}>
              {modal === 'create' && (
                <div className="form-group">
                  <label>CI</label>
                  <input
                    className={errors.ci ? 'input-error' : ''}
                    value={form.ci}
                    onChange={(e) => { setForm({ ...form, ci: e.target.value.replace(/\D/g, '') }); limpiarErrores(); }}
                    maxLength={10}
                    placeholder="Cédula de identidad"
                  />
                  {errors.ci && <span className="error-text">{errors.ci}</span>}
                </div>
              )}
              <div className="form-group">
                <label>Nombre</label>
                <input
                  className={errors.nombre ? 'input-error' : ''}
                  value={form.nombre}
                  onChange={(e) => { setForm({ ...form, nombre: e.target.value }); limpiarErrores(); }}
                  maxLength={100}
                  placeholder="Nombre"
                />
                {errors.nombre && <span className="error-text">{errors.nombre}</span>}
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input
                  className={errors.apellido ? 'input-error' : ''}
                  value={form.apellido}
                  onChange={(e) => { setForm({ ...form, apellido: e.target.value }); limpiarErrores(); }}
                  maxLength={100}
                  placeholder="Apellido"
                />
                {errors.apellido && <span className="error-text">{errors.apellido}</span>}
              </div>
              <div className="form-group">
                <label>Sexo</label>
                <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                <option value="M">{mapValue('sexo', 'M')}</option>
                <option value="F">{mapValue('sexo', 'F')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  className={errors.telefono ? 'input-error' : ''}
                  value={form.telefono}
                  onChange={(e) => { setForm({ ...form, telefono: e.target.value }); limpiarErrores(); }}
                  maxLength={8}
                  placeholder="Opcional — 8 dígitos"
                />
                {errors.telefono && <span className="error-text">{errors.telefono}</span>}
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input
                  className={errors.correo ? 'input-error' : ''}
                  value={form.correo}
                  onChange={(e) => { setForm({ ...form, correo: e.target.value }); limpiarErrores(); }}
                  placeholder="Opcional — correo@ejemplo.com"
                />
                {errors.correo && <span className="error-text">{errors.correo}</span>}
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

      {viewPersona && (
        <div className="modal-overlay" onClick={() => setViewPersona(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Información de Persona</h3>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>CI</strong><span style={{ fontSize: '15px', color: '#111827' }}>{viewPersona.ci}</span></div>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Nombre</strong><span style={{ fontSize: '15px', color: '#111827' }}>{viewPersona.nombre}</span></div>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Apellido</strong><span style={{ fontSize: '15px', color: '#111827' }}>{viewPersona.apellido}</span></div>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Sexo</strong><span style={{ fontSize: '15px', color: '#111827' }}>{mapValue('sexo', viewPersona.sexo)}</span></div>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Teléfono</strong><span style={{ fontSize: '15px', color: '#111827' }}>{viewPersona.telefono || '-'}</span></div>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Correo</strong><span style={{ fontSize: '15px', color: '#111827' }}>{viewPersona.correo || '-'}</span></div>
              <div><strong style={{ color: '#374151', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Estado</strong><span className={`badge ${viewPersona.estado === 'A' ? 'badge-active' : 'badge-inactive'}`} style={{ marginTop: '4px' }}>{mapValue('estado', viewPersona.estado)}</span></div>
            </div>
            <div className="modal-actions">
              <button className="btn-sm btn-secondary" onClick={() => setViewPersona(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
