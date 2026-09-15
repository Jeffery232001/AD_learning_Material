import Active from './components/Active';
import './App.css';
import logo from './logo/logo.png';

function App() {
  return (
    <div className="App" style={{ background: "#f3f5f7" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 24px",
          background: "#fff",
          borderBottom: "1px solid #d6dbe1",
          textAlign: "left",
        }}
      >
        <img src={logo} alt="ADlapp logo" style={{ width: 58, height: 58, objectFit: "contain" }} />
        <div>
          <div style={{ color: "#123b75", fontSize: 22, fontWeight: 800 }}>ADlapp</div>
          <div style={{ color: "#5f6b78", fontSize: 12 }}>Active Directory Learning App</div>
        </div>
      </header>
      <Active />
    </div>
  );
}

export default App;
