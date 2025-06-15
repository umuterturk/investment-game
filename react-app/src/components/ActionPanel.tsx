import React from 'react';
import { useGameContext } from '../context/GameContext';
import '../styles/ActionPanel.css';
import { HousingMarket } from './HousingMarket';

const ActionPanel: React.FC = () => {
    const { setModalContent, setModalTitle, setIsModalOpen } = useGameContext();

    const showStocksModal = () => {
        setModalTitle('Stocks');
        setModalContent(
            <div className="stocks-modal">
                <p>Stocks is coming soon.</p>
            </div>
        );
        setIsModalOpen(true);
    };


    const showSavingsModal = () => {
        setModalTitle('Savings');
        setModalContent(
            <div className="savings-modal">
                <p>Savings is coming soon.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showHousingModal = () => {
        setModalTitle('Housing Market');
        setModalContent(
            <HousingMarket onClose={() => setIsModalOpen(false)} />
        );
        setIsModalOpen(true);
    };

    const showMarriageModal = () => {
        setModalTitle('Marriage');
        setModalContent(
            <div className="marriage-modal">
                <p>Marriage is coming in paid version.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showCarModal = () => {
        setModalTitle('Car');
        setModalContent(
            <div className="car-modal">
                <p>Car is coming in paid version.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showLoansModal = () => {
        setModalTitle('Loans');
        setModalContent(
            <div className="loans-modal">
                <p>Loans is coming in paid version.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showChildrenModal = () => {
        setModalTitle('Children');
        setModalContent(
            <div className="children-modal">
                <p>Children is coming in paid version.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showLifeStyleModal = () => {
        setModalTitle('Life Style');
        setModalContent(
            <div className="life-style-modal">
                <p>Life Style is coming soon.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    return (
        <div className="action-panel">
            <h2>Actions</h2>
            <div className="action-buttons">
                <button className="pixel-btn" onClick={showHousingModal}>Housing</button>
                <button className="pixel-btn" onClick={showStocksModal}>Stocks</button>
                <button className="pixel-btn" onClick={showSavingsModal}>Savings</button>
                <button className="pixel-btn" onClick={showLoansModal}>Loans</button>
                <button className="pixel-btn" onClick={showLifeStyleModal}>Life Style</button>
                <button className="pixel-btn" onClick={showCarModal}>Car</button>
                <button className="pixel-btn" onClick={showMarriageModal}>Marriage</button>
                <button className="pixel-btn" onClick={showChildrenModal}>Children</button>
            </div>
        </div>
    );
};

export default ActionPanel; 