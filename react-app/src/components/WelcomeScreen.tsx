import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../context/GameContext';
import Modal from './Modal';
import '../styles/WelcomeScreen.css';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

interface DifficultyOption {
    name: GameDifficulty;
    title: string;
    icon: string;
    startingCash: number;
    baseSalary: number;
    description: string;
    brutalIntro: string;
}

const difficultyOptions: DifficultyOption[] = [
    {
        name: 'easy',
        title: 'Upper Class',
        icon: 'diamond',
        startingCash: 50000,
        baseSalary: 4500,
        description: "Born with a silver spoon? More like a golden shovel! Start with £50,000 cash and a cushy £4,500 monthly salary. Your daddy's connections got you that corner office.",
        brutalIntro: "Congratulations, trust fund baby! You've won the genetic lottery. While others were learning to budget, you were learning which fork to use at fancy dinners. Let's see if you can avoid squandering your head start!"
    },
    {
        name: 'medium',
        title: 'Middle Class',
        icon: 'home',
        startingCash: 4500,
        baseSalary: 2100,
        description: "The average Joe experience. Start with £4,500 in savings and a decent £2,100 monthly salary. You've got enough to get started, but not enough to get careless.",
        brutalIntro: "Welcome to the middle class treadmill! You're not poor enough to qualify for help, but not rich enough to stop worrying about bills. The classic 'too much month at the end of the money' experience awaits!"
    },
    {
        name: 'hard',
        title: 'Working Class',
        icon: 'construction',
        startingCash: 1500,
        baseSalary: 1350,
        description: "The self-made challenge. Begin with just £1,500 and a modest £1,350 monthly salary. Every investment decision counts when you're starting from the bottom.",
        brutalIntro: "Hard mode activated! You're starting with pocket change and a paycheck that vanishes faster than free food at an office party. Hope you enjoy eating ramen while your rich friends post vacation pics!"
    }
];

const WelcomeScreen: React.FC = () => {
    const { game, forceUpdate } = useGameContext();
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyOption | null>(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleDifficultyClick = (difficulty: DifficultyOption) => {
        setSelectedDifficulty(difficulty);
        setShowModal(true);
    };

    const handleStartGame = () => {
        if (selectedDifficulty) {
            game.setDifficulty(selectedDifficulty);
            setShowModal(false); // Close the modal after starting the game
            forceUpdate();
            navigate('/game'); // Navigate to game screen
        }
    };

    const handleResumeGame = () => {
        // Check if there's an autosave
        game.savedGames = game.getSavedGames(); // Refresh saved games list
        const autosave = game.savedGames.find(save => save.name === 'Autosave');
        
        if (autosave) {
            console.log("Found autosave, attempting to load...");
            try {
                // First, load the saved game data directly to check its content
                const savedData = localStorage.getItem('investmentGameSave');
                if (savedData) {
                    console.log("Raw autosave data:", savedData.substring(0, 200) + "...");
                    const gameData = JSON.parse(savedData);
                    
                    console.log("Parsed autosave data:", {
                        difficulty: gameData.difficulty,
                        cash: gameData.player?.cash,
                        currentDay: gameData.player?.currentDay,
                        currentMonth: gameData.player?.currentMonth,
                        currentYear: gameData.player?.currentYear
                    });
                    
                    // Now load the game properly
                    const success = game.loadGameByName('Autosave');
                    
                    if (success) {
                        console.log("Game loaded successfully:", {
                            difficulty: game.difficulty,
                            cash: game.player.cash,
                            currentDay: game.player.currentDay,
                            currentMonth: game.player.currentMonth,
                            currentYear: game.player.currentYear
                        });
                        
                        // Force a complete UI update
                        forceUpdate();
                        
                        // Navigate to game screen
                        navigate('/game');
                    } else {
                        console.error("Failed to load game");
                    }
                }
            } catch (error) {
                console.error("Error loading game:", error);
            }
        } else {
            console.log("No autosave found");
        }
    };

    const handleLoadGame = () => {
        // Refresh saved games list
        game.savedGames = game.getSavedGames();
        
        if (game.savedGames.length === 0) {
            // TODO: Show a notification that no saves were found
            return;
        }

        setShowModal(true);
        setSelectedDifficulty(null); // Clear selected difficulty since we're loading a game
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <div className="welcome-screen">
            <div className="welcome-content">
                <h1>Investment Game</h1>
                <p className="intro-text">
                    Welcome to the wild world of investing!<br/>
                    Navigate through market crashes, economic booms, and life's surprises as you build your fortune.<br/>
                    Can you beat the market and retire wealthy in 20 years?
                </p>
                <p className="choose-difficulty">
                    Choose your starting class = difficulty:
                </p>
                
                <div className="difficulty-buttons">
                    {difficultyOptions.map((option) => (
                        <button 
                            key={option.name}
                            className="difficulty-button"
                            onClick={() => handleDifficultyClick(option)}
                        >
                            <span className="material-icons">{option.icon}</span>
                            <span>{option.title}</span>
                        </button>
                    ))}
                </div>

                <div className="game-actions">
                    <button 
                        className="action-button resume-button"
                        onClick={handleResumeGame}
                    >
                        <span className="material-icons">restore</span>
                        <span>Resume Game</span>
                    </button>
                    <button 
                        className="action-button load-button"
                        onClick={handleLoadGame}
                    >
                        <span className="material-icons">folder_open</span>
                        <span>Load Game</span>
                    </button>
                </div>
            </div>

            {showModal && selectedDifficulty && (
                <Modal 
                    onClose={closeModal}
                    title={selectedDifficulty.title}
                >
                    <div className="difficulty-modal-content">
                        <div className="modal-icon">
                            <span 
                                className="material-icons"
                                data-difficulty={selectedDifficulty.name}
                            >
                                {selectedDifficulty.icon}
                            </span>
                        </div>
                        
                        <p className="brutal-intro">{selectedDifficulty.brutalIntro}</p>
                        
                        <div className="difficulty-details">
                            <div className="detail-item">
                                <span className="material-icons">account_balance_wallet</span>
                                <span>Starting Cash: £{selectedDifficulty.startingCash.toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="material-icons">payments</span>
                                <span>Monthly Salary: £{selectedDifficulty.baseSalary.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <p className="difficulty-description">{selectedDifficulty.description}</p>
                        
                        <button className="start-game-button" onClick={handleStartGame}>
                            <span className="material-icons">play_arrow</span>
                            Start Your Journey
                        </button>
                    </div>
                </Modal>
            )}

            {showModal && !selectedDifficulty && game.savedGames.length > 0 && (
                <Modal
                    onClose={closeModal}
                    title="Load Game"
                >
                    <div className="load-game-modal-content">
                        <div className="saved-games-list">
                            {game.savedGames.map((save, index) => (
                                <div key={index} className="saved-game-item">
                                    <div className="save-info">
                                        <div className="save-name">{save.name}</div>
                                        <div className="save-date">{save.date}</div>
                                    </div>
                                    <div className="save-actions">
                                        <button 
                                            className="save-action-btn load-btn"
                                            onClick={() => {
                                                try {
                                                    // First, load the saved game data directly to check its content
                                                    const savedData = localStorage.getItem(`investmentGameSave_${save.name}`);
                                                    if (savedData) {
                                                        console.log(`Raw save data for ${save.name}:`, savedData.substring(0, 200) + "...");
                                                        const gameData = JSON.parse(savedData);
                                                        
                                                        console.log(`Parsed save data for ${save.name}:`, {
                                                            difficulty: gameData.difficulty,
                                                            cash: gameData.player?.cash,
                                                            currentDay: gameData.player?.currentDay,
                                                            currentMonth: gameData.player?.currentMonth,
                                                            currentYear: gameData.player?.currentYear
                                                        });
                                                        
                                                        // Now load the game properly
                                                        const success = game.loadGameByName(save.name);
                                                        
                                                        if (success) {
                                                            console.log("Game loaded successfully:", {
                                                                difficulty: game.difficulty,
                                                                cash: game.player.cash,
                                                                currentDay: game.player.currentDay,
                                                                currentMonth: game.player.currentMonth,
                                                                currentYear: game.player.currentYear
                                                            });
                                                            
                                                            closeModal();
                                                            // Force a complete UI update
                                                            forceUpdate();
                                                            
                                                            // Navigate to game screen
                                                            navigate('/game');
                                                        } else {
                                                            console.error(`Failed to load game ${save.name}`);
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.error(`Error loading game ${save.name}:`, error);
                                                }
                                            }}
                                        >
                                            <span className="material-icons">play_arrow</span>
                                        </button>
                                        {save.name !== 'Autosave' && (
                                            <button 
                                                className="save-action-btn delete-btn"
                                                onClick={() => {
                                                    game.deleteSavedGame(save.name);
                                                    game.savedGames = game.getSavedGames();
                                                    if (game.savedGames.length === 0) {
                                                        closeModal();
                                                    }
                                                }}
                                            >
                                                <span className="material-icons">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WelcomeScreen; 