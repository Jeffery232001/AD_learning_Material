import Active from './components/Active';
import './App.css';
import logo from './logo/logo.png';

function App() {
  return (
    <div className="App">
      <img src={logo} alt="ADLapp" />
      <h1>ADLapp</h1>
      <Active />
    </div>
  );
}

export default App;
