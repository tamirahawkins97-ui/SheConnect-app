import Logo from '../../assets/Logo.jpg'; // 1. Import the image

function NavBar(){
    return(
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-rose-100/80">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                <img
                src={Logo}
                alt="SheConnect Logo"
                className="w-11 h-11 rounded-full object-cover shadow-[0_2px_10px_rgba(244,63,94,0.2)] transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex flex-col">
                    <span className="text-2xl font-serif font-bold tracking-wider bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                     SheConnect
                    </span>
                    <span className="text-[9px] tracking-[0.25em] uppercase text-rose-300 font-semibold -mt-1">
                        Motherhood Connected
                    </span>
                </div>
            </div>
            <nav className="flex items-center gap-8 text-sm font-medium tracking-wide text-zinc-500">
                <ul className="hover:text-rose-500 transition-colors">
                    <li><a href = "/">Home</a></li>
                    <li><a href = "/feed">My Current Feed</a></li>
                    <li><a href ="/social">Social Hub</a></li>
                    <li><a href = "/profile">My Profile</a></li>
                </ul>
            </nav>
        </header>
    )
}

export default NavBar;