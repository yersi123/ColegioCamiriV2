'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { mapValue } from '@/lib/map';

export default function ConsultasPage() {
  const [token, setToken] = useState(null);
  const [gestiones, setGestiones] = useState([]);
  const [becas, setBecas] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;

    Promise.all([
      api.gestiones.listar(t),
      api.becas.listar(t),
    ]).then(([g, b]) => {
      setGestiones(g.data);
      setBecas(b.data);
    });
  }, []);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Gestión Académica</h2>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Mensualidades</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {gestiones.map((g) => (
                <tr key={g.idgestion} style={g.estado === '1' ? { background: '#e8f5e9' } : {}}>
                  <td>{g.idgestion}</td>
                  <td>{g.descripcion || '-'}</td>
                  <td>{new Date(g.fechaapertura).toLocaleDateString()}</td>
                  <td>{g.fechacierre ? new Date(g.fechacierre).toLocaleDateString() : '-'}</td>
                  <td>{g.cantidadmen}</td>
                  <td>
                    <span className={`badge ${g.estado === '1' ? 'badge-active' : 'badge-inactive'}`}>
                      {mapValue('gestionEstado', g.estado)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Becas Disponibles</h2>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Porcentaje</th>
                <th>Descripción</th>
                <th>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {becas.map((b) => (
                <tr key={b.codbeca}>
                  <td>{b.codbeca}</td>
                  <td>{b.nombrebeca}</td>
                  <td>{b.tipobeca || '-'}</td>
                  <td>{b.porcentaje}%</td>
                  <td>{b.descripcion || '-'}</td>
                  <td>{b.idgestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
