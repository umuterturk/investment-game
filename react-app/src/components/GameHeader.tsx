import React from 'react';
import { useGameContext } from '../context/GameContext';
import { GameState } from '../models/types';
import { GAME_DATA } from '../data/gameData';
import '../styles/GameHeader.css';

const GameHeader: React.FC = () => {
    const { game, setModalContent, setModalTitle, setIsModalOpen, closeModal, refreshUI } = useGameContext();

    // Format currency for display
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate elapsed time from start date
    const getElapsedTime = (): string => {
        const startYear = GAME_DATA.config.startYear;
        const startMonth = GAME_DATA.config.startMonth;
        
        let years = game.player.currentYear - startYear;
        let months = game.player.currentMonth - startMonth;
        let days = game.player.currentDay - 1; // Subtract 1 since game starts on day 1
        
        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }
        
        // Always show all units with leading zeros
        return `${years}y ${months}m ${days}d`;
    };

    // Get current date string in elapsed time format
    const getDateString = (): string => {
        return getElapsedTime();
    };

    // Handle game state changes
    const handlePause = (): void => {
        game.setGameState(GameState.PAUSED);
        refreshUI();
    };

    const handlePlay = (): void => {
        game.setGameState(GameState.RUNNING);
        refreshUI();
    };

    const handleFast = (): void => {
        game.setGameState(GameState.FAST);
        refreshUI();
    };

    // Save the current game
    const handleSaveGame = (): void => {
        setModalTitle('Save Game');
        setModalContent(
            <div className="save-game-modal">
                <div className="save-options">
                    <button 
                        className="save-option-btn"
                        onClick={() => {
                            game.saveGame();
                            closeModal();
                            addNotification("Game autosaved successfully!");
                        }}
                    >
                        <span className="material-icons">save</span>
                        <span>Quick Save</span>
                    </button>
                    
                    <div className="save-as-container">
                        <input 
                            type="text" 
                            id="save-name" 
                            placeholder="Enter save name..." 
                            className="save-name-input"
                        />
                        <button 
                            className="save-option-btn"
                            onClick={() => {
                                const saveNameInput = document.getElementById('save-name') as HTMLInputElement;
                                const saveName = saveNameInput.value.trim();
                                
                                if (saveName) {
                                    // Check if save name already exists
                                    const existingSave = game.savedGames.find(save => save.name === saveName);
                                    if (existingSave && saveName !== 'Autosave') {
                                        if (window.confirm(`A save with name "${saveName}" already exists. Do you want to overwrite it?`)) {
                                            game.saveGameAs(saveName);
                                            closeModal();
                                            addNotification(`Game saved as "${saveName}" successfully!`);
                                        }
                                    } else {
                                        game.saveGameAs(saveName);
                                        closeModal();
                                        addNotification(`Game saved as "${saveName}" successfully!`);
                                    }
                                } else {
                                    addNotification("Please enter a save name.");
                                }
                            }}
                        >
                            <span className="material-icons">save_as</span>
                            <span>Save As</span>
                        </button>
                    </div>
                </div>
                
                <button 
                    className="menu-btn" 
                    onClick={handleMenu}
                    style={{ marginTop: '20px' }}
                >
                    Back to Menu
                </button>
            </div>
        );
    };

    // Load a saved game
    const handleLoadGame = (): void => {
        // Refresh saved games list
        game.savedGames = game.getSavedGames();
        console.log("Available saved games:", game.savedGames);
        
        if (game.savedGames.length === 0) {
            addNotification("No saved games found.");
            closeModal(false);
            return;
        }
        
        setModalTitle('Load Game');
        setModalContent(
            <div className="load-game-modal">
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
                                        const success = game.loadGameByName(save.name);
                                        closeModal(false);
                                        
                                        if (success) {
                                            addNotification(`Game "${save.name}" loaded successfully!`);
                                            // Force a double refresh to ensure all UI elements update
                                            refreshUI();
                                            setTimeout(() => {
                                                refreshUI();
                                                console.log("Game date after load:", {
                                                    day: game.player.currentDay,
                                                    month: game.player.currentMonth,
                                                    year: game.player.currentYear
                                                });
                                            }, 100);
                                        } else {
                                            addNotification(`Error loading game "${save.name}".`);
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
                                            // Refresh the saved games list
                                            handleLoadGame();
                                            addNotification(`Save "${save.name}" deleted.`);
                                        }}
                                    >
                                        <span className="material-icons">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <button 
                    className="menu-btn" 
                    onClick={handleMenu}
                    style={{ marginTop: '20px' }}
                >
                    Back to Menu
                </button>
            </div>
        );
    };

    // Restart the game
    const handleRestartGame = (): void => {
        setModalTitle('Confirm Restart');
        setModalContent(
            <div className="confirm-modal">
                <p>Are you sure you want to restart the game? All progress will be lost.</p>
                <div className="confirm-buttons">
                    <button 
                        className="confirm-btn confirm-yes" 
                        onClick={() => {
                            game.restartGame();
                            closeModal(false); // Don't resume previous state after restarting
                            addNotification("Game restarted!");
                            refreshUI();
                        }}
                    >
                        Yes, Restart
                    </button>
                    <button 
                        className="confirm-btn confirm-no" 
                        onClick={() => handleMenu()}
                    >
                        No, Cancel
                    </button>
                </div>
            </div>
        );
    };

    // Show game settings
    const handleGameSettings = (): void => {
        setModalTitle('Game Settings');
        setModalContent(
            <div className="settings-modal">
                <div className="setting-item">
                    <label>Game Speed:</label>
                    <div className="setting-controls">
                        <button 
                            className={`setting-btn ${game.timePerDay === 2000 ? 'active' : ''}`}
                            onClick={() => {
                                game.timePerDay = 2000;
                                refreshUI();
                                addNotification("Game speed set to Fast.");
                            }}
                        >
                            Fast
                        </button>
                        <button 
                            className={`setting-btn ${game.timePerDay === 3000 ? 'active' : ''}`}
                            onClick={() => {
                                game.timePerDay = 3000;
                                refreshUI();
                                addNotification("Game speed set to Normal.");
                            }}
                        >
                            Normal
                        </button>
                        <button 
                            className={`setting-btn ${game.timePerDay === 5000 ? 'active' : ''}`}
                            onClick={() => {
                                game.timePerDay = 5000;
                                refreshUI();
                                addNotification("Game speed set to Slow.");
                            }}
                        >
                            Slow
                        </button>
                    </div>
                </div>
                
                <div className="setting-item">
                    <label>Sound:</label>
                    <div className="setting-controls">
                        <button 
                            className={`setting-btn ${game.soundEnabled ? 'active' : ''}`}
                            onClick={() => {
                                game.toggleSound();
                                refreshUI();
                                addNotification(game.soundEnabled ? "Sound enabled." : "Sound disabled.");
                            }}
                        >
                            {game.soundEnabled ? (
                                <>
                                    <span className="material-icons">volume_up</span>
                                    <span>On</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">volume_off</span>
                                    <span>Off</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                <button 
                    className="menu-btn" 
                    onClick={handleMenu}
                    style={{ marginTop: '20px' }}
                >
                    Back to Menu
                </button>
            </div>
        );
    };

    // Show help information
    const handleHelp = (): void => {
        setModalTitle('Game Help');
        setModalContent(
            <div className="help-modal">
                <h3>Game Controls</h3>
                <ul>
                    <li><strong>Pause:</strong> Pause the game</li>
                    <li><strong>Play:</strong> Run the game at normal speed</li>
                    <li><strong>Fast Forward:</strong> Run the game at 3x speed</li>
                </ul>
                
                <h3>Game Stats</h3>
                <ul>
                    <li><strong>Cash:</strong> Your liquid money</li>
                    <li><strong>Net Worth:</strong> Total value of all your assets</li>
                    <li><strong>Income:</strong> Monthly net income</li>
                </ul>
                
                <h3>Actions</h3>
                <ul>
                    <li><strong>Stocks:</strong> Buy and sell stocks</li>
                    <li><strong>Property:</strong> Buy and sell properties</li>
                    <li><strong>Savings:</strong> Manage your savings account</li>
                    <li><strong>Housing:</strong> Manage your housing situation</li>
                    <li><strong>Marriage:</strong> Get married for financial benefits</li>
                    <li><strong>Car:</strong> Buy and sell vehicles</li>
                    <li><strong>Loans:</strong> Take out loans when needed</li>
                </ul>
                
                <button 
                    className="menu-btn" 
                    onClick={handleMenu}
                    style={{ marginTop: '20px' }}
                >
                    Back to Menu
                </button>
            </div>
        );
    };

    // Helper function to add notifications
    const addNotification = (message: string): void => {
        game.addNotification(message);
        refreshUI();
    };

    // Resume the previous game state
    const handleResumeGame = (): void => {
        if (game.previousGameState && game.previousGameState !== GameState.PAUSED) {
            game.setGameState(game.previousGameState);
            game.previousGameState = null;
            closeModal();
            addNotification("Game resumed from previous state.");
        } else {
            addNotification("No previous game state to resume.");
            closeModal();
        }
    };

    const handleMenu = (): void => {
        // Store the previous game state and pause the game when menu opens
        if (game.gameState !== GameState.PAUSED) {
            game.previousGameState = game.gameState;
            game.setGameState(GameState.PAUSED);
            refreshUI();
        }
        
        setModalTitle('Game Menu');
        setModalContent(
            <div className="game-menu-modal">
                <div className="menu-options">
                    <button className="menu-btn" onClick={handleSaveGame}>
                        <span className="material-icons">save</span>
                        <span>Save Game</span>
                    </button>
                    <button className="menu-btn" onClick={handleLoadGame}>
                        <span className="material-icons">folder_open</span>
                        <span>Load Game</span>
                    </button>
                    <button className="menu-btn" onClick={handleRestartGame}>
                        <span className="material-icons">replay</span>
                        <span>Restart Game</span>
                    </button>
                    <button className="menu-btn" onClick={handleGameSettings}>
                        <span className="material-icons">settings</span>
                        <span>Game Settings</span>
                    </button>
                    <button className="menu-btn" onClick={handleHelp}>
                        <span className="material-icons">help</span>
                        <span>Help</span>
                    </button>
                    {game.previousGameState && game.previousGameState !== GameState.PAUSED && (
                        <button className="menu-btn resume-btn" onClick={handleResumeGame}>
                            <span className="material-icons">restore</span>
                            <span>Resume Previous State</span>
                        </button>
                    )}
                </div>
            </div>
        );
        setIsModalOpen(true);
    };

    // Show detail modals
    const showDateDetails = (): void => {
        setModalTitle('Date Details');
        setModalContent(
            <div className="date-details">
                <div className="detail-item">
                    <span className="label">Elapsed Time:</span>
                    <span>{getElapsedTime()}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Current Date:</span>
                    <span>{`${game.player.currentDay.toString().padStart(2, '0')}/${(game.player.currentMonth + 1).toString().padStart(2, '0')}/${game.player.currentYear}`}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Your Age:</span>
                    <span>{game.player.age} years</span>
                </div>
                <div className="detail-item">
                    <span className="label">Game Progress:</span>
                    <span>{Math.floor((game.player.age - GAME_DATA.config.startAge) / (GAME_DATA.config.endAge - GAME_DATA.config.startAge) * 100)}%</span>
                </div>
            </div>
        );
        setIsModalOpen(true);
    };

    const showCashDetails = (): void => {
        setModalTitle('Cash Details');
        setModalContent(
            <div className="cash-details">
                <div className="detail-item">
                    <span className="label">Current Cash:</span>
                    <span>{formatCurrency(game.player.cash)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Savings:</span>
                    <span>{formatCurrency(game.player.savings)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Monthly Income:</span>
                    <span>{formatCurrency(game.player.monthlyIncome)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Monthly Expenses:</span>
                    <span>{formatCurrency(game.player.getTotalExpenses())}</span>
                </div>
            </div>
        );
        setIsModalOpen(true);
    };

    const showNetWorthDetails = (): void => {
        // Calculate asset values
        let stocksValue = 0;
        for (const symbol in game.player.stocks) {
            const stock = game.player.stocks[symbol];
            const currentPrice = game.player.getCurrentStockPrice(symbol);
            stocksValue += stock.shares * currentPrice;
        }

        let propertiesValue = 0;
        for (const property of game.player.properties) {
            propertiesValue += game.player.getCurrentPropertyValue(property);
        }

        let loansValue = 0;
        for (const loan of game.player.loans) {
            loansValue += loan.remainingAmount;
        }

        const carValue = game.player.car ? game.player.car.value : 0;

        setModalTitle('Net Worth Details');
        setModalContent(
            <div className="net-worth-details">
                <div className="detail-item">
                    <span className="label">Total Net Worth:</span>
                    <span>{formatCurrency(game.player.getNetWorth())}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Cash:</span>
                    <span>{formatCurrency(game.player.cash)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Savings:</span>
                    <span>{formatCurrency(game.player.savings)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Stocks:</span>
                    <span>{formatCurrency(stocksValue)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Properties:</span>
                    <span>{formatCurrency(propertiesValue)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Car:</span>
                    <span>{formatCurrency(carValue)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Loans:</span>
                    <span>-{formatCurrency(loansValue)}</span>
                </div>
            </div>
        );
        setIsModalOpen(true);
    };

    const showIncomeDetails = (): void => {
        // Calculate rental income
        let rentalIncome = 0;
        for (const property of game.player.properties) {
            if (property.isRental && property.rentalIncome) {
                rentalIncome += property.rentalIncome;
            }
        }

        // Calculate savings interest (monthly)
        const baseRate = GAME_DATA.interestRates[game.player.currentYear] || 0;
        const savingsRate = baseRate * 0.7; // Savings accounts typically offer less than base rate
        const monthlyRate = savingsRate / 100 / 12;
        const savingsInterest = game.player.savings * monthlyRate;

        // Calculate total expenses
        const totalExpenses = game.player.getTotalExpenses();

        // Calculate net income
        const netIncome = game.player.monthlyIncome + rentalIncome + savingsInterest - totalExpenses;

        setModalTitle('Income Details');
        setModalContent(
            <div className="income-details">
                <div className="detail-item">
                    <span className="label">Net Monthly Income:</span>
                    <span>{formatCurrency(netIncome)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Salary (after tax):</span>
                    <span>{formatCurrency(game.player.monthlyIncome)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Rental Income:</span>
                    <span>{formatCurrency(rentalIncome)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Savings Interest:</span>
                    <span>{formatCurrency(savingsInterest)}</span>
                </div>
                <div className="detail-item">
                    <span className="label">Total Expenses:</span>
                    <span>-{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="detail-section">
                    <h4>Expense Breakdown</h4>
                    {Object.entries(game.player.monthlyExpenses).map(([category, amount]) => (
                        <div className="detail-item" key={category}>
                            <span className="label">{category.charAt(0).toUpperCase() + category.slice(1)}:</span>
                            <span>{formatCurrency(amount)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="game-header-stats">
                <div className="header-stats">
                    <div className="header-item" onClick={showCashDetails}>
                        <span className="material-icons">account_balance_wallet</span>
                        <span id="cash">{formatCurrency(game.player.cash)}</span>
                    </div>
                    <div className="header-item" onClick={showNetWorthDetails}>
                        <span className="material-icons">trending_up</span>
                        <span id="net-worth">{formatCurrency(game.player.getNetWorth())}</span>
                    </div>
                    <div className="header-item" onClick={showIncomeDetails}>
                        <span className="material-icons">payments</span>
                        <span id="net-income">
                            {formatCurrency(
                                game.player.monthlyIncome - game.player.getTotalExpenses()
                            )}
                        </span>
                    </div>
                </div>
            </div>
            <div className="game-header">
                <div className="header-content">
                    <div className="header-controls-row">
                    <div className="header-item" onClick={showDateDetails}>
                        <span className="material-icons">calendar_today</span>
                        <span id="game-date">{getDateString()}</span>
                    </div>
                        <button 
                            className={`control-btn ${game.gameState === GameState.PAUSED ? 'active' : ''}`} 
                            title="Pause"
                            onClick={handlePause}
                        >
                            <span className="material-icons">pause</span>
                        </button>
                        <button 
                            className={`control-btn ${game.gameState === GameState.RUNNING ? 'active' : ''}`} 
                            title="Normal Speed"
                            onClick={handlePlay}
                        >
                            <span className="material-icons">play_arrow</span>
                        </button>
                        <button 
                            className={`control-btn ${game.gameState === GameState.FAST ? 'active' : ''}`} 
                            title="Fast Forward"
                            onClick={handleFast}
                        >
                            <span className="material-icons">fast_forward</span>
                        </button>
                        <button 
                            className="control-btn" 
                            title="Menu"
                            onClick={handleMenu}
                        >
                            <span className="material-icons">menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GameHeader; 