import {Navbar, Container, Nav, Button} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';

export default function AppNavbar({ balance }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        //Clear Local Storage or auth token
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand href="/games">🏀 Sportsbook</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <Nav.Item className="text-white me-4">
              Balance: ${balance?.toFixed(2) || '0.00'}
            </Nav.Item>
            <Button variant="outline-light" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    )
}