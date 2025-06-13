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
                <p>Stocks functionality will be implemented here.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showPropertyModal = () => {
        setModalTitle('Property');
        setModalContent(
            <div className="property-modal">
                <p>Property functionality will be implemented here.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showSavingsModal = () => {
        setModalTitle('Savings');
        setModalContent(
            <div className="savings-modal">
                <p>Savings functionality will be implemented here.</p>
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
                <p>Marriage functionality will be implemented here.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showCarModal = () => {
        setModalTitle('Car');
        setModalContent(
            <div className="car-modal">
                <p>Car functionality will be implemented here.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    const showLoansModal = () => {
        setModalTitle('Loans');
        setModalContent(
            <div className="loans-modal">
                <p>Loans functionality will be implemented here.</p>
            </div>
        );
        setIsModalOpen(true);
    };

    return (
        <div className="action-panel">
            <h2>Actions</h2>
            <div className="action-buttons">
                <button className="pixel-btn" onClick={showStocksModal}>Stocks</button>
                <button className="pixel-btn" onClick={showPropertyModal}>Property</button>
                <button className="pixel-btn" onClick={showSavingsModal}>Savings</button>
                <button className="pixel-btn" onClick={showHousingModal}>Housing</button>
                <button className="pixel-btn" onClick={showMarriageModal}>Marriage</button>
                <button className="pixel-btn" onClick={showCarModal}>Car</button>
                <button className="pixel-btn" onClick={showLoansModal}>Loans</button>
            </div>
        </div>
    );
};

export default ActionPanel; 