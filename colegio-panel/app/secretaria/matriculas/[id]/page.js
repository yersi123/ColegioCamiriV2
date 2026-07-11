'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function DetalleMatriculaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [matricula, setMatricula] = useState(null);
  const [mensualidades, setMensualidades] = useState([]);
  const [becaNombre, setBecaNombre] = useState('');
  const [pagoModal, setPagoModal] = useState(null);
  const [pagoLoading, setPagoLoading] = useState(false);
  const [pagoError, setPagoError] = useState('');
  const [pagoStep, setPagoStep] = useState(1);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;

    api.matriculacion.obtener(t, Number(id)).then(async (res) => {
      setMatricula(res.data);
      if (res.data.codbeca) {
        try {
          const b = await api.becas.obtener(t, res.data.codbeca);
          setBecaNombre(b.data.nombrebeca);
        } catch {}
      }
    });

    api.mensualidades.listar(t, { idmatriculacion: Number(id) }).then((res) => {
      setMensualidades(res.data);
    });
  }, [id]);

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'C': return { background: '#d1fae5', color: '#065f46' };
      case 'P': return { background: '#fef3c7', color: '#92400e' };
      case 'A': return { background: '#fee2e2', color: '#991b1b' };
      default: return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const getTipoPagoStyle = (tipo) => {
    switch (tipo) {
      case 'E': return { background: '#d1fae5', color: '#065f46' };
      case 'Q': return { background: '#dbeafe', color: '#1e40af' };
      default: return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const resetPagoModal = () => {
    setPagoModal(null);
    setPagoStep(1);
    setPagoError('');
  };

  const openPagoModal = (idmen) => {
    setPagoModal(idmen);
    setPagoStep(1);
    setPagoError('');
  };

  const pagarMensualidad = async (tipopago) => {
    setPagoStep(3);
    setPagoLoading(true);
    setPagoError('');
    try {
      await api.mensualidades.pagar(token, Number(id), pagoModal, { tipopago });
      const res = await api.mensualidades.listar(token, { idmatriculacion: Number(id) });
      setMensualidades(res.data);
      resetPagoModal();
    } catch (err) {
      setPagoError(err.message || 'Error al registrar pago');
      setPagoLoading(false);
    }
  };

  if (!matricula) return <div className="loading">Cargando...</div>;

  const infoFields = [
    { label: 'Estudiante', value: matricula.estudiante_nombre, icon: 'fa-user' },
    { label: 'CI', value: matricula.estudiante_ci, icon: 'fa-id-card' },
    { label: 'Curso', value: matricula.curso_descripcion, icon: 'fa-book' },
    { label: 'Nivel', value: matricula.nivel_nombre, icon: 'fa-layer-group' },
    { label: 'Gestión', value: matricula.gestion_nombre || '-', icon: 'fa-calendar' },
    { label: 'Beca', value: becaNombre || 'Sin beca', icon: 'fa-award' },
    { label: 'Fecha Registro', value: formatFecha(matricula.fecharegis), icon: 'fa-calendar-day' },
    { label: 'Estado', value: mapValue('estado', matricula.estado), icon: 'fa-flag' },
  ];

  const pagoEstados = { P: 'Pendiente', C: 'Cancelado', A: 'Anulado' };

  const menActual = mensualidades.find((m) => m.idmensualidad === pagoModal);

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{
          background: 'linear-gradient(135deg, #5F9EA0, #3D7B7D)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-header-icon" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              <i className="fas fa-file-signature"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#fff' }}>Matrícula #{id}</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Detalle de la matrícula del estudiante</p>
            </div>
          </div>
          <button className="btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', fontWeight: 600 }} onClick={() => router.push('/secretaria/matriculas')}>
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {infoFields.map((f, i) => (
              <div key={i} style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <i className={`fas ${f.icon}`} style={{ color: '#5F9EA0', fontSize: 11 }}></i>
                  <strong style={{ color: '#5F9EA0', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</strong>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e6f4f5', color: '#5F9EA0', fontSize: 12 }}>
              <i className="fas fa-money-bill"></i>
            </span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Mensualidades ({mensualidades.length})</h3>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>N°</th>
                <th style={{ textAlign: 'center' }}>Monto</th>
                <th style={{ textAlign: 'center' }}>Desc. (Bs)</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Tipo Pago</th>
                <th style={{ textAlign: 'center' }}>Fecha Pago</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensualidades.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <i className="fas fa-money-bill"></i>
                      <p>No hay mensualidades registradas</p>
                      <span className="empty-sub">Las mensualidades se generan automáticamente al registrar la matrícula</span>
                    </div>
                  </td>
                </tr>
              ) : (
                mensualidades.map((m) => (
                  <tr key={m.idmensualidad}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: '#edf5f5', color: '#111827', fontSize: '13px', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>
                        {m.nro}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>Bs {Number(m.monto).toFixed(2)}</div></td>
                    <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>Bs {Number(m.descuento || 0).toFixed(2)}</div></td>
                    <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Bs {Number(m.totalpagar).toFixed(2)}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={getEstadoStyle(m.estado)}>{pagoEstados[m.estado] || m.estado}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {m.tipopago ? (
                        <span className="badge" style={getTipoPagoStyle(m.tipopago)}>{mapValue('tipoPago', m.tipopago)}</span>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', color: '#374151' }}>{formatFecha(m.fechapago)}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      {m.estado === 'P' && (
                        <button className="btn-sm btn-primary" onClick={() => openPagoModal(m.idmensualidad)}>
                          <i className="fas fa-hand-holding-usd"></i> Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagoModal && (
        <div className="modal-overlay" onClick={resetPagoModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #5F9EA0, #3D7B7D)',
              borderRadius: '8px 8px 0 0',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Registrar Pago</h3>
                <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={resetPagoModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
                {[1, 2, 3].map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: pagoStep >= s ? '#5F9EA0' : '#e5e7eb',
                      color: pagoStep >= s ? '#fff' : '#9ca3af',
                      transition: 'all 0.3s ease',
                    }}>
                      {pagoStep > s ? <i className="fas fa-check"></i> : s}
                    </div>
                    {s < 3 && (
                      <div style={{
                        width: 40, height: 2,
                        background: pagoStep > s ? '#5F9EA0' : '#e5e7eb',
                        transition: 'all 0.3s ease',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {pagoError && <div className="error-msg" style={{ marginBottom: 12 }}>{pagoError}</div>}

              {pagoStep === 1 && (
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Verifique los datos del pago</p>
                  <div style={{ padding: '10px 14px', background: '#edf5f5', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#5F9EA0', fontWeight: 600 }}>Mensualidad N°</span>
                      <span style={{ color: '#111827', fontWeight: 700 }}>{menActual?.nro || pagoModal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#5F9EA0', fontWeight: 600 }}>Monto</span>
                      <span style={{ color: '#111827' }}>Bs {Number(menActual?.monto || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#5F9EA0', fontWeight: 600 }}>Descuento</span>
                      <span style={{ color: '#111827' }}>Bs {Number(menActual?.descuento || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d1e8e8', paddingTop: 6 }}>
                      <span style={{ color: '#5F9EA0', fontWeight: 700 }}>Total a Pagar</span>
                      <span style={{ color: '#111827', fontWeight: 700, fontSize: 16 }}>Bs {Number(menActual?.totalpagar || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="modal-actions" style={{ justifyContent: 'center' }}>
                    <button className="btn-sm btn-secondary" onClick={resetPagoModal}>Cancelar</button>
                    <button className="btn-sm btn-primary" onClick={() => setPagoStep(2)}>
                      <i className="fas fa-arrow-right"></i> Continuar
                    </button>
                  </div>
                </div>
              )}

              {pagoStep === 2 && (
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Seleccione el método de pago</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                    <button
                      className="btn-sm"
                      disabled={pagoLoading}
                      onClick={() => pagarMensualidad('E')}
                      style={{
                        flex: 1, padding: '14px 20px', borderRadius: 8,
                        background: '#d1fae5', color: '#065f46', border: '2px solid #a7f3d0',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      }}
                    >
                      <i className="fas fa-money-bill-wave" style={{ fontSize: 24 }}></i>
                      <span>Efectivo</span>
                    </button>
                    <button
                      className="btn-sm"
                      disabled={pagoLoading}
                      onClick={() => pagarMensualidad('Q')}
                      style={{
                        flex: 1, padding: '14px 20px', borderRadius: 8,
                        background: '#dbeafe', color: '#1e40af', border: '2px solid #93c5fd',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      }}
                    >
                      <i className="fas fa-qrcode" style={{ fontSize: 24 }}></i>
                      <span>QR</span>
                    </button>
                  </div>
                  <div className="modal-actions" style={{ justifyContent: 'center' }}>
                    <button className="btn-sm btn-secondary" onClick={() => setPagoStep(1)} disabled={pagoLoading}>
                      <i className="fas fa-arrow-left"></i> Atrás
                    </button>
                  </div>
                </div>
              )}

              {pagoStep === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#edf5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: '#5F9EA0' }}></i>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Procesando pago...</p>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>Espere un momento por favor</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
