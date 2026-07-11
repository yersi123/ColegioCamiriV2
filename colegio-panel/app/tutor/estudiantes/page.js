'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function HijosPage() {
  const [hijos, setHijos] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) return;
    api.tutor.listarHijos(t).then((res) => setHijos(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Mis Estudiantes</h2>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>CI</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Curso</th>
                <th>Nivel</th>
                <th>Gestión</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {hijos.map((h) => (
                <tr key={h.ci}>
                  <td>{h.codestudiante}</td>
                  <td>{h.ci}</td>
                  <td>{h.nombre}</td>
                  <td>{h.apellido}</td>
                  <td>{h.curso_descripcion || '-'}</td>
                  <td>{h.nivel_nombre || '-'}</td>
                  <td>{h.gestion_nombre || '-'}</td>
                  <td>
                    <div className="actions">
                      <a href={`/tutor/estudiantes/${h.ci}/mensualidades`} className="btn-sm btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Mensualidades
                      </a>
                      <a href={`/tutor/estudiantes/${h.ci}/aportes`} className="btn-sm btn-warning" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Aportes
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {hijos.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>No tiene hijos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
