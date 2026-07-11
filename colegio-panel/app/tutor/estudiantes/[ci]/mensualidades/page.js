'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function MensualidadesHijoPage() {
  const { ci } = useParams();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [mensualidades, setMensualidades] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    cargar(t);
  }, [ci]);

  useEffect(() => {
    if (token) cargar(token);
  }, [filtroEstado]);

  const cargar = async (t) => {
    const params = {};
    if (filtroEstado) params.estado = filtroEstado;
    try {
      const res = await api.tutor.listarMensualidadesHijo(t, ci, params);
      setMensualidades(res.data);
    } catch (e) {
      if (e.message?.includes('no es su dependiente')) {
        setMensualidades([]);
      }
    }
  };

  const statusBadge = (estado) => {
    const map = { P: 'badge-pending', C: 'badge-active', A: 'badge-inactive' };
    return `badge ${map[estado] || 'badge-inactive'}`;
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Mensualidades — CI: {ci}</h2>
          <button className="btn-sm btn-secondary" onClick={() => router.push('/tutor/estudiantes')}>Volver</button>
        </div>

        <div className="toolbar" style={{ marginBottom: 16 }}>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="P">Pendiente</option>
            <option value="C">Cancelado</option>
            <option value="A">Anulado</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Monto</th>
                <th>Descuento</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Tipo Pago</th>
                <th>Fecha Pago</th>
              </tr>
            </thead>
            <tbody>
              {mensualidades.map((m) => (
                <tr key={m.idmensualidad}>
                  <td>{m.nro}</td>
                  <td>{Number(m.monto).toFixed(2)}</td>
                  <td>{Number(m.descuento || 0).toFixed(2)}</td>
                  <td><strong>{Number(m.totalpagar).toFixed(2)}</strong></td>
                  <td><span className={statusBadge(m.estado)}>{mapValue('pagoEstado', m.estado)}</span></td>
                  <td>{m.tipopago ? mapValue('tipoPago', m.tipopago) : '-'}</td>
                  <td>{m.fechapago ? new Date(m.fechapago).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {mensualidades.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>Sin mensualidades registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
