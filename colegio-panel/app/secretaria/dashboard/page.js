'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';

const cardConfig = [
  { key: 'tutores', label: 'Tutores', icon: 'fa-chalkboard-teacher', color: '#7CB342', gradient: 'linear-gradient(135deg, #7CB342, #5D8E2E)', link: '/secretaria/tutores' },
  { key: 'matriculas', label: 'Matrículas', icon: 'fa-file-signature', color: '#AFB42B', gradient: 'linear-gradient(135deg, #AFB42B, #827717)', link: '/secretaria/matriculas' },
  { key: 'pendientesMens', label: 'Mensualidades Pendientes', icon: 'fa-money-bill', color: '#FFCA28', gradient: 'linear-gradient(135deg, #FFCA28, #FF8F00)', link: '/secretaria/pagos' },
  { key: 'pendientesAportes', label: 'Aportes Pendientes', icon: 'fa-hand-holding-usd', color: '#9CCC65', gradient: 'linear-gradient(135deg, #9CCC65, #7CB342)', link: '/secretaria/pagos' },
];

export default function SecretariaDashboard() {
  const [stats, setStats] = useState(null);
  const [extra, setExtra] = useState(null);
  const [user, setUser] = useState(null);
  const [gestionActiva, setGestionActiva] = useState(null);
  const [recentMatriculas, setRecentMatriculas] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    if (!t) return;

    const safe = (p) => p.catch(() => null);

    Promise.all([
      safe(api.secretaria.listarTutores(t)),
      safe(api.matriculacion.listar(t)),
      safe(api.mensualidades.listar(t, { estado: 'P' })),
      safe(api.mensualidades.listar(t)),
      safe(api.aportes.listar(t, { estado: 'P' })),
      safe(api.aportes.listar(t)),
      safe(api.gestiones.listar(t)),
    ]).then(([tutores, matriculas, mensPendientes, todasMens, aportesPendientes, todosAportes, gestiones]) => {
      const g = (gestiones?.data || []).find(g => g.estado === '1');
      setGestionActiva(g || null);

      const tutoresData = tutores?.data || [];
      const matriculasData = matriculas?.data || [];
      const mensPData = mensPendientes?.data || [];
      const todasMensData = todasMens?.data || [];
      const aportesPData = aportesPendientes?.data || [];
      const todosAportesData = todosAportes?.data || [];

      const totalMens = todasMensData.length;
      const pagadasMens = totalMens - mensPData.length;
      const ratioMens = totalMens > 0 ? (pagadasMens / totalMens) * 100 : 0;

      const totalAportes = todosAportesData.length;
      const pagadosAportes = totalAportes - aportesPData.length;
      const ratioAportes = totalAportes > 0 ? (pagadosAportes / totalAportes) * 100 : 0;

      const matriculasActivas = g
        ? matriculasData.filter(m => m.idgestion === g.idgestion).length
        : 0;
      const ratioMatriculas = matriculasData.length > 0
        ? (matriculasActivas / matriculasData.length) * 100
        : 0;

      const sumaMensPendientes = mensPData.reduce((s, m) => s + Number(m.monto || 0), 0);
      const sumaAportesPendientes = aportesPData.reduce((s, a) => s + Number(a.monto || 0), 0);

      setStats({
        tutores: tutoresData.length,
        matriculas: matriculasData.length,
        pendientesMens: mensPData.length,
        pendientesAportes: aportesPData.length,
      });

      setExtra({
        tutoresExtra: `${tutoresData.length} registrados`,
        matriculasExtra: ` ${matriculasActivas} en gestión activa`,
        pendientesMensExtra: `Bs ${sumaMensPendientes.toFixed(2)}`,
        pendientesAportesExtra: `Bs ${sumaAportesPendientes.toFixed(2)}`,
        progress: {
          tutores: 100,
          matriculas: ratioMatriculas,
          pendientesMens: ratioMens,
          pendientesAportes: ratioAportes,
        },
      });

      setRecentMatriculas(matriculasData.slice(-5).reverse());
    });
  }, []);

  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'SE';

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }) : '—';

  const sectionLinks = {
    tutores: '/secretaria/tutores',
    matriculas: '/secretaria/matriculas',
    pendientesMens: '/secretaria/pagos',
    pendientesAportes: '/secretaria/pagos',
  };

  return (
    <div className="admin-dashboard">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressGrow {
          from { width: 0; }
        }
        .card-anim { animation: fadeSlideIn 0.5s ease both; }
        .progress-bar-fill { animation: progressGrow 1s ease 0.3s both; }
      `}</style>

      <div className="dashboard-hero" style={{ animation: 'fadeSlideIn 0.5s ease both' }}>
        <div className="dashboard-hero-bg" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="dashboard-hero-text">
            <h1>Escuela Cristiana Camireña</h1>
            <p className="dashboard-hero-welcome">
              <span className="dashboard-hero-avatar">{initials}</span>
              ¡Bienvenida, <strong>{user?.nombre || 'Secretaria'}</strong>!
            </p>
            <p className="dashboard-hero-sub">Panel de Secretaría</p>
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
            <div key={i} className="dashboard-skeleton-card" style={{ animationDelay: `${i * 0.1}s` }}>
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
            {cardConfig.map((card, i) => {
              const pct = extra?.progress[card.key] ?? 0;
              return (
                <div
                  key={card.key}
                  className="dashboard-stat-card card-anim"
                  style={{
                    '--card-gradient': card.gradient,
                    '--card-color': card.color,
                    animationDelay: `${0.1 + i * 0.12}s`,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={() => { window.location.href = sectionLinks[card.key]; }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = `0 16px 40px ${card.color}44`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="dashboard-stat-card-bg" />
                  <div className="dashboard-stat-card-icon" style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'transform 0.3s ease',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                  >
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                  <div className="dashboard-stat-card-info">
                    <span className="dashboard-stat-card-number">{stats[card.key]}</span>
                    <span className="dashboard-stat-card-label">{card.label}</span>
                    {extra && (
                      <span style={{
                        display: 'block', fontSize: 12, fontWeight: 600, opacity: 0.8, marginTop: 2,
                      }}>
                        {extra[card.key + 'Extra']}
                      </span>
                    )}
                    <div style={{
                      marginTop: 8, height: 4, borderRadius: 2,
                      background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
                    }}>
                      <div className="progress-bar-fill" style={{
                        height: '100%', borderRadius: 2,
                        background: 'rgba(255,255,255,0.6)',
                        width: `${pct}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <div className="dashboard-stat-card-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              );
            })}
          </div>

          {gestionActiva && (
            <div className="dashboard-gestion-card card-anim" style={{ animationDelay: '0.6s' }}>
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

          <div className="dashboard-quick-actions card-anim" style={{ animationDelay: '0.72s' }}>
            <h3 className="dashboard-section-title">
              <i className="fas fa-bolt"></i> Acceso Rápido
            </h3>
            <div className="dashboard-quick-grid">
              {[
                { label: 'Tutores', icon: 'fa-chalkboard-teacher', href: '/secretaria/tutores', color: '#7CB342' },
                { label: 'Matrículas', icon: 'fa-file-signature', href: '/secretaria/matriculas', color: '#AFB42B' },
                { label: 'Mensualidad', icon: 'fa-money-bill', href: '/secretaria/pagos', color: '#FFCA28' },
                { label: 'Aportes', icon: 'fa-hand-holding-usd', href: '/secretaria/pagos', color: '#9CCC65' },
              ].map((item, i) => (
                <a key={item.label} href={item.href} className="dashboard-quick-item" style={{
                  '--q-color': item.color,
                  animation: `fadeSlideIn 0.4s ease ${0.9 + i * 0.1}s both`,
                }}>
                  <div className="dashboard-quick-item-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>

          {recentMatriculas.length > 0 && (
            <div className="dashboard-gestion-card card-anim" style={{ animationDelay: '0.84s' }}>
              <div className="dashboard-gestion-card-header" style={{ background: 'linear-gradient(135deg, #9CCC65, #7CB342)' }}>
                <i className="fas fa-clock"></i>
                <span>Últimas Matrículas</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>ID</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Estudiante CI</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Curso</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>Estado</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMatriculas.map((m, idx) => (
                      <tr key={m.idmatriculacion || idx} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = ''}
                      >
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>#{m.idmatriculacion ?? '-'}</td>
                        <td style={{ padding: '10px 16px', color: '#374151' }}>{m.ciestudiante || '-'}</td>
                        <td style={{ padding: '10px 16px', color: '#374151' }}>{m.curso_descripcion || m.idcurso || '-'}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span className="badge" style={{
                            background: m.estado === 'A' ? '#d1fae5' : m.estado === 'R' ? '#fef3c7' : '#fee2e2',
                            color: m.estado === 'A' ? '#065f46' : m.estado === 'R' ? '#92400e' : '#991b1b',
                            fontSize: 11,
                          }}>
                            {m.estado === 'A' ? 'Activa' : m.estado === 'R' ? 'Registrada' : m.estado || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280' }}>
                          {m.fecharegistro ? formatDate(m.fecharegistro) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <a href="/secretaria/matriculas" style={{ color: '#7CB342', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                  Ver todas las matrículas <i className="fas fa-arrow-right" style={{ marginLeft: 4, fontSize: 11 }}></i>
                </a>
              </div>
            </div>
          )}
        </>
      )}

      <div className="dashboard-footer">
        <p>Escuela Cristiana Camireña &copy; {new Date().getFullYear()} — Todos los derechos reservados</p>
      </div>
    </div>
  );
}
