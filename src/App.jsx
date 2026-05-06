import './App.css';
import LogDashboard from './components/LogDashboard.jsx';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Splunk Log Analysis Dashboard</h1>
        <p>View logs, filter by content, and send events to Splunk.</p>
      </header>
      <main>
        <LogDashboard />
      </main>
    </div>
  );
}

export default App;
