'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const cardConfig = [
  { key: 'hijos', label: 'Mis Estudiantes', icon: 'fa-users', color: '#5F9EA0', gradient: 'linear-gradient(135deg, #5F9EA0, #4A7C7E)' },
  { key: 'pendientesMens', label: 'Mensualidades Pendientes', icon: 'fa-money-bill', color: '#4A7C7E', gradient: 'linear-gradient(135deg, #4A7C7E, #3A6B6D)' },
  { key: 'pendientesAportes', label: 'Aportes Pendientes', icon: 'fa-hand-holding-usd', color: '#6BA3A5', gradient: 'linear-gradient(135deg, #6BA3A5, #5A8F91)' },
  { key: 'deudaTotal', label: 'Deuda Total', icon: 'fa-exclamation-triangle', color: '#3A6B6D', gradient: 'linear-gradient(135deg, #3A6B6D, #2D5A5C)' },
];

export default function TutorDashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [hijos, setHijos] = useState([]);
  const [gestionActiva, setGestionActiva] = useState(null);

  const loadStats = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) return;

    const safe = (p) => p.catch(() => null);

    const [hijosRes, gestionesRes] = await Promise.all([
      safe(api.tutor.listarHijos(t)),
      safe(api.gestiones.listar(t)),
    ]);

    const hijosData = hijosRes?.data || [];
    setHijos(hijosData);

    const g = (gestionesRes?.data || []).find(g => g.estado === '1');
    setGestionActiva(g || null);

    if (hijosData.length === 0) {
      setStats({ hijos: 0, pendientesMens: 0, pendientesAportes: 0, deudaTotal: 0 });
      return;
    }

    const hijosPromises = hijosData.map(async (hijo) => {
      const [mens, aportes] = await Promise.all([
        safe(api.tutor.listarMensualidadesHijo(t, hijo.ci, { estado: 'P' })),
        safe(api.tutor.listarAportesHijo(t, hijo.ci)),
      ]);

      const mensPendientes = mens?.data || [];
      const aportesData = aportes?.data || [];
      const aportesPendientes = aportesData.filter(a => a.estado === 'P');

      return {
        pendientesMens: mensPendientes.length,
        pendientesAportes: aportesPendientes.length,
        deudaMens: mensPendientes.reduce((sum, m) => sum + Number(m.monto || 0), 0),
        deudaAportes: aportesPendientes.reduce((sum, a) => sum + Number(a.monto || 0), 0),
      };
    });

    const results = await Promise.all(hijosPromises);

    setStats({
      hijos: hijosData.length,
      pendientesMens: results.reduce((s, r) => s + r.pendientesMens, 0),
      pendientesAportes: results.reduce((s, r) => s + r.pendientesAportes, 0),
      deudaTotal: results.reduce((s, r) => s + r.deudaMens + r.deudaAportes, 0),
    });
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    loadStats();
  }, [loadStats]);

  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'TU';

  return (
    <div className="admin-dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-bg" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="dashboard-hero-text">
            <h1>Escuela Cristiana Camireña</h1>
            <p className="dashboard-hero-welcome">
              <span className="dashboard-hero-avatar">{initials}</span>
              ¡Bienvenido, <strong>{user?.nombre || 'Tutor'}</strong>!
            </p>
            <p className="dashboard-hero-sub">Panel de Tutor</p>
            {gestionActiva && (
              <span className="dashboard-hero-badge">
                <i className="fas fa-calendar"></i> {gestionActiva.descripcion || `Gestión ${gestionActiva.idgestion}`}
                {gestionActiva.cantidadmen && <span> &middot; {gestionActiva.cantidadmen} mensualidades</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {!stats ? (
        <div className="dashboard-skeleton-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-skeleton-card">
              <div className="skeleton-icon" />
              <div className="skeleton-lines">
                <div className="skeleton-line skeleton-line-sm" />
                <div className="skeleton-line skeleton-line-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="dashboard-stats-grid">
            {cardConfig.map((card) => (
              <div
                key={card.key}
                className="dashboard-stat-card"
                style={{ '--card-gradient': card.gradient, '--card-color': card.color }}
              >
                <div className="dashboard-stat-card-bg" />
                <div className="dashboard-stat-card-icon">
                  <i className={`fas ${card.icon}`}></i>
                </div>
                <div className="dashboard-stat-card-info">
                  <span className="dashboard-stat-card-number">
                    {card.key === 'deudaTotal' ? `Bs ${stats[card.key].toFixed(2)}` : stats[card.key]}
                  </span>
                  <span className="dashboard-stat-card-label">{card.label}</span>
                </div>
              </div>
            ))}
          </div>

          {gestionActiva && (
            <div className="dashboard-gestion-card">
              <div className="dashboard-gestion-card-header">
                <i className="fas fa-calendar-check"></i>
                <span>Gestión Actual</span>
              </div>
              <div className="dashboard-gestion-card-body">
                <div className="dashboard-gestion-item">
                  <span className="dashboard-gestion-label">Descripción</span>
                  <span className="dashboard-gestion-value">{gestionActiva.descripcion || '—'}</span>
                </div>
                <div className="dashboard-gestion-item">
                  <span className="dashboard-gestion-label">Apertura</span>
                  <span className="dashboard-gestion-value">{gestionActiva.fechaapertura ? new Date(gestionActiva.fechaapertura).toLocaleDateString() : '—'}</span>
                </div>
                <div className="dashboard-gestion-item">
                  <span className="dashboard-gestion-label">Cierre</span>
                  <span className="dashboard-gestion-value">{gestionActiva.fechacierre ? new Date(gestionActiva.fechacierre).toLocaleDateString() : '—'}</span>
                </div>
                <div className="dashboard-gestion-item">
                  <span className="dashboard-gestion-label">Mensualidades</span>
                  <span className="dashboard-gestion-value">{gestionActiva.cantidadmen || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {hijos.length > 0 && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <i className="fas fa-users"></i>
                <h3>Mis Estudiantes</h3>
                <a href="/tutor/estudiantes" className="dashboard-card-link">
                  Ver todos <i className="fas fa-arrow-right"></i>
                </a>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>CI</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Curso</th>
                      <th>Nivel</th>
                      <th>Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hijos.map((h) => (
                      <tr key={h.ci}>
                        <td>{h.ci}</td>
                        <td>{h.nombre}</td>
                        <td>{h.apellido}</td>
                        <td>{h.curso_descripcion || '-'}</td>
                        <td>{h.nivel_nombre || '-'}</td>
                        <td>{h.gestion_nombre || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="dashboard-quick-actions">
            <h3 className="dashboard-section-title">
              <i className="fas fa-bolt"></i> Acceso Rápido
            </h3>
            <div className="dashboard-quick-grid">
              {[
                { label: 'Mis Estudiantes', icon: 'fa-users', href: '/tutor/estudiantes', color: '#5F9EA0' },
                { label: 'Pagar Mensualidad', icon: 'fa-money-bill', href: '/tutor/estudiantes', color: '#4A7C7E' },
              ].map(item => (
                <a key={item.href} href={item.href} className="dashboard-quick-item" style={{ '--q-color': item.color }}>
                  <div className="dashboard-quick-item-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="dashboard-footer">
        <p>Escuela Cristiana Camireña &copy; {new Date().getFullYear()} — Todos los derechos reservados</p>
      </div>
    </div>
  );
}
