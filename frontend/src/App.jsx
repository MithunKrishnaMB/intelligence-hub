import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MeetingDetail from './pages/MeetingDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meeting/:id" element={<MeetingDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
