import React, { createContext, useContext, useState, useEffect } from 'react';
import { Game } from '../models/Game';
import { GameState, NewsEvent } from '../models/types';

interface GameContextType {
    game: Game;
    updateGame: (newGame: Game) => void;
    currentNews: NewsEvent | null;
    setCurrentNews: (news: NewsEvent | null) => void;
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    closeModal: (resumeGame?: boolean) => void;
    modalContent: React.ReactNode;
    setModalContent: (content: React.ReactNode) => void;
    modalTitle: string;
    setModalTitle: (title: string) => void;
    refreshUI: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [game, setGame] = useState<Game>(() => {
        console.log("Initializing game...");
        // Create a new game instance
        const newGame = new Game();
        
        // Try to load saved game data
        try {
            const savedGameData = localStorage.getItem('investmentGameSave');
            if (savedGameData) {
                console.log("Found saved game data, loading it...");
                const success = newGame.loadGame();
                console.log("Load success:", success);
                
                // Always ensure game is paused after page refresh
                if (success) {
                    // Store the current game state if it's running
                    if (newGame.gameState === GameState.RUNNING || newGame.gameState === GameState.FAST) {
                        newGame.previousGameState = newGame.gameState;
                    }
                    
                    // Set game state to paused
                    newGame.gameState = GameState.PAUSED;
                    
                    console.log("Game initialized from saved data:", {
                        currentState: newGame.gameState,
                        previousState: newGame.previousGameState,
                        day: newGame.player.currentDay,
                        month: newGame.player.currentMonth,
                        year: newGame.player.currentYear,
                        cash: newGame.player.cash
                    });
                }
            } else {
                console.log("No saved game found, starting new game");
            }
        } catch (error) {
            console.error("Error loading saved game:", error);
        }
        
        return newGame;
    });

    const updateGame = (newGame: Game) => {
        setGame(newGame);
        refreshUI();
    };
    
    const [currentNews, setCurrentNews] = useState<NewsEvent | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const [modalTitle, setModalTitle] = useState<string>('');
    const [refreshCounter, setRefreshCounter] = useState<number>(0);

    // Set up game update interval
    useEffect(() => {
        if (game.gameState === GameState.RUNNING || game.gameState === GameState.FAST) {
            const intervalTime = game.gameState === GameState.RUNNING 
                ? game.timePerDay 
                : game.timePerDay / 3;
            
            const interval = setInterval(() => {
                refreshUI();
            }, intervalTime);
            
            return () => clearInterval(interval);
        }
    }, [game, game.gameState, refreshCounter]);
    
    // Set up page unload handler
    useEffect(() => {
        // Save game state when page is unloaded or refreshed
        const handleBeforeUnload = () => {
            console.log("Page unloading, saving game state...");
            game.handlePageUnload();
        };
        
        // Add event listener for page unload
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Clean up event listener
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [game]);
    
    // Verify game data is loaded correctly
    useEffect(() => {
        // Log game state after initialization
        console.log("Game state after context initialization:", {
            gameState: game.gameState,
            previousState: game.previousGameState,
            day: game.player.currentDay,
            month: game.player.currentMonth,
            year: game.player.currentYear,
            cash: game.player.cash
        });
    }, []);

    // Function to force UI refresh
    const refreshUI = () => {
        setRefreshCounter(prev => prev + 1);
    };

    // Function to close modal and handle game state
    const closeModal = (resumeGame: boolean = true) => {
        setIsModalOpen(false);
        
        // Restore previous game state if needed
        if (resumeGame && game.previousGameState && game.previousGameState !== GameState.PAUSED) {
            game.setGameState(game.previousGameState);
            game.previousGameState = null;
            refreshUI();
        }
    };

    return (
        <GameContext.Provider value={{
            game,
            updateGame,
            currentNews,
            setCurrentNews,
            isMenuOpen,
            setIsMenuOpen,
            isModalOpen,
            setIsModalOpen,
            closeModal,
            modalContent,
            setModalContent,
            modalTitle,
            setModalTitle,
            refreshUI
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = (): GameContextType => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGameContext must be used within a GameProvider');
    }
    return context;
}; 