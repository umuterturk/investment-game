import React, { useState } from 'react';
import { Housing } from '../models/types';
import { useGameContext } from '../context/GameContext';
import { GAME_DATA } from '../data/gameData';
import '../styles/HousingMarket.css';

interface HousingMarketProps {
  onClose: () => void;
}

export const HousingMarket: React.FC<HousingMarketProps> = ({ onClose }) => {
  const { game, updateGame } = useGameContext();
  const [selectedHouse, setSelectedHouse] = useState<Housing | null>(null);
  const [showMortgageDetails, setShowMortgageDetails] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [expandedSection, setExpandedSection] = useState<'houses' | 'rentals' | null>(null);

  const calculateMortgage = (house: Housing): number => {
    const principal = house.price * (1 - downPaymentPercent / 100);
    const currentRate = GAME_DATA.interestRates[game.player.currentYear] / 100 + 0.02;
    const monthlyRate = ((house.mortgageRate ?? currentRate) / 12);
    const numberOfPayments = ((house.mortgageTermYears ?? 30) * 12);
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  const calculateDownPayment = (house: Housing): number => {
    return house.price * (downPaymentPercent / 100);
  };

  const canAffordDownPayment = (house: Housing): boolean => {
    const downPayment = calculateDownPayment(house);
    return game.player.cash >= downPayment;
  };

  const toggleSection = (section: 'houses' | 'rentals') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleHouseClick = (house: Housing) => {
    setSelectedHouse(selectedHouse?.name === house.name ? null : house);
  };

  const handleBuyHouse = (house: Housing): void => {
    const downPayment = calculateDownPayment(house);
    if (game.player.cash < downPayment) {
      alert("You don't have enough cash for the down payment!");
      return;
    }

    const monthlyPayment = calculateMortgage(house);
    const newHouse: Housing = {
      ...house,
      type: 'OWNED',
      downPayment,
      monthlyPayment,
    };

    game.player.cash -= downPayment;
    game.player.housing = newHouse;
    game.player.monthlyHousingPayment = monthlyPayment;
    game.player.monthlyExpenses = {
      ...game.player.monthlyExpenses,
      rent: 0
    };

    game.addNotification(`Purchased ${house.name} for ${formatCurrency(house.price)} with ${downPaymentPercent}% down payment`);
    updateGame(game);
    onClose();
  };

  const handleRentHouse = (house: Housing): void => {
    const securityDeposit = house.monthlyPayment * 3;
    if (game.player.cash < securityDeposit) {
      alert(`You need ${formatCurrency(securityDeposit)} (3 months rent) as security deposit!`);
      return;
    }

    const newHouse: Housing = {
      ...house,
      type: 'RENT',
    };

    game.player.cash -= securityDeposit;
    game.player.housing = newHouse;
    game.player.monthlyHousingPayment = house.monthlyPayment;
    game.player.monthlyExpenses = {
      ...game.player.monthlyExpenses,
      rent: house.monthlyPayment
    };

    game.addNotification(`Rented ${house.name} for ${formatCurrency(house.monthlyPayment)} per month`);
    updateGame(game);
    onClose();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const convertSqMToSqFt = (sqm: number): number => {
    return Math.round(sqm * 10.764);
  };

  return (
    <div className="housing-market">
      <div className="housing-options">
        <div className="housing-section">
          <div 
            className={`section-header ${expandedSection === 'houses' ? 'expanded' : ''}`}
            onClick={() => toggleSection('houses')}
          >
            <h3>Houses for Sale</h3>
            <span className="material-icons">
              {expandedSection === 'houses' ? 'expand_less' : 'expand_more'}
            </span>
          </div>
          {expandedSection === 'houses' && (
            <div className="houses-grid">
              {game.housingMarket.availableHouses.map((house, index) => (
                <div key={index} className={`house-card ${selectedHouse?.name === house.name ? 'selected' : ''}`}>
                  <div className="house-summary" onClick={() => handleHouseClick(house)}>
                    <h4>{house.name}</h4>
                    <p>Price: {formatCurrency(house.price)}</p>
                    <p>Size: {house.size}m² ({convertSqMToSqFt(house.size)} sq ft)</p>
                    <p>Location: {house.location}</p>
                    <p>Condition: {house.condition}/10</p>
                  </div>
                  {selectedHouse?.name === house.name && (
                    <div className="house-details-modal">
                      <div className="mortgage-calculator">
                        <h4>Purchase Details</h4>
                        <p>Price: {formatCurrency(house.price)}</p>
                        <p>Price per m²: {formatCurrency(house.price / house.size)}</p>
                        {house.propertyTax && (
                          <p>Property Tax: {formatCurrency(house.propertyTax)}/year</p>
                        )}
                        <p>Current Interest Rate: {((house.mortgageRate ?? (GAME_DATA.interestRates[game.player.currentYear] / 100 + 0.02)) * 100).toFixed(2)}%</p>
                        <div className="down-payment-slider">
                          <label>Down Payment: {downPaymentPercent}%</label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={downPaymentPercent}
                            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                          />
                          <p>Down Payment Amount: {formatCurrency(calculateDownPayment(house))}</p>
                          <p>Monthly Payment: {formatCurrency(calculateMortgage(house))}</p>
                          {!canAffordDownPayment(house) && (
                            <p className="error-message">Insufficient funds for down payment</p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleBuyHouse(house)}
                          disabled={!canAffordDownPayment(house)}
                          className={!canAffordDownPayment(house) ? 'disabled' : ''}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="housing-section">
          <div 
            className={`section-header ${expandedSection === 'rentals' ? 'expanded' : ''}`}
            onClick={() => toggleSection('rentals')}
          >
            <h3>Houses for Rent</h3>
            <span className="material-icons">
              {expandedSection === 'rentals' ? 'expand_less' : 'expand_more'}
            </span>
          </div>
          {expandedSection === 'rentals' && (
            <div className="houses-grid">
              {game.housingMarket.rentals.map((house, index) => (
                <div key={index} className={`house-card ${selectedHouse?.name === house.name ? 'selected' : ''}`}>
                  <div className="house-summary" onClick={() => handleHouseClick(house)}>
                    <h4>{house.name}</h4>
                    <p>Monthly Rent: {formatCurrency(house.monthlyPayment)}</p>
                    <p>Size: {house.size}m² ({convertSqMToSqFt(house.size)} sq ft)</p>
                    <p>Location: {house.location}</p>
                    <p>Condition: {house.condition}/10</p>
                  </div>
                  {selectedHouse?.name === house.name && (
                    <div className="house-details-modal">
                      <div className="rental-details">
                        <h4>Rental Details</h4>
                        <p>Monthly Rent: {formatCurrency(house.monthlyPayment)}</p>
                        <p>Security Deposit: {formatCurrency(house.monthlyPayment * 3)}</p>
                        <p>Annual Cost: {formatCurrency(house.monthlyPayment * 12)}</p>
                        <button 
                          onClick={() => handleRentHouse(house)}
                          disabled={game.player.cash < house.monthlyPayment * 3}
                          className={game.player.cash < house.monthlyPayment * 3 ? 'disabled' : ''}
                        >
                          Rent Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 