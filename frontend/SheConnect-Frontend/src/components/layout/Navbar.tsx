import { NavLink } from 'react-router-dom';
import Brand from './Brand';

const routes = [
  { to: '/feed', label: 'Home', end: true },
  { to: '/conversations', label: 'Social Hub', end: false },
  { to: '/create-post', label: 'Create Post', end: true },
  { to: '/profile', label: 'Profile', end: true },
  { to: '/settings', label: 'Settings', end: true },
];

function NavBar() {
  return (
    <header className="app-navbar sticky top-0 z-50 border-b border-rose-100/80 bg-white/80 shadow-[0_4px_18px_rgba(244,63,94,0.04)] backdrop-blur-xl">
      <div className="app-navbar-inner mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <Brand to="/feed" className="shrink-0" />

        <nav className="app-navbar-nav w-full overflow-x-auto lg:w-auto" aria-label="Main navigation">
          <ul className="flex min-w-max items-center justify-center gap-1.5 text-sm font-medium tracking-wide sm:gap-2">
            {routes.map((route) => (
              <li key={route.to}>
                <NavLink
                  to={route.to}
                  end={route.end}
                  className={({ isActive }) =>
                    `block rounded-full px-3 py-2 transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:translate-y-0 active:scale-95 sm:px-4 ${
                      isActive ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-zinc-500'
                    }`
                  }
                >
                  {route.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;