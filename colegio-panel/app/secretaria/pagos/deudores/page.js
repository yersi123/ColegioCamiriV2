'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DeudoresPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [gestiones, setGestiones] = useState([]);
  const [gestionId, setGestionId] = useState('');
  const [mesesMin, setMesesMin] = useState('1');
  const [nivelId, setNivelId] = useState('');
  const [niveles, setNiveles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    api.gestiones.listar(t).then((res) => {
      setGestiones(res.data);
      const activa = res.data.find((gx) => gx.estado === '1');
      if (activa) setGestionId(String(activa.idgestion));
    }).catch(() => {});
    api.niveles.listar(t).then((res) => setNiveles(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !gestionId || !mesesMin) return;
    setLoading(true);
    setError('');
    const params = { gestion: gestionId, meses: mesesMin };
    if (nivelId) params.nivel = nivelId;
    if (busqueda.trim()) params.busqueda = busqueda.trim();
    api.mensualidades.deudores(token, params)
      .then((res) => setDeudores(res.data || []))
      .catch((err) => setError(err.message || 'Error al cargar deudores'))
      .finally(() => setLoading(false));
  }, [token, gestionId, mesesMin, nivelId, busqueda]);

  const limpiar = () => {
    setGestionId('');
    setMesesMin('1');
    setNivelId('');
    setBusqueda('');
    setDeudores([]);
  };

  const totalAdeudado = deudores.reduce((sum, d) => sum + Number(d.monto_total_adeudado || 0), 0);
  const promedio = deudores.length > 0 ? totalAdeudado / deudores.length : 0;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#fce4ec', color: '#c62828', fontSize: 20 }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Listado de Deudores</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Estudiantes con mensualidades pendientes</p>
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
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Gestión</label>
            <select value={gestionId} onChange={(e) => setGestionId(e.target.value)}>
              <option value="">Selecciona una gestión</option>
              {gestiones.map((g) => (
                <option key={g.idgestion} value={g.idgestion}>{g.descripcion}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Meses Adeudados (Mínimo)</label>
            <select value={mesesMin} onChange={(e) => setMesesMin(e.target.value)}>
              <option value="1">1 mes</option>
              <option value="2">2 meses</option>
              <option value="3">3 meses</option>
              <option value="4">4 meses</option>
              <option value="5">5 meses</option>
              <option value="6">6 meses o más</option>
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
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Buscar Estudiante</label>
            <input type="text" placeholder="Nombre, apellido o código..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn-sm btn-secondary" onClick={() => limpiar()}>
            <i className="fas fa-times"></i> Limpiar Filtros
          </button>
          {gestionId && (
            <span className="badge badge-active" style={{ fontSize: 12 }}>
              <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>
              {gestiones.find(g => String(g.idgestion) === gestionId)?.descripcion || 'Gestión activa'}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Cargando deudores...</div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : deudores.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-check-circle" style={{ fontSize: 40, color: '#22c55e' }}></i>
            <p>No hay deudores</p>
            <span className="empty-sub">Selecciona una gestión y meses para ver los deudores</span>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th><i className="fas fa-hashtag" style={{ marginRight: 6 }}></i>Código</th>
                    <th><i className="fas fa-user" style={{ marginRight: 6 }}></i>Estudiante</th>
                    <th><i className="fas fa-book" style={{ marginRight: 6 }}></i>Curso</th>
                    <th><i className="fas fa-layer-group" style={{ marginRight: 6 }}></i>Nivel</th>
                    <th style={{ textAlign: 'center' }}><i className="fas fa-calendar-times" style={{ marginRight: 6 }}></i>Meses Adeudados</th>
                    <th style={{ textAlign: 'right' }}><i className="fas fa-money-bill" style={{ marginRight: 6 }}></i>Monto Adeudado</th>
                  </tr>
                </thead>
                <tbody>
                  {deudores.map((d) => (
                    <tr key={d.ci}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                          {d.codestudiante}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{d.nombre} {d.apellido}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>CI: {d.ci}</div>
                      </td>
                      <td><div style={{ fontSize: '14px', color: '#374151' }}>{d.curso_nombre}</div></td>
                      <td>
                        <span className="badge badge-active">{d.nivel_nombre}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ background: '#fce4ec', color: '#c62828', fontWeight: 700 }}>
                          {d.meses_adeudados}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>Bs {Number(d.monto_total_adeudado).toFixed(2)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Total de Deudores</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{deudores.length}</p>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Monto Total Adeudado</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>Bs {totalAdeudado.toFixed(2)}</p>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Promedio por Estudiante</p>
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
