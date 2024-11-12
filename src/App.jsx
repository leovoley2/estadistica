// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VolleyballProvider } from './context/VolleyballContext';
import VolleyballStats from './components/VolleyballStats';
import VolleyballTrends from './components/VolleyballTrends';

function App() {
  return (
    <VolleyballProvider>
      <Router>
        <Routes>
          <Route path="/" element={<VolleyballStats />} />
          <Route path="/tendencias" element={<VolleyballTrends />} />
        </Routes>
      </Router>
    </VolleyballProvider>
  );
}

export default App;