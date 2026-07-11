'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

function validarMonto(valor, nombreCampo) {
  if (!valor || String(valor).trim() === '') return `${nombreCampo} es requerido`;
  const num = Number(valor);
  if (isNaN(num)) return `${nombreCampo} no es un número válido`;
  if (num < 0) return `${nombreCampo} no puede ser negativo`;
  if (num === 0) return `${nombreCampo} debe ser mayor a 0`;
  return null;
}

export default function NivelesPage() {
  const [token, setToken] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [gestionActiva, setGestionActiva] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ montomes: '', montototal: '', montoaporte: '' });
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) { cargar(t); cargarGestion(t); }
  }, []);

  const cargar = async (t) => {
    try {
      const res = await api.niveles.listar(t);
      setNiveles(res.data);
    } catch (e) { console.error(e); }
  };

  const cargarGestion = async (t) => {
    try {
      setErrorCarga(null);
      const res = await api.gestiones.listar(t || token);
      const activa = (res.data || []).find(g => g.estado === '1');
      setGestionActiva(activa || null);
    } catch (e) {
      console.error(e);
      setErrorCarga(e.message || 'Error al cargar gestión');
    }
  };

  const abrirEditar = (n) => {
    setForm({ montomes: Number(n.montomes).toFixed(2), montototal: Number(n.montototal).toFixed(2), montoaporte: String(n.montoaporte || '25') });
    setEditId(n.idnivel);
    setEditNombre(n.nombre);
    setErrores({});
    setMensaje(null);
    setModal(true);
  };

  const handleTotalChange = (val) => {
    setForm(prev => {
      const total = Number(val) || 0;
      const cuotas = Number(gestionActiva?.cantidadmen) || 1;
      const mes = cuotas > 0 ? (total / cuotas) : 0;
      return { ...prev, montototal: val, montomes: mes.toFixed(2) };
    });
    setErrores(prev => ({ ...prev, montototal: validarMonto(val, 'Monto total') }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    const errMontototal = validarMonto(form.montototal, 'Monto total');
    const errMontoaporte = validarMonto(form.montoaporte, 'Monto aporte');
    const nuevosErrores = {};
    if (errMontototal) nuevosErrores.montototal = errMontototal;
    if (errMontoaporte) nuevosErrores.montoaporte = errMontoaporte;
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    try {
      await api.niveles.actualizar(token, editId, {
        montomes: Number(form.montomes),
        montototal: Number(form.montototal),
        montoaporte: Number(form.montoaporte),
      });
      setMensaje({ tipo: 'exito', texto: 'Nivel actualizado correctamente' });
      setModal(null);
      cargar(token);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar' });
    }
  };

  const formatoBs = (v) => 'Bs ' + Number(v || 0);

  return (
    <div>
      {errorCarga && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#991b1b' }}>
          <i className="fas fa-exclamation-circle"></i>
          {errorCarga}
          <button onClick={() => setErrorCarga(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
      )}

      {mensaje && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: mensaje.tipo === 'exito' ? '#d1fae5' : '#fee2e2', color: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b' }}>
          <i className={`fas ${mensaje.tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {mensaje.texto}
          <button onClick={() => setMensaje(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon">
              <i className="fas fa-layer-group"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Niveles Educativos</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}><i className="fas fa-hashtag" style={{ marginRight: 6 }}></i>ID</th>
                <th><i className="fas fa-layer-group" style={{ marginRight: 6 }}></i>Nombre</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-calendar-check" style={{ marginRight: 6 }}></i>Monto Mes</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-calculator" style={{ marginRight: 6 }}></i>Monto Total</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-hand-holding-usd" style={{ marginRight: 6 }}></i>Aporte</th>
                <th style={{ textAlign: 'center' }}><i className="fas fa-cog" style={{ marginRight: 6 }}></i>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {niveles.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <i className="fas fa-layer-group"></i>
                      <p>No hay registros disponibles</p>
                      <span className="empty-sub">No se encontraron niveles educativos</span>
                    </div>
                  </td>
                </tr>
              ) : (
                niveles.map((n) => (
                  <tr key={n.idnivel}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {n.idnivel}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{n.nombre}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: '#edf5f5', color: '#111827' }}>{formatoBs(n.montomes)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: '#edf5f5', color: '#111827' }}>{formatoBs(n.montototal)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: '#edf5f5', color: '#111827' }}>{formatoBs(n.montoaporte)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions" style={{ justifyContent: 'center' }}>
                        <button className="btn-sm btn-secondary" onClick={() => abrirEditar(n)} title="Editar montos">
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

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 14 }}>
                <i className="fas fa-layer-group"></i>
              </span>
              Editar Nivel — {editNombre}
            </h3>
            <form onSubmit={guardar}>
              {gestionActiva && (
                <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#5F9EA0' }}>Cuotas de la gestión activa:</span>
                  <span style={{ fontWeight: 700, color: '#374151', fontSize: 15 }}>{gestionActiva.cantidadmen} mensualidades</span>
                </div>
              )}
              <div className="form-group">
                <label>Monto Mensual (calculado automáticamente)</label>
                <input type="number" step="0.01" value={Number(form.montomes).toFixed(2)} disabled style={{ background: '#f9fafb', color: '#6b7280' }} />
              </div>
              <div className="form-group">
                <label>Monto Total (Bs)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.montototal}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className={errores.montototal ? 'input-error' : ''}
                  placeholder="Ej: 750.00"
                  required
                />
                {errores.montototal && <span className="error-text">{errores.montototal}</span>}
              </div>
              <div className="form-group">
                <label>Monto Aporte (Bs)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.montoaporte}
                  onChange={(e) => {
                    setForm({ ...form, montoaporte: e.target.value });
                    setErrores(prev => ({ ...prev, montoaporte: validarMonto(e.target.value, 'Monto aporte') }));
                  }}
                  className={errores.montoaporte ? 'input-error' : ''}
                  placeholder="Ej: 40.00"
                  required
                />
                {errores.montoaporte && <span className="error-text">{errores.montoaporte}</span>}
              </div>
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
