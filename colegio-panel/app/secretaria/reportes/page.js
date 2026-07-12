'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const tabs = [
  { key: 'matricula', label: 'Matrícula', icon: 'fa-user-graduate' },
  { key: 'mora', label: 'Mora', icon: 'fa-exclamation-triangle' },
  { key: 'ingresos', label: 'Ingresos', icon: 'fa-money-bill-wave' },
  { key: 'becas', label: 'Becas', icon: 'fa-award' },
];

export default function ReportesPage() {
  const [token, setToken] = useState(null);
  const [tab, setTab] = useState('matricula');
  const [gestiones, setGestiones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [idgestion, setIdgestion] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mesesFilter, setMesesFilter] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    api.gestiones.listar(t).then((res) => {
      setGestiones(res.data || []);
      const activa = (res.data || []).find(g => g.estado === '1');
      if (activa) setIdgestion(String(activa.idgestion));
    }).catch(() => {});
    api.cursos.listar(t).then((res) => {
      setCursos(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !idgestion) return;
    setLoading(true);
    setError(null);
    const safe = (p) => p.catch((e) => { setError(e.message || 'Error al cargar reporte'); return null; });

    const loaders = {
      matricula: () => safe(api.reportes.matricula(token, { idgestion, ...(cursoFilter ? { idcurso: cursoFilter } : {}) })),
      mora: () => safe(api.reportes.mora(token, { idgestion, ...(mesesFilter ? { meses: mesesFilter } : {}) })),
      ingresos: () => safe(api.reportes.ingresos(token, { idgestion })),
      becas: () => safe(api.reportes.becas(token, { idgestion })),
    };

    loaders[tab]().then((res) => {
      setData(res?.data || null);
      setLoading(false);
    });
  }, [token, idgestion, tab, mesesFilter, cursoFilter]);

  const fmtBs = (v) => 'Bs ' + Number(v || 0).toFixed(2);
  const fmtNum = (v) => Number(v || 0).toLocaleString('es-BO');

  const handlePrint = () => {
    window.print();
  };

  const handleCSV = () => {
    if (!data) return;
    let rows = [];
    let headers = [];

    if (tab === 'matricula') {
      rows = data?.rows || [];
      headers = ['Curso', 'Paralelo', 'Nivel', 'Capacidad', 'Inscritos', 'Activos', 'Registrados', 'Disponible'];
    } else if (tab === 'mora') {
      rows = data?.rows || [];
      headers = ['CI', 'Nombre', 'Apellido', 'Curso', 'Nivel', 'Meses Adeudados', 'Total Adeudado'];
    } else if (tab === 'ingresos') {
      const n = data?.ingresos_nivel || [];
      if (n.length > 0) {
        headers = ['Nivel', 'Canceladas', 'Recaudado', 'Pendientes', 'Pendiente'];
        rows = n.map(x => [x.nivel, x.canceladas, x.total_recaudado, x.pendientes, x.total_pendiente]);
      } else {
        return;
      }
    } else if (tab === 'becas') {
      rows = data?.rows || [];
      headers = ['CI', 'Nombre', 'Apellido', 'Curso', 'Nivel', 'Beca', 'Porcentaje'];
    } else {
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => {
        if (tab === 'matricula') return [r.curso, r.paralelo, r.nivel, r.capacidad_maxima, r.inscritos, r.activos, r.registrados, Number(r.capacidad_maxima) - Number(r.inscritos)].join(',');
        if (tab === 'mora') return [r.ci, r.nombre, r.apellido, r.curso, r.nivel, r.meses_adeudados, r.total_adeudado].join(',');
        if (tab === 'becas') return [r.ci, r.nombre, r.apellido, r.curso, r.nivel, r.nombrebeca, r.porcentaje].join(',');
        return r.join(',');
      })
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const tabName = tabs.find(t => t.key === tab)?.label || tab;
    const gestionName = gestiones.find(g => String(g.idgestion) === idgestion)?.descripcion || idgestion;
    a.href = url;
    a.download = `Reporte_${tabName}_${gestionName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFilters = () => {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {tab === 'mora' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Mín. meses:</label>
              <select value={mesesFilter} onChange={e => setMesesFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, fontWeight: 500 }}>
                <option value="">1 mês</option>
                <option value="2">2 meses</option>
                <option value="3">3 meses</option>
                <option value="6">6 meses</option>
                <option value="12">12+ meses</option>
              </select>
            </div>
          )}
          {tab === 'matricula' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Curso:</label>
              <select value={cursoFilter} onChange={e => setCursoFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, fontWeight: 500 }}>
                <option value="">Todos</option>
                {cursos.map(c => (
                  <option key={c.idcurso} value={c.idcurso}>{c.descripcion} - {c.paralelo}</option>
                ))}
              </select>
            </div>
          )}
          {tab === 'ingresos' && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>Vista general</span>
          )}
          {tab === 'becas' && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>Distribución de becas</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-sm btn-secondary" onClick={handlePrint} title="Imprimir / Guardar PDF">
            <i className="fas fa-print"></i> Imprimir PDF
          </button>
          <button className="btn-sm btn-primary" onClick={handleCSV} title="Descargar como CSV (se abre en Excel)">
            <i className="fas fa-file-excel"></i> Exportar Excel
          </button>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }}></i><p style={{ marginTop: 12 }}>Cargando reporte...</p></div>;
    if (error) return <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}><i className="fas fa-exclamation-circle"></i> {error}</div>;
    if (!data) return <div className="empty-state" style={{ padding: 40 }}><i className="fas fa-chart-bar"></i><p>Seleccione una gestión</p></div>;

    switch (tab) {
      case 'matricula': return renderMatricula();
      case 'mora': return renderMora();
      case 'ingresos': return renderIngresos();
      case 'becas': return renderBecas();
      default: return null;
    }
  };

  const renderMatricula = () => {
    const rows = data?.rows || [];
    const totalCapacidad = rows.reduce((s, r) => s + Number(r.capacidad_maxima || 0), 0);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#edf5f5', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#5F9EA0', textTransform: 'uppercase', margin: '0 0 4px' }}>Total Cursos</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{rows.length}</p>
          </div>
          <div style={{ background: '#edf5f5', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#5F9EA0', textTransform: 'uppercase', margin: '0 0 4px' }}>Total Inscritos</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{data?.total || 0}</p>
          </div>
          <div style={{ background: '#edf5f5', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#5F9EA0', textTransform: 'uppercase', margin: '0 0 4px' }}>Capacidad Total</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{totalCapacidad}</p>
          </div>
          <div style={{ background: '#edf5f5', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#5F9EA0', textTransform: 'uppercase', margin: '0 0 4px' }}>Ocupación</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: totalCapacidad > 0 && (rows.reduce((s,r) => s + Number(r.inscritos), 0) / totalCapacidad) > 0.9 ? '#dc2626' : '#065f46', margin: 0 }}>
              {totalCapacidad > 0 ? ((data?.total || 0) / totalCapacidad * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Paralelo</th>
                <th>Nivel</th>
                <th style={{ textAlign: 'center' }}>Capacidad</th>
                <th style={{ textAlign: 'center' }}>Inscritos</th>
                <th style={{ textAlign: 'center' }}>Activos</th>
                <th style={{ textAlign: 'center' }}>Registrados</th>
                <th style={{ textAlign: 'center' }}>Disponible</th>
                <th style={{ textAlign: 'center' }}>Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><p>Sin datos</p></div></td></tr>
              ) : rows.map((r, i) => {
                const disp = Number(r.capacidad_maxima || 0) - Number(r.inscritos || 0);
                const pct = Number(r.capacidad_maxima) > 0 ? (Number(r.inscritos) / Number(r.capacidad_maxima) * 100) : 0;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.curso}</td>
                    <td>{r.paralelo}</td>
                    <td>{r.nivel}</td>
                    <td style={{ textAlign: 'center' }}>{r.capacidad_maxima}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.inscritos}</td>
                    <td style={{ textAlign: 'center' }}>{r.activos}</td>
                    <td style={{ textAlign: 'center' }}>{r.registrados}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ background: disp > 0 ? '#d1fae5' : '#fee2e2', color: disp > 0 ? '#065f46' : '#991b1b' }}>
                        {disp}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                        <div style={{ width: 50, height: 6, borderRadius: 3, background: '#e5e7eb' }}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: pct >= 90 ? '#dc2626' : '#374151' }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMora = () => {
    const rows = data?.rows || [];
    const totalDeuda = rows.reduce((s, r) => s + Number(r.total_adeudado || 0), 0);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', margin: '0 0 4px' }}>Total Morosos</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{data?.total_morosos || 0}</p>
          </div>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', margin: '0 0 4px' }}>Deuda Total</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{fmtBs(totalDeuda)}</p>
          </div>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', margin: '0 0 4px' }}>Promedio por Deudor</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{fmtBs(rows.length > 0 ? totalDeuda / rows.length : 0)}</p>
          </div>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', margin: '0 0 4px' }}>Mayor Deudor</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>
              {rows.length > 0 ? fmtBs(Math.max(...rows.map(r => Number(r.total_adeudado || 0)))) : 'Bs 0'}
            </p>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>CI</th>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Nivel</th>
                <th style={{ textAlign: 'center' }}>Meses Adeudados</th>
                <th style={{ textAlign: 'right' }}>Total Adeudado</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>No hay morosos</p></div></td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.ci}</td>
                  <td style={{ fontWeight: 600 }}>{r.nombre} {r.apellido}</td>
                  <td>{r.curso}</td>
                  <td>{r.nivel}</td>
                  <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: Number(r.meses_adeudados) >= 6 ? '#fee2e2' : Number(r.meses_adeudados) >= 3 ? '#fef3c7' : '#fef9c3', color: Number(r.meses_adeudados) >= 6 ? '#991b1b' : Number(r.meses_adeudados) >= 3 ? '#92400e' : '#713f12' }}>{r.meses_adeudados}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: Number(r.total_adeudado) > 0 ? '#dc2626' : '#374151' }}>{fmtBs(r.total_adeudado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIngresos = () => {
    if (!data) return <div className="empty-state" style={{ padding: 40 }}><p>Sin datos</p></div>;
    const canceladas = Number(data.canceladas || 0);
    const pendientes = Number(data.pendientes || 0);
    const total = canceladas + pendientes;
    const pct = total > 0 ? (canceladas / total) * 100 : 0;
    const ap = data.aportes || {};
    const apTotal = Number(ap.total_aportes || 0);
    const apCancelados = Number(ap.cancelados || 0);
    const apMontoTotal = Number(ap.total_monto || 0);
    const percAp = apTotal > 0 ? (apCancelados / apTotal) * 100 : 0;
    const nivRows = data.ingresos_nivel || [];
    const maxVal = nivRows.length > 0 ? Math.max(...nivRows.map(x => Number(x.total_recaudado) + Number(x.total_pendiente)), 1) : 1;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#d1fae5', borderRadius: 10, padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#065f46', textTransform: 'uppercase', margin: '0 0 4px' }}>Canceladas</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#065f46', margin: 0 }}>{canceladas}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#065f46', margin: '4px 0 0' }}>{fmtBs(data.total_recaudado)}</p>
          </div>
          <div style={{ background: '#fee2e2', borderRadius: 10, padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', textTransform: 'uppercase', margin: '0 0 4px' }}>Pendientes</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#991b1b', margin: 0 }}>{pendientes}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#991b1b', margin: '4px 0 0' }}>{fmtBs(data.total_pendiente)}</p>
          </div>
          <div style={{ background: apCancelados > 0 ? '#d1fae5' : '#fef3c7', borderRadius: 10, padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#5F9EA0', textTransform: 'uppercase', margin: '0 0 4px' }}>Aportes</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', margin: 0 }}>{apCancelados}/{apTotal}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: '4px 0 0' }}>{fmtBs(apMontoTotal)} total</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Progreso de Cobranza</p>
            <div style={{ height: 28, borderRadius: 14, background: '#fee2e2', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', borderRadius: 14, background: 'linear-gradient(90deg, #22c55e, #16a34a)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {pct.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              <span><strong style={{ color: '#16a34a' }}>{fmtBs(data.total_recaudado)}</strong> recaudado</span>
              <span>Descuentos: {fmtBs(data.total_descuentos)}</span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Progreso de Aportes</p>
            <div style={{ height: 28, borderRadius: 14, background: '#f3e8ff', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', borderRadius: 14, background: 'linear-gradient(90deg, #a855f7, #7c3aed)', width: `${percAp}%`, transition: 'width 0.5s ease' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {percAp.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              <span><strong style={{ color: '#7c3aed' }}>{fmtBs(ap.total_cancelado || 0)}</strong> cobrado</span>
              <span>Pendiente: {fmtBs(ap.total_pendiente || 0)}</span>
            </div>
          </div>
        </div>

        {nivRows.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 16px' }}>Desglose por Nivel Educativo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nivRows.map((n) => {
                const totalRow = Number(n.total_recaudado) + Number(n.total_pendiente);
                const paidRow = Number(n.total_recaudado);
                const barWidth = maxVal > 0 ? (totalRow / maxVal * 100) : 0;
                return (
                  <div key={n.idnivel} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: '#374151', flexShrink: 0 }}>{n.nivel}</div>
                    <div style={{ flex: 1, position: 'relative', height: 24, borderRadius: 4, background: '#f3f4f6', overflow: 'hidden' }}>
                      {paidRow > 0 && (
                        <div style={{ position: 'absolute', height: '100%', width: `${paidRow / totalRow * 100}%`, background: '#22c55e', borderRadius: 4, zIndex: 2, transition: 'width 0.3s ease' }} />
                      )}
                      <div style={{ position: 'absolute', height: '100%', width: `${barWidth}%`, background: totalRow > 0 ? '#fee2e2' : '#f3f4f6', borderRadius: 4, zIndex: 1 }} />
                    </div>
                    <div style={{ width: 100, textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#374151', flexShrink: 0 }}>{fmtBs(totalRow)}</div>
                    <div style={{ width: 30, textAlign: 'center', fontSize: 10, fontWeight: 700, color: paidRow > 0 ? '#16a34a' : '#6b7280', flexShrink: 0 }}>
                      {totalRow > 0 ? (paidRow / totalRow * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ color: '#374151', fontSize: 13 }}>
          <p><strong>Resumen:</strong> De <strong>{total}</strong> mensualidades, <strong>{canceladas}</strong> están pagadas ({fmtBs(data.total_recaudado)}) y <strong>{pendientes}</strong> pendientes ({fmtBs(data.total_pendiente)}). Descuentos aplicados: {fmtBs(data.total_descuentos)}. Aportes: {apCancelados} de {apTotal} cobrados ({fmtBs(ap.total_cancelado || 0)}).</p>
        </div>
      </div>
    );
  };

  const renderBecas = () => {
    const rows = data?.rows || [];
    const grouped = {};
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    rows.forEach((r) => {
      const key = r.nombrebeca || 'Sin nombre';
      if (!grouped[key]) grouped[key] = { count: 0, estudiantes: [] };
      grouped[key].count++;
      grouped[key].estudiantes.push(r);
    });
    const totalBecados = data?.total_becados || 0;
    const totalMatriculados = data?.total_matriculados || 0;
    const pctBecados = totalMatriculados > 0 ? (totalBecados / totalMatriculados * 100) : 0;
    const groupKeys = Object.keys(grouped);
    const totalGrouped = groupKeys.reduce((s, k) => s + grouped[k].count, 0);

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', margin: '0 0 4px' }}>Total Becados</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{totalBecados}</p>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', margin: '0 0 4px' }}>Tipos de Beca</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{groupKeys.length}</p>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', margin: '0 0 4px' }}>% Becados</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{pctBecados.toFixed(1)}%</p>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', margin: '0 0 4px' }}>Total Matriculados</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', margin: 0 }}>{totalMatriculados}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 16px' }}>Distribución de Becas</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="180" height="180" viewBox="0 0 36 36">
                {groupKeys.map((key, i) => {
                  const count = grouped[key].count;
                  const pctGroup = totalGrouped > 0 ? (count / totalGrouped) : 0;
                  const prevPct = groupKeys.slice(0, i).reduce((s, k) => s + (grouped[k].count / totalGrouped), 0);
                  const circumference = 2 * Math.PI * 15.915;
                  const offset = circumference * (1 - pctGroup);
                  const prevOffset = circumference * prevPct;
                  return (
                    <circle key={key} cx="18" cy="18" r="15.915" fill="none" stroke={colors[i % colors.length]} strokeWidth="3" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} transform={`rotate(-90, 18, 18)`} strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease, stroke-dasharray 0.5s ease' }}
                    />
                  );
                })}
                <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="#1f2937" fontSize="5" fontWeight="800">{totalBecados}</text>
                <text x="18" y="23" textAnchor="middle" dominantBaseline="central" fill="#6b7280" fontSize="2.3">becados</text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {groupKeys.map((key, i) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: colors[i % colors.length] }}></span>
                  <span style={{ flex: 1, color: '#374151' }}>{key}</span>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>{grouped[key].count}</span>
                  <span style={{ color: '#6b7280' }}>({((grouped[key].count / totalGrouped) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 16px' }}>Estadísticas de Becas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Beca más común</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {groupKeys.length > 0 ? groupKeys.reduce((a, b) => grouped[a].count > grouped[b].count ? a : b) : '-'}
                </p>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Cobertura de becas</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>{totalBecados} de {totalMatriculados} estudiantes ({pctBecados.toFixed(1)}%)</p>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Promedio de descuento</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {rows.length > 0 ? (rows.reduce((s, r) => s + Number(r.porcentaje || 0), 0) / rows.length).toFixed(0) + '%' : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>CI</th>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Nivel</th>
                <th>Beca</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'center' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>No hay estudiantes con beca</p></div></td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.ci}</td>
                  <td style={{ fontWeight: 600 }}>{r.nombre} {r.apellido}</td>
                  <td>{r.curso}</td>
                  <td>{r.nivel}</td>
                  <td>{r.nombrebeca}</td>
                  <td><span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11 }}>{r.tipobeca || '-'}</span></td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {Object.keys(grouped).length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {Object.entries(grouped).map(([nombre, g]) => (
              <div key={nombre} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', margin: '0 0 4px' }}>{nombre}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{g.count} estudiante{(g.count !== 1 ? 's' : '')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="card-header-icon"><i className="fas fa-chart-bar"></i></div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Reportes</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Gestión:</label>
            <select value={idgestion} onChange={(e) => setIdgestion(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, fontWeight: 500 }}>
              <option value="">Seleccionar</option>
              {gestiones.map((g) => (
                <option key={g.idgestion} value={g.idgestion}>
                  {g.descripcion || `Gestión ${g.idgestion}`} {g.estado === '1' ? '(Activa)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8, background: '#fff', borderRadius: 10, padding: 4, border: '1px solid #e5e7eb' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 16px', border: 'none', borderRadius: 8,
              background: tab === t.key ? '#5F9EA0' : 'transparent',
              color: tab === t.key ? '#fff' : '#374151',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <i className={`fas ${t.icon}`} style={{ fontSize: 14 }}></i>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        {renderFilters()}
      </div>

      <div className="card" style={{ padding: 20 }}>
        {renderTable()}
      </div>
    </div>
  );
}
