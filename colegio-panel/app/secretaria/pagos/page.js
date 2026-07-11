'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function PagosPage() {
  const router = useRouter();
  const [tab, setTab] = useState('mensualidades');
  const [token, setToken] = useState(null);
  const [gestionActiva, setGestionActiva] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [matriculas, setMatriculas] = useState([]);

  const [mensualidades, setMensualidades] = useState({});
  const [cargandoMen, setCargandoMen] = useState({});

  const [pagoModal, setPagoModal] = useState(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pagoError, setPagoError] = useState('');
  const [methodError, setMethodError] = useState(false);

  const [pagarTodoModal, setPagarTodoModal] = useState(null);
  const [ptStep, setPtStep] = useState(1);
  const [ptMethod, setPtMethod] = useState(null);
  const [ptProcessing, setPtProcessing] = useState(false);
  const [ptSuccess, setPtSuccess] = useState(false);
  const [ptError, setPtError] = useState('');
  const [ptMethodError, setPtMethodError] = useState(false);

  const [montoBase, setMontoBase] = useState(0);
  const [descuentoBeca, setDescuentoBeca] = useState(0);
  const [completando, setCompletando] = useState(false);
  const [msjCompletar, setMsjCompletar] = useState(null);

  const [aportes, setAportes] = useState({});
  const [cargandoAp, setCargandoAp] = useState({});
  const [apMontoBase, setApMontoBase] = useState(0);
  const [apCompletando, setApCompletando] = useState(false);

  const [apPagoModal, setApPagoModal] = useState(null);
  const [apPaymentStep, setApPaymentStep] = useState(1);
  const [apSelectedMethod, setApSelectedMethod] = useState(null);
  const [apPaymentProcessing, setApPaymentProcessing] = useState(false);
  const [apPaymentSuccess, setApPaymentSuccess] = useState(false);
  const [apPagoError, setApPagoError] = useState('');
  const [apMethodError, setApMethodError] = useState(false);
  const [reciboModal, setReciboModal] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    Promise.all([
      api.gestiones.listar(t),
      api.secretaria.listarEstudiantes(t),
    ]).then(([g, e]) => {
      setEstudiantes(e.data || []);
      const activa = g.data.find((gx) => gx.estado === '1');
      if (activa) setGestionActiva(activa);
    }).catch(() => {});
  }, []);

  const selectStudent = async (est) => {
    setSelectedStudent(est);
    setShowStudentModal(false);
    if (!token || !gestionActiva) return;
    try {
      const res = await api.matriculacion.listar(token, { ciestudiante: est.ci, idgestion: gestionActiva.idgestion });
      setMatriculas(res.data || []);
      (res.data || []).forEach((m) => {
        cargarMensualidades(m.idmatriculacion);
        cargarAportes(m.idmatriculacion);
      });
    } catch {}
  };

  const cargarMensualidades = async (idmat) => {
    setCargandoMen((prev) => ({ ...prev, [idmat]: true }));
    try {
      const res = await api.mensualidades.listar(token, { idmatriculacion: idmat });
      setMensualidades((prev) => ({ ...prev, [idmat]: res.data }));
      if (res.data && res.data.length > 0) {
        setMontoBase(Number(res.data[0].monto));
        setDescuentoBeca(Number(res.data[0].descuento || 0));
      }
    } catch {}
    setCargandoMen((prev) => ({ ...prev, [idmat]: false }));
  };

  const cargarAportes = async (idmat) => {
    setCargandoAp((prev) => ({ ...prev, [idmat]: true }));
    try {
      const res = await api.aportes.listar(token, { matricula: idmat });
      setAportes((prev) => ({ ...prev, [idmat]: res.data }));
      if (res.data && res.data.length > 0) {
        setApMontoBase(Number(res.data[0].monto));
      }
    } catch {}
    setCargandoAp((prev) => ({ ...prev, [idmat]: false }));
  };

  useEffect(() => {
    if (!token || !gestionActiva) return;
    if (selectedStudent) {
      api.matriculacion.listar(token, { ciestudiante: selectedStudent.ci, idgestion: gestionActiva.idgestion })
        .then((res) => {
          setMatriculas(res.data || []);
          (res.data || []).forEach((m) => {
            cargarMensualidades(m.idmatriculacion);
            cargarAportes(m.idmatriculacion);
          });
        }).catch(() => {});
    }
  }, [gestionActiva]);

  const handleCompletar = async () => {
    if (!token || !gestionActiva) return;
    if (!confirm('¿Generar mensualidades faltantes para todas las matrículas de la gestión actual?')) return;
    setCompletando(true);
    setMsjCompletar(null);
    try {
      const res = await api.mensualidades.completar(token, { idgestion: gestionActiva.idgestion });
      setMsjCompletar({ tipo: 'exito', texto: `${res.data.generadas} mensualidades generadas` });
      if (selectedStudent) {
        const r2 = await api.matriculacion.listar(token, { ciestudiante: selectedStudent.ci, idgestion: gestionActiva.idgestion });
        setMatriculas(r2.data || []);
        (r2.data || []).forEach((m) => cargarMensualidades(m.idmatriculacion));
      }
    } catch (err) {
      setMsjCompletar({ tipo: 'error', texto: err.message || err.error || 'Error al completar mensualidades' });
    } finally {
      setCompletando(false);
      setTimeout(() => setMsjCompletar(null), 5000);
    }
  };

  const completarAportes = async () => {
    if (!gestionActiva) return;
    setApCompletando(true);
    try {
      await api.aportes.completar(token, { idgestion: gestionActiva.idgestion });
      if (selectedStudent) {
        const res = await api.aportes.listar(token, { matricula: matriculas[0]?.idmatriculacion });
        setAportes((prev) => ({ ...prev, [matriculas[0]?.idmatriculacion]: res.data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApCompletando(false);
    }
  };

  const searchStudents = (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const filtered = estudiantes.filter((e) =>
      e.ci.toLowerCase().includes(q.toLowerCase()) ||
      (e.apellido || '').toLowerCase().includes(q.toLowerCase()) ||
      (e.nombre || '').toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const puedePagar = (items, idx) => {
    if (idx === 0) return true;
    return items[idx - 1].tipopago !== null;
  };

  const tipoBadge = (tipo) => {
    if (tipo === 'E') return { cls: 'badge badge-active', label: 'Efectivo' };
    if (tipo === 'Q') return { cls: 'badge badge-active', label: 'QR' };
    if (tipo === 'A') return { cls: 'badge badge-active', label: 'Automático' };
    return { cls: 'badge badge-inactive', label: 'Pendiente' };
  };

  const openPagoModal = (idmat, idmen, nro) => {
    setPagoModal({ idmat, idmen, nro });
    setPaymentStep(1);
    setSelectedMethod(null);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setPagoError('');
    setMethodError(false);
  };

  const proceedToStep2 = () => {
    setPaymentStep(2);
  };

  const proceedToConfirmation = () => {
    if (!selectedMethod) { setMethodError(true); setTimeout(() => setMethodError(false), 4000); return; }
    setMethodError(false);
    setPaymentStep(3);
    confirmarPago();
  };

  const confirmarPago = async () => {
    setPaymentProcessing(true);
    setPagoError('');
    try {
      await api.mensualidades.pagar(token, pagoModal.idmat, pagoModal.idmen, { tipopago: selectedMethod });
      setPaymentSuccess(true);
      setPaymentProcessing(false);
      cargarMensualidades(pagoModal.idmat);
    } catch (err) {
      setPagoError(err.message || 'Error al registrar pago');
      setPaymentProcessing(false);
    }
  };

  const closePagoModal = () => {
    setPagoModal(null);
    setPaymentStep(1);
    setSelectedMethod(null);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setPagoError('');
    setMethodError(false);
  };

  const openPagarTodo = (idmat) => {
    setPagarTodoModal({ idmat });
    setPtStep(1);
    setPtMethod(null);
    setPtProcessing(false);
    setPtSuccess(false);
    setPtError('');
    setPtMethodError(false);
  };

  const confirmarPagarTodo = async () => {
    if (!ptMethod) { setPtMethodError(true); setTimeout(() => setPtMethodError(false), 4000); return; }
    setPtMethodError(false);
    setPtStep(3);
    setPtProcessing(true);
    setPtError('');
    try {
      await api.mensualidades.pagarTodo(token, pagarTodoModal.idmat, { tipopago: ptMethod });
      setPtSuccess(true);
      setPtProcessing(false);
      cargarMensualidades(pagarTodoModal.idmat);
    } catch (err) {
      setPtError(err.message || 'Error al pagar');
      setPtProcessing(false);
    }
  };

  const closePagarTodoModal = () => {
    setPagarTodoModal(null);
    setPtStep(1);
    setPtMethod(null);
    setPtProcessing(false);
    setPtSuccess(false);
    setPtError('');
    setPtMethodError(false);
  };

  const openApPagoModal = (idmat, idaporte, nro) => {
    setApPagoModal({ idmat, idaporte, nro });
    setApPaymentStep(1);
    setApSelectedMethod(null);
    setApPaymentProcessing(false);
    setApPaymentSuccess(false);
    setApPagoError('');
    setApMethodError(false);
  };

  const proceedToApStep2 = () => setApPaymentStep(2);

  const proceedToApConfirmation = () => {
    if (!apSelectedMethod) { setApMethodError(true); setTimeout(() => setApMethodError(false), 4000); return; }
    setApMethodError(false);
    setApPaymentStep(3);
    confirmarApPago();
  };

  const confirmarApPago = async () => {
    setApPaymentProcessing(true);
    setApPagoError('');
    try {
      await api.aportes.pagar(token, apPagoModal.idaporte, { tipopago: apSelectedMethod });
      setApPaymentSuccess(true);
      setApPaymentProcessing(false);
      cargarAportes(apPagoModal.idmat);
    } catch (err) {
      setApPagoError(err.message || 'Error al registrar pago');
      setApPaymentProcessing(false);
    }
  };

  const closeApPagoModal = () => {
    setApPagoModal(null);
    setApPaymentStep(1);
    setApSelectedMethod(null);
    setApPaymentProcessing(false);
    setApPaymentSuccess(false);
    setApPagoError('');
    setApMethodError(false);
  };

  const totalPagado = Object.values(mensualidades).flat().filter((m) => m.tipopago !== null).length;
  const totalMensualidades = Object.values(mensualidades).flat().length;
  const montoTotalPagado = Object.values(mensualidades).flat()
    .filter((m) => m.tipopago !== null)
    .reduce((sum, m) => sum + Number(m.totalpagar), 0);

  const descuentoPorcentaje = montoBase > 0 ? Math.round((descuentoBeca / montoBase) * 100) : 0;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 20 }}>
              <i className="fas fa-money-bill"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>Pagos</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Consulta y gestiona pagos de mensualidades y aportes</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ display: 'flex', gap: 0, background: '#f3f4f6', borderRadius: 10, padding: 4, maxWidth: 380 }}>
            <button onClick={() => setTab('mensualidades')} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: tab === 'mensualidades' ? '#fff' : 'transparent',
              color: tab === 'mensualidades' ? '#2e7d7e' : '#6b7280',
              boxShadow: tab === 'mensualidades' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}>
              <i className="fas fa-money-bill" style={{ marginRight: 6 }}></i> Mensualidades
            </button>
            <button onClick={() => setTab('aportes')} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: tab === 'aportes' ? '#fff' : 'transparent',
              color: tab === 'aportes' ? '#2e7d7e' : '#6b7280',
              boxShadow: tab === 'aportes' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}>
              <i className="fas fa-hand-holding-usd" style={{ marginRight: 6 }}></i> Aportes
            </button>
          </div>
        </div>
      </div>

      {tab === 'mensualidades' ? (
        <>
          {msjCompletar && (
            <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: msjCompletar.tipo === 'exito' ? '#d1fae5' : '#fee2e2', color: msjCompletar.tipo === 'exito' ? '#065f46' : '#991b1b' }}>
              <i className={`fas ${msjCompletar.tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {msjCompletar.texto}
            </div>
          )}

          <div className="card">
            <div className="toolbar" style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Gestión Activa</label>
                <div style={{ padding: '8px 14px', background: '#e6f4f5', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#2e7d7e', whiteSpace: 'nowrap' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: 6, fontSize: 12 }}></i>
                  {gestionActiva?.descripcion || 'Cargando...'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <button className="btn-sm btn-primary" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowStudentModal(true); }}>
                  <i className="fas fa-search"></i> Buscar Estudiante
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button className="btn-sm btn-secondary" onClick={handleCompletar} disabled={completando}>
                  <i className={`fas ${completando ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                  {completando ? 'Generando...' : 'Completar mensualidades'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn-sm btn-secondary" onClick={() => { setSelectedStudent(null); setMatriculas([]); setMensualidades({}); setAportes({}); }}>
                <i className="fas fa-times"></i> Limpiar Búsqueda
              </button>
            </div>

            {selectedStudent && matriculas.length > 0 && (
              <>
                <div style={{ marginTop: 16, padding: 20, background: 'linear-gradient(135deg, #e6f4f5, #c8e6e7)', borderRadius: 12, border: '1px solid #b2dfdb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d7e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Información del Estudiante</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Estudiante</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedStudent.nombre} {selectedStudent.apellido}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>CI</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{selectedStudent.ci}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Nivel</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matriculas[0]?.nivel_nombre || '-'}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Curso</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matriculas[0]?.curso_descripcion || '-'}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Beca</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {descuentoPorcentaje > 0 ? `${descuentoPorcentaje}%` : 'Sin beca'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: 20, background: 'linear-gradient(135deg, #e6f4f5, #e8f5e9)', borderRadius: 12, border: '1px solid #b2dfdb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d7e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Información de Pago</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Monto Base</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Bs {montoBase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Descuento Beca</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: descuentoBeca > 0 ? '#2e7d7e' : '#6b7280' }}>
                        {descuentoPorcentaje > 0 ? `${descuentoPorcentaje}% (Bs ${descuentoBeca.toFixed(2)})` : 'Sin descuento'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Monto a Pagar Mensual</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Bs {(montoBase - descuentoBeca).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn-sm btn-secondary" onClick={() => router.push('/secretaria/pagos/deudores')}>
              <i className="fas fa-exclamation-triangle"></i> Ver Deudores
            </button>
            <button className="btn-sm btn-secondary" onClick={() => router.push('/secretaria/pagos/historial')}>
              <i className="fas fa-history"></i> Historial
            </button>
          </div>

          {selectedStudent && matriculas.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <i className="fas fa-money-bill" style={{ fontSize: 40, color: '#d1d5db', marginBottom: 12 }}></i>
              <p style={{ color: '#6b7280', fontWeight: 600 }}>No hay matrículas activas para esta gestión</p>
            </div>
          )}

          {matriculas.map((m) => (
            <div key={m.idmatriculacion} className="card">
              <div className="card-header" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 12 }}>
                    <i className="fas fa-file-signature"></i>
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Matrícula #{m.idmatriculacion}</h3>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>— {m.curso_descripcion} ({m.nivel_nombre}) — {m.gestion_nombre}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{totalPagado}</span>/{totalMensualidades} pagadas
                  </div>
                  {totalPagado < totalMensualidades && (
                    <button className="btn-sm btn-primary" onClick={() => openPagarTodo(m.idmatriculacion)} style={{ background: '#0d9488', fontSize: 12 }}>
                      <i className="fas fa-hand-holding-usd"></i> Pagar todo
                    </button>
                  )}
                </div>
              </div>

              {cargandoMen[m.idmatriculacion] ? (
                <div className="loading">Cargando mensualidades...</div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-sort-numeric-up" style={{ marginRight: 6 }}></i>N°</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-money-bill" style={{ marginRight: 6 }}></i>Monto</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-money-bill-wave" style={{ marginRight: 6 }}></i>Desc. (Bs)</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-calculator" style={{ marginRight: 6 }}></i>Total</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-flag" style={{ marginRight: 6 }}></i>Estado</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-credit-card" style={{ marginRight: 6 }}></i>Tipo Pago</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-calendar-day" style={{ marginRight: 6 }}></i>Fecha Pago</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-cog" style={{ marginRight: 6 }}></i>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(mensualidades[m.idmatriculacion] || []).length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty-state">
                              <i className="fas fa-money-bill"></i>
                              <p>No hay mensualidades registradas</p>
                              <span className="empty-sub">Las mensualidades se generan automáticamente</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (mensualidades[m.idmatriculacion] || []).map((men, idx) => {
                          const tb = tipoBadge(men.tipopago);
                          const puede = puedePagar(mensualidades[m.idmatriculacion] || [], idx);
                          return (
                            <tr key={men.idmensualidad}>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                                  {men.nro}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>Bs {Number(men.monto).toFixed(2)}</div></td>
                              <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>Bs {Number(men.descuento || 0).toFixed(2)}</div></td>
                              <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Bs {Number(men.totalpagar).toFixed(2)}</div></td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge" style={{ background: men.tipopago ? '#d4edda' : '#fff3cd', color: men.tipopago ? '#155724' : '#856404' }}>
                                  {men.tipopago ? 'Pagado' : 'Pendiente'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {men.tipopago ? (
                                  <span className={tb.cls}>{tb.label}</span>
                                ) : (
                                  <span className="badge badge-inactive">—</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#374151' }}>
                                  {men.fechapago ? new Date(men.fechapago).toLocaleDateString() : '-'}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {!men.tipopago ? (
                                  puede ? (
                                    <button className="btn-sm btn-primary" onClick={() => openPagoModal(m.idmatriculacion, men.idmensualidad, men.nro)}>
                                      <i className="fas fa-hand-holding-usd"></i> Pagar
                                    </button>
                                  ) : (
                                    <span className="btn-sm" style={{ background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed', opacity: 0.6 }}>
                                      <i className="fas fa-lock"></i> Bloqueado
                                    </span>
                                  )
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                                      <i className="fas fa-check-circle"></i> Pagado
                                    </span>
                                    <button className="btn-sm" style={{ background: '#e6f4f5', color: '#2e7d7e', fontSize: 11, border: 'none', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
                                      onClick={() => setReciboModal({ item: men, type: 'mensualidad' })}>
                                      <i className="fas fa-receipt"></i> Recibo
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {pagoModal && (
            <div className="modal-overlay" onClick={() => closePagoModal()} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div style={{ background: 'linear-gradient(135deg, #5F9EA0, #4a8678)', margin: -24, marginBottom: 0, padding: 20, borderRadius: '12px 12px 0 0', color: '#fff' }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Realizar Pago de Mensualidad</h3>
                </div>

                <div style={{ padding: '20px 0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {[1, 2, 3].map((step) => (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                        {step > 1 && (
                          <div style={{ position: 'absolute', top: 16, right: '50%', width: '100%', height: 2, zIndex: 0 }}>
                            <div style={{ height: '100%', background: paymentStep > step - 1 ? '#5F9EA0' : '#e5e7eb', transition: 'all 0.3s' }}></div>
                          </div>
                        )}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, zIndex: 1,
                          background: paymentStep >= step ? '#5F9EA0' : '#e5e7eb',
                          color: paymentStep >= step ? '#fff' : '#6b7280',
                          transition: 'all 0.3s'
                        }}>
                          {step}
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, color: paymentStep >= step ? '#1f2937' : '#9ca3af' }}>
                          {step === 1 ? 'Verificar Pago' : step === 2 ? 'Seleccionar Método' : 'Confirmación'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {paymentStep === 1 && (
                  <div style={{ padding: '16px 0', minHeight: 160 }}>
                    <div style={{ background: '#e6f4f5', borderRadius: 8, padding: 16, border: '1px solid #b2dfdb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mes:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Mensualidad #{pagoModal.nro}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Estudiante:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selectedStudent?.nombre} {selectedStudent?.apellido}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #b2dfdb' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Monto a Pagar:</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#2e7d7e' }}>
                          Bs {(() => { const m = (mensualidades[pagoModal.idmat] || []).find(x => x.idmensualidad === pagoModal.idmen); return m ? Number(m.totalpagar).toFixed(2) : '0.00'; })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStep === 2 && (
                  <div style={{ padding: '16px 0', minHeight: 160 }}>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                      <button onClick={() => setSelectedMethod('E')} style={{
                        width: 140, padding: '16px 12px', borderRadius: 8, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        background: selectedMethod === 'E' ? '#e6f4f5' : '#fff',
                        borderColor: selectedMethod === 'E' ? '#5F9EA0' : '#d1d5db',
                        color: selectedMethod === 'E' ? '#2e7d7e' : '#374151'
                      }}>
                        <i className="fas fa-money-bill" style={{ fontSize: 24, marginBottom: 8 }}></i>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Efectivo</p>
                      </button>
                      <button onClick={() => setSelectedMethod('Q')} style={{
                        width: 140, padding: '16px 12px', borderRadius: 8, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        background: selectedMethod === 'Q' ? '#e6f4f5' : '#fff',
                        borderColor: selectedMethod === 'Q' ? '#5F9EA0' : '#d1d5db',
                        color: selectedMethod === 'Q' ? '#2e7d7e' : '#374151'
                      }}>
                        <i className="fas fa-qrcode" style={{ fontSize: 24, marginBottom: 8 }}></i>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Código QR</p>
                      </button>
                    </div>
                    {methodError && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#e6f4f5', borderRadius: 8, border: '1px solid #b2dfdb', fontSize: 13, color: '#2e7d7e', textAlign: 'center' }}>
                        <i className="fas fa-info-circle"></i> Selecciona un método de pago para continuar
                      </div>
                    )}
                  </div>
                )}

                {paymentStep === 3 && (
                  <div style={{ padding: '16px 0', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentProcessing && !paymentSuccess && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#e6f4f5', marginBottom: 12, animation: 'pulse 1.5s infinite' }}>
                          <i className="fas fa-money-bill" style={{ fontSize: 24, color: '#5F9EA0' }}></i>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Realizando Pago</p>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>Procesando tu pago...</p>
                      </div>
                    )}
                    {paymentSuccess && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#d4edda', marginBottom: 12 }}>
                          <i className="fas fa-check" style={{ fontSize: 24, color: '#155724' }}></i>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>¡Pago Realizado!</p>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Tu pago ha sido procesado correctamente</p>
                        <div style={{ background: '#e6f4f5', borderRadius: 8, padding: 12, border: '1px solid #b2dfdb', textAlign: 'left', minWidth: 250 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Monto Pagado:</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d7e' }}>
                              Bs {(() => { const m = (mensualidades[pagoModal.idmat] || []).find(x => x.idmensualidad === pagoModal.idmen); return m ? Number(m.totalpagar).toFixed(2) : '0.00'; })()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Método:</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selectedMethod === 'E' ? 'Efectivo' : selectedMethod === 'Q' ? 'QR' : '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {pagoError && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8d7da', borderRadius: 8, border: '1px solid #f5c6cb', fontSize: 13, color: '#721c24' }}>
                        <i className="fas fa-exclamation-circle"></i> {pagoError}
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-actions" style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {paymentStep === 1 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => closePagoModal()}>Cancelar</button>
                      <button className="btn-sm btn-primary" onClick={() => proceedToStep2()}>Siguiente</button>
                    </>
                  )}
                  {paymentStep === 2 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => setPaymentStep(1)}>Atrás</button>
                      <button className="btn-sm btn-primary" onClick={() => proceedToConfirmation()}>Confirmar Pago</button>
                    </>
                  )}
                  {paymentStep === 3 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => closePagoModal()}>Cerrar</button>
                      {paymentSuccess && (
                        <button className="btn-sm btn-primary" onClick={() => closePagoModal()}>Finalizar</button>
                      )}
                      {!paymentSuccess && !paymentProcessing && pagoError && (
                        <button className="btn-sm btn-primary" onClick={() => { setPaymentStep(2); setPagoError(''); }}>Reintentar</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {pagarTodoModal && (
            <div className="modal-overlay" onClick={() => closePagarTodoModal()} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div style={{ background: 'linear-gradient(135deg, #0d9488, #057a6b)', margin: -24, marginBottom: 0, padding: 20, borderRadius: '12px 12px 0 0', color: '#fff' }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Pagar Todas las Mensualidades</h3>
                </div>

                <div style={{ padding: '20px 0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {[1, 2, 3].map((step) => (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                        {step > 1 && (
                          <div style={{ position: 'absolute', top: 16, right: '50%', width: '100%', height: 2, zIndex: 0 }}>
                            <div style={{ height: '100%', background: ptStep > step - 1 ? '#0d9488' : '#e5e7eb', transition: 'all 0.3s' }}></div>
                          </div>
                        )}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, zIndex: 1,
                          background: ptStep >= step ? '#0d9488' : '#e5e7eb',
                          color: ptStep >= step ? '#fff' : '#6b7280',
                          transition: 'all 0.3s'
                        }}>
                          {step}
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, color: ptStep >= step ? '#1f2937' : '#9ca3af' }}>
                          {step === 1 ? 'Verificar' : step === 2 ? 'Método de Pago' : 'Confirmación'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {ptStep === 1 && (
                  <div style={{ padding: '16px 0', minHeight: 160 }}>
                    <div style={{ background: '#e6f4f5', borderRadius: 8, padding: 16, border: '1px solid #b2dfdb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Matrícula:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>#{pagarTodoModal.idmat}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Estudiante:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selectedStudent?.nombre} {selectedStudent?.apellido}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mensualidades pendientes:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                          {Object.values(mensualidades).flat().filter(m => m.tipopago === null).length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #b2dfdb' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Descuento por pago al contado:</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0d9488' }}>5%</span>
                      </div>
                    </div>
                  </div>
                )}

                {ptStep === 2 && (
                  <div style={{ padding: '16px 0', minHeight: 160 }}>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                      <button onClick={() => setPtMethod('E')} style={{
                        width: 140, padding: '16px 12px', borderRadius: 8, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        background: ptMethod === 'E' ? '#e6f4f5' : '#fff',
                        borderColor: ptMethod === 'E' ? '#0d9488' : '#d1d5db',
                        color: ptMethod === 'E' ? '#0d9488' : '#374151'
                      }}>
                        <i className="fas fa-money-bill" style={{ fontSize: 24, marginBottom: 8 }}></i>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Efectivo</p>
                      </button>
                      <button onClick={() => setPtMethod('Q')} style={{
                        width: 140, padding: '16px 12px', borderRadius: 8, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        background: ptMethod === 'Q' ? '#e6f4f5' : '#fff',
                        borderColor: ptMethod === 'Q' ? '#0d9488' : '#d1d5db',
                        color: ptMethod === 'Q' ? '#0d9488' : '#374151'
                      }}>
                        <i className="fas fa-qrcode" style={{ fontSize: 24, marginBottom: 8 }}></i>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Código QR</p>
                      </button>
                    </div>
                    {ptMethodError && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#e6f4f5', borderRadius: 8, border: '1px solid #b2dfdb', fontSize: 13, color: '#0d9488', textAlign: 'center' }}>
                        <i className="fas fa-info-circle"></i> Selecciona un método de pago para continuar
                      </div>
                    )}
                  </div>
                )}

                {ptStep === 3 && (
                  <div style={{ padding: '16px 0', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {ptProcessing && !ptSuccess && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#e6f4f5', marginBottom: 12, animation: 'pulse 1.5s infinite' }}>
                          <i className="fas fa-money-bill" style={{ fontSize: 24, color: '#0d9488' }}></i>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Pagando todas las mensualidades</p>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>Aplicando descuento del 5%...</p>
                      </div>
                    )}
                    {ptSuccess && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#d4edda', marginBottom: 12 }}>
                          <i className="fas fa-check" style={{ fontSize: 24, color: '#155724' }}></i>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>¡Pago Exitoso!</p>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Todas las mensualidades fueron pagadas con descuento del 5%</p>
                      </div>
                    )}
                    {ptError && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8d7da', borderRadius: 8, border: '1px solid #f5c6cb', fontSize: 13, color: '#721c24' }}>
                        <i className="fas fa-exclamation-circle"></i> {ptError}
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-actions" style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {ptStep === 1 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => closePagarTodoModal()}>Cancelar</button>
                      <button className="btn-sm btn-primary" onClick={() => setPtStep(2)} style={{ background: '#0d9488' }}>Siguiente</button>
                    </>
                  )}
                  {ptStep === 2 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => setPtStep(1)}>Atrás</button>
                      <button className="btn-sm btn-primary" onClick={confirmarPagarTodo} style={{ background: '#0d9488' }}>Confirmar Pago</button>
                    </>
                  )}
                  {ptStep === 3 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => closePagarTodoModal()}>Cerrar</button>
                      {ptSuccess && (
                        <button className="btn-sm btn-primary" onClick={() => closePagarTodoModal()} style={{ background: '#0d9488' }}>Finalizar</button>
                      )}
                      {!ptSuccess && !ptProcessing && ptError && (
                        <button className="btn-sm btn-primary" onClick={() => { setPtStep(2); setPtError(''); }} style={{ background: '#0d9488' }}>Reintentar</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card">
            <div className="toolbar" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Gestión Activa</label>
                <div style={{ padding: '8px 14px', background: '#e6f4f5', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#2e7d7e', whiteSpace: 'nowrap' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: 6, fontSize: 12 }}></i>
                  {gestionActiva?.descripcion || 'Cargando...'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 6 }}>
                <button className="btn-sm btn-secondary" onClick={completarAportes} disabled={apCompletando || !gestionActiva} title="Completar aportes faltantes">
                  <i className={`fas ${apCompletando ? 'fa-spinner fa-spin' : 'fa-plus-circle'}`}></i> {apCompletando ? 'Generando...' : 'Completar Aportes'}
                </button>
                <button className="btn-sm btn-primary" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowStudentModal(true); }}>
                  <i className="fas fa-search"></i> Buscar Estudiante
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn-sm btn-secondary" onClick={() => { setSelectedStudent(null); setMatriculas([]); setAportes({}); setMensualidades({}); }}>
                <i className="fas fa-times"></i> Limpiar Búsqueda
              </button>
            </div>

            {selectedStudent && matriculas.length > 0 && (
              <>
                <div style={{ marginTop: 16, padding: 20, background: 'linear-gradient(135deg, #e6f4f5, #c8e6e7)', borderRadius: 12, border: '1px solid #b2dfdb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d7e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Información del Estudiante</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Estudiante</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedStudent.nombre} {selectedStudent.apellido}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>CI</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{selectedStudent.ci}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Curso</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matriculas[0]?.curso_descripcion || '-'}</p>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #b2dfdb' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Nivel</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matriculas[0]?.nivel_nombre || '-'}</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: 20, background: 'linear-gradient(135deg, #e6f4f5, #e8f5e9)', borderRadius: 12, border: '1px solid #b2dfdb' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#2e7d7e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Información de Pago</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Monto Base Aporte</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Bs {apMontoBase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#5F9EA0', textTransform: 'uppercase', marginBottom: 2 }}>Estado</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#2e7d7e' }}>
                        {Object.values(aportes).flat().filter(a => a.tipopago === null).length > 0 ? 'Pendiente' : 'Al día'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedStudent && matriculas.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <i className="fas fa-hand-holding-usd" style={{ fontSize: 40, color: '#d1d5db', marginBottom: 12 }}></i>
              <p style={{ color: '#6b7280', fontWeight: 600 }}>No hay matrículas activas para esta gestión</p>
            </div>
          )}

          {matriculas.map((m) => (
            <div key={m.idmatriculacion} className="card">
              <div className="card-header" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 12 }}>
                    <i className="fas fa-file-signature"></i>
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Matrícula #{m.idmatriculacion}</h3>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>— {m.curso_descripcion} ({m.nivel_nombre}) — {m.gestion_nombre}</span>
                </div>
              </div>

              {cargandoAp[m.idmatriculacion] ? (
                <div className="loading">Cargando aportes...</div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-sort-numeric-up" style={{ marginRight: 6 }}></i>N°</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-money-bill" style={{ marginRight: 6 }}></i>Monto</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-money-bill-wave" style={{ marginRight: 6 }}></i>Desc. (Bs)</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-calculator" style={{ marginRight: 6 }}></i>Total</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-flag" style={{ marginRight: 6 }}></i>Estado</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-credit-card" style={{ marginRight: 6 }}></i>Tipo Pago</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-calendar-day" style={{ marginRight: 6 }}></i>Fecha Pago</th>
                        <th style={{ textAlign: 'center' }}><i className="fas fa-cog" style={{ marginRight: 6 }}></i>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(aportes[m.idmatriculacion] || []).length === 0 ? (
                        <tr>
                          <td colSpan={8}>
                            <div className="empty-state">
                              <i className="fas fa-hand-holding-usd"></i>
                              <p>No hay aportes registrados</p>
                              <span className="empty-sub">Los aportes se generan automáticamente</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (aportes[m.idmatriculacion] || []).map((a, idx) => {
                          const puede = puedePagar(aportes[m.idmatriculacion] || [], idx);
                          return (
                            <tr key={a.idaporte}>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                                  {a.nro}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>Bs {Number(a.monto).toFixed(2)}</div></td>
                              <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>Bs {Number(a.descuento || 0).toFixed(2)}</div></td>
                              <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Bs {Number(a.totalpagar).toFixed(2)}</div></td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge" style={{ background: a.tipopago ? '#d4edda' : '#fff3cd', color: a.tipopago ? '#155724' : '#856404' }}>
                                  {a.tipopago ? 'Pagado' : 'Pendiente'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {a.tipopago ? (
                                  <span className="badge badge-active">{a.tipopago === 'E' ? 'Efectivo' : a.tipopago === 'Q' ? 'QR' : '-'}</span>
                                ) : (
                                    <span className="badge badge-inactive">—</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '14px', color: '#374151' }}>
                                    {a.fechapago ? new Date(a.fechapago).toLocaleDateString() : '-'}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {!a.tipopago ? (
                                    puede ? (
                                      <button className="btn-sm btn-primary" onClick={() => openApPagoModal(m.idmatriculacion, a.idaporte, a.nro)}>
                                        <i className="fas fa-hand-holding-usd"></i> Pagar
                                      </button>
                                    ) : (
                                      <span className="btn-sm" style={{ background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed', opacity: 0.6 }}>
                                        <i className="fas fa-lock"></i> Bloqueado
                                      </span>
                                    )
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                      <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
                                        <i className="fas fa-check-circle"></i> Pagado
                                      </span>
                                      <button className="btn-sm" style={{ background: '#e6f4f5', color: '#2e7d7e', fontSize: 11, border: 'none', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
                                        onClick={() => setReciboModal({ item: a, type: 'aporte' })}>
                                        <i className="fas fa-receipt"></i> Recibo
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            {apPagoModal && (
            <div className="modal-overlay" onClick={() => closeApPagoModal()} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div style={{ background: 'linear-gradient(135deg, #5F9EA0, #4a8678)', margin: -24, marginBottom: 0, padding: 20, borderRadius: '12px 12px 0 0', color: '#fff' }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Realizar Pago de Aporte</h3>
                </div>

                <div style={{ padding: '20px 0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {[1, 2, 3].map((step) => (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                        {step > 1 && (
                          <div style={{ position: 'absolute', top: 16, right: '50%', width: '100%', height: 2, zIndex: 0 }}>
                            <div style={{ height: '100%', background: apPaymentStep > step - 1 ? '#5F9EA0' : '#e5e7eb', transition: 'all 0.3s' }}></div>
                          </div>
                        )}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, zIndex: 1,
                          background: apPaymentStep >= step ? '#5F9EA0' : '#e5e7eb',
                          color: apPaymentStep >= step ? '#fff' : '#6b7280',
                          transition: 'all 0.3s'
                        }}>
                          {step}
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, color: apPaymentStep >= step ? '#1f2937' : '#9ca3af' }}>
                          {step === 1 ? 'Verificar Pago' : step === 2 ? 'Seleccionar Método' : 'Confirmación'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {apPaymentStep === 1 && (
                  <div style={{ padding: '16px 0', minHeight: 160 }}>
                    <div style={{ background: '#e6f4f5', borderRadius: 8, padding: 16, border: '1px solid #b2dfdb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Aporte N°:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>#{apPagoModal.nro}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Estudiante:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selectedStudent?.nombre} {selectedStudent?.apellido}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #b2dfdb' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Monto a Pagar:</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#2e7d7e' }}>
                          Bs {(() => { const a = (aportes[apPagoModal.idmat] || []).find(x => x.idaporte === apPagoModal.idaporte); return a ? Number(a.totalpagar).toFixed(2) : '0.00'; })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {apPaymentStep === 2 && (
                  <div style={{ padding: '16px 0', minHeight: 160 }}>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                      <button onClick={() => setApSelectedMethod('E')} style={{
                        width: 140, padding: '16px 12px', borderRadius: 8, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        background: apSelectedMethod === 'E' ? '#e6f4f5' : '#fff',
                        borderColor: apSelectedMethod === 'E' ? '#5F9EA0' : '#d1d5db',
                        color: apSelectedMethod === 'E' ? '#2e7d7e' : '#374151'
                      }}>
                        <i className="fas fa-money-bill" style={{ fontSize: 24, marginBottom: 8 }}></i>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Efectivo</p>
                      </button>
                      <button onClick={() => setApSelectedMethod('Q')} style={{
                        width: 140, padding: '16px 12px', borderRadius: 8, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                        background: apSelectedMethod === 'Q' ? '#e6f4f5' : '#fff',
                        borderColor: apSelectedMethod === 'Q' ? '#5F9EA0' : '#d1d5db',
                        color: apSelectedMethod === 'Q' ? '#2e7d7e' : '#374151'
                      }}>
                        <i className="fas fa-qrcode" style={{ fontSize: 24, marginBottom: 8 }}></i>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Código QR</p>
                      </button>
                    </div>
                    {apMethodError && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#e6f4f5', borderRadius: 8, border: '1px solid #b2dfdb', fontSize: 13, color: '#2e7d7e', textAlign: 'center' }}>
                        <i className="fas fa-info-circle"></i> Selecciona un método de pago para continuar
                      </div>
                    )}
                  </div>
                )}

                {apPaymentStep === 3 && (
                  <div style={{ padding: '16px 0', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {apPaymentProcessing && !apPaymentSuccess && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#e6f4f5', marginBottom: 12 }}>
                          <i className="fas fa-hand-holding-usd" style={{ fontSize: 24, color: '#5F9EA0', animation: 'pulse 1.5s infinite' }}></i>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Realizando Pago</p>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>Procesando tu pago...</p>
                      </div>
                    )}
                    {apPaymentSuccess && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#d4edda', marginBottom: 12 }}>
                          <i className="fas fa-check" style={{ fontSize: 24, color: '#155724' }}></i>
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>¡Pago Realizado!</p>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Tu pago ha sido procesado correctamente</p>
                        <div style={{ background: '#e6f4f5', borderRadius: 8, padding: 12, border: '1px solid #b2dfdb', textAlign: 'left', minWidth: 250 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Monto Pagado:</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d7e' }}>
                              Bs {(() => { const a = (aportes[apPagoModal.idmat] || []).find(x => x.idaporte === apPagoModal.idaporte); return a ? Number(a.totalpagar).toFixed(2) : '0.00'; })()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Método:</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{apSelectedMethod === 'E' ? 'Efectivo' : apSelectedMethod === 'Q' ? 'QR' : '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {apPagoError && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8d7da', borderRadius: 8, border: '1px solid #f5c6cb', fontSize: 13, color: '#721c24' }}>
                        <i className="fas fa-exclamation-circle"></i> {apPagoError}
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-actions" style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {apPaymentStep === 1 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => closeApPagoModal()}>Cancelar</button>
                      <button className="btn-sm btn-primary" onClick={() => proceedToApStep2()}>Siguiente</button>
                    </>
                  )}
                  {apPaymentStep === 2 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => setApPaymentStep(1)}>Atrás</button>
                      <button className="btn-sm btn-primary" onClick={() => proceedToApConfirmation()}>Confirmar Pago</button>
                    </>
                  )}
                  {apPaymentStep === 3 && (
                    <>
                      <button className="btn-sm btn-secondary" onClick={() => closeApPagoModal()}>Cerrar</button>
                      {apPaymentSuccess && (
                        <button className="btn-sm btn-primary" onClick={() => closeApPagoModal()}>Finalizar</button>
                      )}
                      {!apPaymentSuccess && !apPaymentProcessing && apPagoError && (
                        <button className="btn-sm btn-primary" onClick={() => { setApPaymentStep(2); setApPagoError(''); }}>Reintentar</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {reciboModal && (
        <div className="modal-overlay" onClick={() => setReciboModal(null)} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="recibo-print" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, maxWidth: 620, width: '94%', margin: '12px auto', padding: 20, position: 'relative' }}>

            <div className="recibo-content" style={{ border: '2px solid #1f2937', borderRadius: 8, padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #1f2937', paddingBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1f2937' }}>ESCUELA CRISTIANA CAMIREÑA</h2>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>Sistema de Administración Educativa</p>
                <h3 style={{ margin: '10px 0 0', fontSize: 15, fontWeight: 700, color: '#1f2937', letterSpacing: '0.05em' }}>
                  RECIBO DE {reciboModal.type === 'aporte' ? 'APORTE' : 'MENSUALIDAD'}
                </h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '6px 10px', background: '#f9fafb', borderRadius: 6 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontWeight: 600 }}>N° Recibo</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827' }}>#{reciboModal.item.idaporte || reciboModal.item.idmensualidad}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontWeight: 600 }}>Fecha de Pago</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>{reciboModal.item.fechapago ? new Date(reciboModal.item.fechapago).toLocaleDateString('es-BO') : '-'}</p>
                </div>
              </div>

              <div style={{ marginBottom: 12, padding: 10, background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Datos del Estudiante</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Nombre</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.estudiante_nombre}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>CI</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.estudiante_ci}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Curso</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.curso_descripcion || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Nivel</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.nivel_nombre || '-'}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12, padding: 10, background: '#f5f3ff', borderRadius: 6, border: '1px solid #ddd6fe' }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Datos del Tutor</p>
                {reciboModal.item.tutor_nombre ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Nombre</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.tutor_nombre}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>CI</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.tutor_ci}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>Sin tutor asignado</p>
                )}
              </div>

              <div style={{ padding: 10, background: '#fef9c3', borderRadius: 6, border: '1px solid #fde68a', marginBottom: 12 }}>
                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#a16207', textTransform: 'uppercase' }}>Detalle del Pago</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>{reciboModal.type === 'aporte' ? 'Aporte' : 'Mensualidad'} N°</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>#{reciboModal.item.nro}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Gestión</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.gestion_nombre || '-'}</p>
                  </div>
                  {reciboModal.type === 'mensualidad' && reciboModal.item.nombrebeca && (
                    <div style={{ gridColumn: '1 / -1', padding: '6px 10px', background: '#f0fdf4', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bbf7d0' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 9, color: '#6b7280', fontWeight: 600 }}>Beca Aplicada</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{reciboModal.item.nombrebeca}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 9, color: '#6b7280', fontWeight: 600 }}>% Descuento</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{Number(reciboModal.item.beca_porcentaje || 0)}%</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Monto Base</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>Bs {Number(reciboModal.item.monto).toFixed(2)}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Descuento</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{Number(reciboModal.item.descuento || 0) > 0 ? `- Bs ${Number(reciboModal.item.descuento).toFixed(2)}` : 'Bs 0.00'}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Método de Pago</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{reciboModal.item.tipopago === 'E' ? 'Efectivo' : reciboModal.item.tipopago === 'Q' ? 'QR' : '-'}</p>
                  </div>
                  <div style={{ borderTop: '2px solid #1f2937', paddingTop: 4 }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#6b7280' }}>Total Pagado</p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#16a34a' }}>Bs {Number(reciboModal.item.totalpagar).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                <p style={{ margin: 0, fontSize: 9, color: '#9ca3af' }}>
                  Generado el {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })} a las {new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 9, color: '#9ca3af' }}>Este recibo es un comprobante de pago válido</p>
              </div>

              <div className="recibo-no-print" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
                <button className="btn-sm btn-secondary" onClick={() => setReciboModal(null)}>
                  <i className="fas fa-times"></i> Cerrar
                </button>
                <button className="btn-sm btn-primary" onClick={() => window.print()}>
                  <i className="fas fa-print"></i> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ background: 'linear-gradient(135deg, #5F9EA0, #4a8678)', margin: -24, marginBottom: 0, padding: 20, borderRadius: '12px 12px 0 0', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Buscar Estudiante</h3>
                <button onClick={() => setShowStudentModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div className="search-wrap" style={{ marginBottom: 12 }}>
                <i className="fas fa-search"></i>
                <input
                  placeholder="Buscar por CI o apellido..."
                  value={searchQuery}
                  onChange={(e) => searchStudents(e.target.value)}
                  autoFocus
                />
              </div>
              {searchQuery.length < 2 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 13 }}>Escribe al menos 2 caracteres para buscar</p>
              ) : searchResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0', fontSize: 13 }}>No se encontraron resultados</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                  {searchResults.map((est) => (
                    <button key={est.ci} onClick={() => selectStudent(est)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#e6f4f5'; e.currentTarget.style.borderColor = '#5F9EA0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{est.apellido} {est.nombre}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>CI: {est.ci}</p>
                      </div>
                      <i className="fas fa-chevron-right" style={{ color: '#5F9EA0', fontSize: 12 }}></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .recibo-print, .recibo-print * { visibility: visible !important; }
          .recibo-print { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; background: #fff !important; z-index: 9999 !important; }
          .recibo-content { max-width: 400px !important; margin: 20px auto !important; border: 2px solid #000 !important; padding: 24px !important; }
          .recibo-no-print { display: none !important; }
          .recibo-content h2 { font-size: 18px !important; }
          .recibo-content h3 { font-size: 14px !important; }
        }
      `}</style>
    </div>
  );
}
