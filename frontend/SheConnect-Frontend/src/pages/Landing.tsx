import { Link } from 'react-router-dom';

function Landing() {
  return (
    <main>
      <h1>Welcome to SheConnect</h1>
      <p>A community for connection and support through motherhood.</p>
      <Link to="/auth">Sign in or create an account</Link>
    </main>
  );
}

export default Landing;
