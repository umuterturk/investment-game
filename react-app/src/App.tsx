import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import GameContainer from './components/GameContainer';
import WelcomeScreen from './components/WelcomeScreen';
import './App.css';

function App() {
  return (
    <div className="App">
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<WelcomeScreen />} />
            <Route path="/game" element={<GameContainer />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </GameProvider>
    </div>
  );
}

export default App;
