'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const cardConfig = [
  { key: 'niveles', label: 'Niveles', icon: 'fa-layer-group', color: '#5F9EA0', gradient: 'linear-gradient(135deg, #5F9EA0, #4A7C7E)' },
  { key: 'cursos', label: 'Cursos', icon: 'fa-book', color: '#4A7C7E', gradient: 'linear-gradient(135deg, #4A7C7E, #3A6B6D)' },
  { key: 'becas', label: 'Becas', icon: 'fa-award', color: '#6BA3A5', gradient: 'linear-gradient(135deg, #6BA3A5, #5A8F91)' },
  { key: 'gestiones', label: 'Gestiones', icon: 'fa-calendar', color: '#3A6B6D', gradient: 'linear-gradient(135deg, #3A6B6D, #2D5A5C)' },
];

export default function DirectorDashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [gestionActiva, setGestionActiva] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    if (!t) return;

    const safe = (p) => p.catch(() => null);

    Promise.all([
      safe(api.niveles.listar(t)),
      safe(api.cursos.listar(t)),
      safe(api.becas.listar(t)),
      safe(api.gestiones.listar(t)),
    ]).then(([niveles, cursos, becas, gestiones]) => {
      const g = (gestiones?.data || []).find(g => g.estado === '1');
      setGestionActiva(g || null);
      setStats({
        niveles: niveles?.data?.length || 0,
        cursos: cursos?.data?.length || 0,
        becas: becas?.data?.length || 0,
        gestiones: (gestiones?.data || []).length,
      });
    });
  }, []);

  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'DI';

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
              ¡Bienvenido, <strong>{user?.nombre || 'Director'}</strong>!
            </p>
            <p className="dashboard-hero-sub">Panel de Dirección</p>
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
                onClick={() => {
                  const links = {
                    niveles: '/director/niveles',
                    cursos: '/director/cursos',
                    becas: '/director/becas',
                    gestiones: '/director/gestion',
                  };
                  window.location.href = links[card.key] || '/director/dashboard';
                }}
              >
                <div className="dashboard-stat-card-bg" />
                <div className="dashboard-stat-card-icon">
                  <i className={`fas ${card.icon}`}></i>
                </div>
                <div className="dashboard-stat-card-info">
                  <span className="dashboard-stat-card-number">{stats[card.key]}</span>
                  <span className="dashboard-stat-card-label">{card.label}</span>
                </div>
                <div className="dashboard-stat-card-arrow">
                  <i className="fas fa-arrow-right"></i>
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

          <div className="dashboard-quick-actions">
            <h3 className="dashboard-section-title">
              <i className="fas fa-bolt"></i> Acceso Rápido
            </h3>
            <div className="dashboard-quick-grid">
              {[
                { label: 'Niveles', icon: 'fa-layer-group', href: '/director/niveles', color: '#5F9EA0' },
                { label: 'Cursos', icon: 'fa-book', href: '/director/cursos', color: '#4A7C7E' },
                { label: 'Gestión', icon: 'fa-calendar', href: '/director/gestion', color: '#6BA3A5' },
                { label: 'Becas', icon: 'fa-award', href: '/director/becas', color: '#3A6B6D' },
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
