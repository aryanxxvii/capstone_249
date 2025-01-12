import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DataAnalysis from './pages/DataAnalysis';
import ChatBot from './pages/ChatBot';
import News from './pages/News';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<DataAnalysis />} />
          <Route path="/news" element={<News />} />
          <Route path="/chat" element={<ChatBot />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 