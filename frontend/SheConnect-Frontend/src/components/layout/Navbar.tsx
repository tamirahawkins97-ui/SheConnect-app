

function NavBar(){
    return(
        <header className="navbar">
            <div className="navbar-logo">
            </div>
            <nav>
                <ul>
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