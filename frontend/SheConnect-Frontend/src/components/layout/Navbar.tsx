import { Link, NavLink } from 'react-router-dom';
import Logo from '../../assets/Logo.jpg';

const routes = [
  { to: '/feed', label: 'Feed', end: true },
  { to: '/conversations', label: 'Social Hub', end: false },
  { to: '/create-post', label: 'Create Post', end: true },
  { to: '/profile', label: 'Profile', end: true },
  { to: '/settings', label: 'Settings', end: true },
];

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-rose-100/80 bg-white/80 shadow-[0_4px_18px_rgba(244,63,94,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link className="group flex shrink-0 items-center gap-3" to="/feed" aria-label="SheConnect feed">
          <img
            src={Logo}
            alt=""
            className="size-11 rounded-full border border-rose-100 object-cover shadow-[0_2px_10px_rgba(244,63,94,0.2)] transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105"
          />
          <span className="flex flex-col">
            <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text font-serif text-xl font-bold tracking-wide text-transparent sm:text-2xl">
              SheConnect
            </span>
            <span className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-rose-300">
              Motherhood Connected
            </span>
          </span>
        </Link>

        <nav className="w-full overflow-x-auto lg:w-auto" aria-label="Main navigation">
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