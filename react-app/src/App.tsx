import React from 'react';
import { GameProvider } from './context/GameContext';
import GameContainer from './components/GameContainer';
import './App.css';

function App() {
  return (
    <div className="App">
      <GameProvider>
        <GameContainer />
      </GameProvider>
    </div>
  );
}

export default App;
