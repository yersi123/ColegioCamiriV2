'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const cardConfig = [
  { key: 'admins', label: 'Administradores', icon: 'fa-user-gear', color: '#5F9EA0', gradient: 'linear-gradient(135deg, #5F9EA0, #4A7C7E)' },
  { key: 'secretarias', label: 'Secretarias', icon: 'fa-clipboard-user', color: '#4A7C7E', gradient: 'linear-gradient(135deg, #4A7C7E, #3A6B6D)' },
  { key: 'directores', label: 'Directores', icon: 'fa-user-tie', color: '#6BA3A5', gradient: 'linear-gradient(135deg, #6BA3A5, #5A8F91)' },
  { key: 'tutores', label: 'Tutores', icon: 'fa-people-group', color: '#3A6B6D', gradient: 'linear-gradient(135deg, #3A6B6D, #2D5A5C)' },
];

export default function AdminDashboard() {
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
      safe(api.usuarios.listar(t, 'admin')),
      safe(api.usuarios.listar(t, 'secretaria')),
      safe(api.usuarios.listar(t, 'director')),
      safe(api.usuarios.listar(t, 'tutor')),
      safe(api.gestiones.listar(t)),
    ]).then(([admins, secretarias, directores, tutores, gestiones]) => {
      const g = (gestiones?.data || []).find(g => g.estado === '1');
      setGestionActiva(g || null);
      setStats({
        admins: admins?.data?.data?.length || 0,
        secretarias: secretarias?.data?.data?.length || 0,
        directores: directores?.data?.data?.length || 0,
        tutores: tutores?.data?.data?.length || 0,
      });
    });
  }, []);

  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'AD';

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
              ¡Bienvenido, <strong>{user?.nombre || 'Administrador'}</strong>!
            </p>
            <p className="dashboard-hero-sub">Panel de Administración</p>
            {gestionActiva && (
              <span className="dashboard-hero-badge">
                <i className="fas fa-calendar"></i> Gestión: {gestionActiva.descripcion || gestionActiva.idgestion}
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
            {cardConfig.map((card, idx) => (
              <div
                key={card.key}
                className="dashboard-stat-card"
                style={{ '--card-gradient': card.gradient, '--card-color': card.color }}
                onClick={() => {
                  const links = {
                    admins: '/admin/usuarios?rol=admin',
                    secretarias: '/admin/usuarios?rol=secretaria',
                    directores: '/admin/usuarios?rol=director',
                    tutores: '/admin/usuarios?rol=tutor',
                  };
                  window.location.href = links[card.key] || '/admin/dashboard';
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

          <div className="dashboard-quick-actions">
            <h3 className="dashboard-section-title">
              <i className="fas fa-bolt"></i> Acceso Rápido
            </h3>
            <div className="dashboard-quick-grid">
              {[
                { label: 'Administradores', icon: 'fa-user-gear', href: '/admin/usuarios?rol=admin', color: '#5F9EA0' },
                { label: 'Secretarias', icon: 'fa-clipboard-user', href: '/admin/usuarios?rol=secretaria', color: '#4A7C7E' },
                { label: 'Directores', icon: 'fa-user-tie', href: '/admin/usuarios?rol=director', color: '#6BA3A5' },
                { label: 'Tutores', icon: 'fa-people-group', href: '/admin/usuarios?rol=tutor', color: '#3A6B6D' },
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
