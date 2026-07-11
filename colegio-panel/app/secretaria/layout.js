'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/secretaria/dashboard', icon: 'fa-chart-pie' },
  { label: 'Personas', href: '/secretaria/personas', icon: 'fa-users' },
  { label: 'Tutores', href: '/secretaria/tutores', icon: 'fa-chalkboard-teacher' },
  { label: 'Estudiantes', href: '/secretaria/estudiantes', icon: 'fa-user-graduate' },
  { label: 'Matrículas', href: '/secretaria/matriculas', icon: 'fa-file-signature' },
  { label: 'Pagos', href: '/secretaria/pagos', icon: 'fa-money-bill' },
  { label: 'Consultas', href: '/secretaria/consultas', icon: 'fa-search' },
];

export default function SecretariaLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (!t || !u) { router.push('/'); return; }
    setUser(JSON.parse(u));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'SE';

  return (
    <div className="admin-layout">
      <nav className="admin-navbar">
        <button className="menu-btn" onClick={() => setOpen(true)}>☰</button>
        <div className="navbar-brand">
          <div className="navbar-brand-icon">
            <img src="/logo.png" alt="" />
          </div>
          <span className="navbar-brand-text">Escuela Cristiana Camireña</span>
        </div>
      </nav>

      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          {user && (
            <Link href="/perfil" className="sidebar-profile" onClick={() => setOpen(false)}>
              <div className="sidebar-profile-avatar">{initials}</div>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{user.nombre} {user.apellido}</div>
                <div className="sidebar-profile-rol">Secretaria</div>
              </div>
            </Link>
          )}
          <button className="sidebar-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-right-from-bracket"></i>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}