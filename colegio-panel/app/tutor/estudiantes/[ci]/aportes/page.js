'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function AportesHijoPage() {
  const { ci } = useParams();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [aportes, setAportes] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    api.tutor.listarAportesHijo(t, ci).then((res) => setAportes(res.data)).catch(() => {});
  }, [ci]);

  const statusBadge = (estado) => {
    const map = { P: 'badge-pending', C: 'badge-active', A: 'badge-inactive' };
    return `badge ${map[estado] || 'badge-inactive'}`;
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Aportes — CI: {ci}</h2>
          <button className="btn-sm btn-secondary" onClick={() => router.push('/tutor/estudiantes')}>Volver</button>
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
              {aportes.map((a) => (
                <tr key={a.idaporte}>
                  <td>{a.nro}</td>
                  <td>{Number(a.monto).toFixed(2)}</td>
                  <td>{Number(a.descuento || 0).toFixed(2)}</td>
                  <td><strong>{Number(a.totalpagar).toFixed(2)}</strong></td>
                  <td><span className={statusBadge(a.estado)}>{mapValue('pagoEstado', a.estado)}</span></td>
                  <td>{a.tipopago ? mapValue('tipoPago', a.tipopago) : '-'}</td>
                  <td>{a.fechapago ? new Date(a.fechapago).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {aportes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>Sin aportes registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
