'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function HistorialPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [gestionId, setGestionId] = useState('');
  const [gestiones, setGestiones] = useState([]);
  const [nivelId, setNivelId] = useState('');
  const [niveles, setNiveles] = useState([]);
  const [tipopago, setTipopago] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    setFechaInicial(inicio.toISOString().split('T')[0]);
    setFechaFinal(hoy.toISOString().split('T')[0]);
    api.gestiones.listar(t).then((res) => setGestiones(res.data)).catch(() => {});
    api.niveles.listar(t).then((res) => setNiveles(res.data)).catch(() => {});
  }, []);

  const buscar = async () => {
    if (!fechaInicial || !fechaFinal) { setError('Selecciona ambas fechas'); return; }
    setError('');
    setLoading(true);
    try {
      const params = { fecha_inicial: fechaInicial, fecha_final: fechaFinal };
      if (gestionId) params.gestion = gestionId;
      if (nivelId) params.nivel = nivelId;
      if (tipopago) params.tipopago = tipopago;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const res = await api.mensualidades.historial(token, params);
      setPagos(res.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && fechaInicial && fechaFinal) buscar();
  }, [token]);

  useEffect(() => {
    if (!token || !fechaInicial || !fechaFinal) return;
    const timer = setTimeout(() => buscar(), 400);
    return () => clearTimeout(timer);
  }, [token, fechaInicial, fechaFinal, gestionId, nivelId, tipopago, busqueda]);

  const limpiar = () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    setFechaInicial(inicio.toISOString().split('T')[0]);
    setFechaFinal(hoy.toISOString().split('T')[0]);
    setGestionId('');
    setNivelId('');
    setTipopago('');
    setBusqueda('');
    setPagos([]);
    setError('');
  };

  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.totalpagar || 0), 0);
  const promedio = pagos.length > 0 ? totalPagado / pagos.length : 0;

  const tipoBadge = (tipo) => {
    if (tipo === 'E') return { cls: 'badge badge-active', label: 'Efectivo' };
    if (tipo === 'Q') return { cls: 'badge badge-active', label: 'QR' };
    if (tipo === 'A') return { cls: 'badge badge-active', label: 'Automático' };
    return { cls: 'badge badge-inactive', label: 'Pendiente' };
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#e8f5e9', color: '#2e7d32', fontSize: 20 }}>
              <i className="fas fa-history"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Historial de Pagos</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Pagos realizados entre fechas</p>
            </div>
          </div>
          <button className="btn-sm btn-secondary" onClick={() => router.push('/secretaria/pagos')}>
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fecha Inicial</label>
            <input type="date" value={fechaInicial} onChange={(e) => setFechaInicial(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fecha Final</label>
            <input type="date" value={fechaFinal} onChange={(e) => setFechaFinal(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Gestión</label>
            <select value={gestionId} onChange={(e) => setGestionId(e.target.value)}>
              <option value="">Todas</option>
              {gestiones.map((g) => (
                <option key={g.idgestion} value={g.idgestion}>{g.descripcion}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nivel</label>
            <select value={nivelId} onChange={(e) => setNivelId(e.target.value)}>
              <option value="">Todos</option>
              {niveles.map((n) => (
                <option key={n.idnivel} value={n.idnivel}>{n.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="toolbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Método de Pago</label>
            <select value={tipopago} onChange={(e) => setTipopago(e.target.value)}>
              <option value="">Todos</option>
              <option value="E">Efectivo</option>
              <option value="Q">QR</option>
              <option value="A">Automático</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Buscar Estudiante</label>
            <input type="text" placeholder="Nombre, apellido o CI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button className="btn-sm btn-secondary" onClick={() => limpiar()}>
              <i className="fas fa-times"></i> Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Cargando historial...</div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : pagos.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-history" style={{ fontSize: 40, color: '#d1d5db' }}></i>
            <p>No hay pagos registrados</p>
            <span className="empty-sub">Selecciona un rango de fechas para ver los pagos realizados</span>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th><i className="fas fa-calendar-day" style={{ marginRight: 6 }}></i>Fecha Pago</th>
                    <th><i className="fas fa-hashtag" style={{ marginRight: 6 }}></i>Código</th>
                    <th><i className="fas fa-user" style={{ marginRight: 6 }}></i>Estudiante</th>
                    <th><i className="fas fa-book" style={{ marginRight: 6 }}></i>Curso</th>
                    <th style={{ textAlign: 'center' }}><i className="fas fa-sort-numeric-up" style={{ marginRight: 6 }}></i>Nro</th>
                    <th style={{ textAlign: 'center' }}><i className="fas fa-credit-card" style={{ marginRight: 6 }}></i>Método</th>
                    <th style={{ textAlign: 'right' }}><i className="fas fa-money-bill" style={{ marginRight: 6 }}></i>Monto Base</th>
                    <th style={{ textAlign: 'right' }}><i className="fas fa-money-bill-wave" style={{ marginRight: 6 }}></i>Total</th>
                    <th style={{ textAlign: 'right' }}><i className="fas fa-tag" style={{ marginRight: 6 }}></i>Desc.</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => {
                    const tb = tipoBadge(p.tipopago);
                    const montoBase = Number(p.monto || 0);
                    const descuento = Number(p.descuento || 0);
                    const porcentaje = montoBase > 0 ? Math.round((descuento / montoBase) * 100) : 0;
                    return (
                      <tr key={p.idmensualidad}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#d4edda', color: '#155724', fontSize: '13px', fontWeight: 600 }}>
                            {new Date(p.fechapago).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                            {p.codestudiante || p.estudiante_ci}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{p.estudiante_nombre}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>CI: {p.estudiante_ci}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px', color: '#374151' }}>{p.curso_nombre}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.nivel_nombre}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                            Mensualidad #{p.nro}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={tb.cls}>{tb.label}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Bs {montoBase.toFixed(2)}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>Bs {Number(p.totalpagar).toFixed(2)}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {descuento > 0 ? (
                            <div>
                              <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600 }}>Bs {descuento.toFixed(2)}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>({porcentaje}%)</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: '#9ca3af' }}>—</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Total de Pagos</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{pagos.length}</p>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Monto Total Pagado</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>Bs {totalPagado.toFixed(2)}</p>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Promedio por Pago</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Bs {promedio.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
