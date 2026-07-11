'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'fa-chart-pie' },
  { label: 'Personas', href: '/admin/personas', icon: 'fa-users' },
  { label: 'Administradores', href: '/admin/usuarios?rol=admin', icon: 'fa-user-gear' },
  { label: 'Directores', href: '/admin/usuarios?rol=director', icon: 'fa-user-tie' },
  { label: 'Secretarias', href: '/admin/usuarios?rol=secretaria', icon: 'fa-clipboard-user' },
  { label: 'Tutores', href: '/admin/usuarios?rol=tutor', icon: 'fa-people-group' },
];

function AdminSidebar({ open, setOpen, user, handleLogout }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const currentHref = pathname + (qs ? '?' + qs : '');
  const initials = user ? (user.nombre?.charAt(0) || '') + (user.apellido?.charAt(0) || '') : 'AD';

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          {user && (
            <Link href="/perfil" className="sidebar-profile" onClick={() => setOpen(false)}>
              <div className="sidebar-profile-avatar">{initials}</div>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{user.nombre} {user.apellido}</div>
                <div className="sidebar-profile-rol">Administrador</div>
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
              className={`sidebar-link ${currentHref === item.href ? 'active' : ''}`}
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
    </>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
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

      <Suspense fallback={null}>
        <AdminSidebar open={open} setOpen={setOpen} user={user} handleLogout={handleLogout} />
      </Suspense>

      <main className="admin-content">{children}</main>
    </div>
  );
}