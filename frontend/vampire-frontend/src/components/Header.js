import logo from '../images/logo.png';
function Header(){
    return(
        <header>
        <div className="logo-container">
      <img src={logo} alt="Bloodline Express Logo" className="logo" />
      </div>
      </header>
    );
}

export default Header;