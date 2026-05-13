import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ExercisePage from './pages/ExercisePage';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/:exercise" element={<ExercisePage />} />
      </Routes>
    </Router>
  );
}