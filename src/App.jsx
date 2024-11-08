import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VolleyballStats from './components/VolleyballStats';
import VolleyballTrends from './components/VolleyballTrends';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VolleyballStats />} />
        <Route path="/tendencias" element={<VolleyballTrends />} />
      </Routes>
    </Router>
  );
}

export default App;