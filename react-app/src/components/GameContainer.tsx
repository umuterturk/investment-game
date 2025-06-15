import React from 'react';
import { Navigate } from 'react-router-dom';
import GameHeader from './GameHeader';
import ActionPanel from './ActionPanel';
import Notifications from './Notifications';
import Modal from './Modal';
import { useGameContext } from '../context/GameContext';
import { getInterestRateForYearMonth } from '../data/gameData';
import '../styles/GameContainer.css';

export const GameContainer: React.FC = () => {
    const { game, isModalOpen, modalContent, modalTitle, closeModal } = useGameContext();
    
    // Redirect to welcome screen if no difficulty is set
    if (!game.difficulty) {
        console.log("No difficulty set, redirecting to welcome screen");
        return <Navigate to="/" />;
    }

    console.log("Rendering GameContainer with difficulty:", game.difficulty);
    return (
        <div className="game-container">
            <GameHeader />
            
            <div className="game-content">
                <main className="game-main">
                    <ActionPanel />
                    
                    <div className="info-panel">
                        <Notifications game={game} />
                        
                        <div className="monthly-summary">
                            <h3>Monthly Summary</h3>
                            <div className="summary-items-container">
                                <div className="summary-item">
                                    <span className="material-icons">work</span>
                                    <div>
                                        <div className="label">Net Income</div>
                                        <span>£{game.player.calculateNetMonthlyIncome().toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="summary-item">
                                    <span className="material-icons">shopping_cart</span>
                                    <div>
                                        <div className="label">Expenses</div>
                                        <span>£{game.player.getTotalExpenses().toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="summary-item">
                                    <span className="material-icons">savings</span>
                                    <div>
                                        <div className="label">Interest</div>
                                        <span>£{(game.player.savings * (getInterestRateForYearMonth(game.player.currentYear, game.player.currentMonth) * 0.7 / 100 / 12)).toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="summary-item">
                                    <span className="material-icons">home</span>
                                    <div>
                                        <div className="label">Rental</div>
                                        <span>£{game.player.properties.reduce((sum, property) => 
                                            sum + (property.isRental && property.rentalIncome ? property.rentalIncome : 0), 0).toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mini-charts">
                            <h3>Market Trends</h3>
                            <div className="chart-placeholder">
                                <p>Charts will be implemented here.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            
            {isModalOpen && (
                <Modal
                    onClose={closeModal}
                    title={modalTitle}
                >
                    {modalContent}
                </Modal>
            )}
        </div>
    );
};

export default GameContainer; 