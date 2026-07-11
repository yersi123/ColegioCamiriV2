'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function NivelesCursosPage() {
  const [token, setToken] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [filtroNivel, setFiltroNivel] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;

    Promise.all([
      api.niveles.listar(t),
      api.cursos.listar(t),
    ]).then(([n, c]) => {
      setNiveles(n.data);
      setCursos(c.data);
    });
  }, []);

  const cursosFiltrados = filtroNivel
    ? cursos.filter((c) => String(c.idnivel) === filtroNivel)
    : cursos;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Niveles</h2>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Monto Mes</th>
                <th>Monto Total</th>
                <th>Monto Aporte</th>
              </tr>
            </thead>
            <tbody>
              {niveles.map((n) => (
                <tr key={n.idnivel}>
                  <td>{n.idnivel}</td>
                  <td><strong>{n.nombre}</strong></td>
                  <td>{Number(n.montomes).toFixed(2)}</td>
                  <td>{Number(n.montototal).toFixed(2)}</td>
                  <td>{Number(n.montoaporte || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Cursos</h2>
        </div>

        <div className="toolbar" style={{ marginBottom: 16 }}>
          <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
            <option value="">Todos los niveles</option>
            {niveles.map((n) => (
              <option key={n.idnivel} value={n.idnivel}>{n.nombre}</option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Paralelo</th>
                <th>Nivel</th>
                <th>Capacidad</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.map((c) => (
                <tr key={c.idcurso}>
                  <td>{c.idcurso}</td>
                  <td>{c.descripcion}</td>
                  <td>{c.paralelo}</td>
                  <td>{c.nivel_nombre}</td>
                  <td>{c.capacidad_maxima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
