'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/tutor/dashboard', icon: 'fa-chart-pie' },
  { label: 'Mis Estudiantes', href: '/tutor/estudiantes', icon: 'fa-users' },
];

export default function TutorLayout({ children }) {
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

  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'TU';

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
                <div className="sidebar-profile-rol">Tutor</div>
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
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
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