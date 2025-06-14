import React, { useState, useEffect, useCallback } from 'react';
import { Housing } from '../models/types';
import { useGameContext } from '../context/GameContext';
import { GAME_DATA, getInterestRateForYearMonth, calculateStampDuty } from '../data/gameData';
import { calculateRent } from '../utils/housingUtils';
import '../styles/HousingMarket.css';

interface HousingMarketProps {
  onClose: () => void;
}

export const HousingMarket: React.FC<HousingMarketProps> = ({ onClose }) => {
  const { game, updateGame } = useGameContext();
  const [selectedHouse, setSelectedHouse] = useState<Housing | null>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [expandedSection, setExpandedSection] = useState<'houses' | 'rentals' | 'owned' | null>(null);
  const [saleConfirmation, setSaleConfirmation] = useState<{property: Housing, index: number} | null>(null);
  const [renovationConfirmation, setRenovationConfirmation] = useState<{property: Housing, cost: number} | null>(null);

  const getMinimumDownPayment = useCallback(() => {
    const ownedProperties = game.getNumberOfOwnedProperties();
    return ownedProperties === 0 ? 5 : ownedProperties === 1 ? 20 : 25; // 5% for first property, 20% for second, 25% for additional properties
  }, [game]);

  const calculateMaxMortgageLoanAmount = useCallback((): number => {
    const annualIncome = game.player.monthlyIncome * 12;
    return annualIncome * 4.5; // Maximum loan is 4.5 times annual income
  }, [game.player.monthlyIncome]);

  // Calculate required down payment percentage for a house based on price and max loan
  const calculateRequiredDownPayment = useCallback((house: Housing): number => {
    const maxLoan = calculateMaxMortgageLoanAmount();
    const minDownPaymentPercent = getMinimumDownPayment();
    
    // Calculate the minimum down payment needed to meet the 4.5x rule
    const loanNeeded = house.price * (1 - minDownPaymentPercent / 100);
    
    if (loanNeeded <= maxLoan) {
      // If the minimum down payment satisfies the 4.5x rule, use that
      return minDownPaymentPercent;
    } else {
      // Calculate the down payment percentage needed to satisfy the 4.5x rule
      const requiredDownPayment = Math.ceil((1 - (maxLoan / house.price)) * 100);
      return Math.min(100, Math.max(minDownPaymentPercent, requiredDownPayment));
    }
  }, [calculateMaxMortgageLoanAmount, getMinimumDownPayment]);

  // Update down payment when number of owned properties changes or when selected house changes
  useEffect(() => {
    if (selectedHouse) {
      const requiredDownPayment = calculateRequiredDownPayment(selectedHouse);
      if (downPaymentPercent < requiredDownPayment) {
        setDownPaymentPercent(requiredDownPayment);
      }
    }
  }, [game.player.properties.length, selectedHouse, calculateRequiredDownPayment, downPaymentPercent]);

  // Generate new listings only when component mounts
  useEffect(() => {
    // Only generate new listings when the component first mounts
    game.generateNewListings();
    updateGame(game);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only on mount

  const calculateMortgage = (house: Housing): number => {
    const principal = house.price * (1 - downPaymentPercent / 100);
    const currentRate = getInterestRateForYearMonth(game.player.currentYear, game.player.currentMonth) / 100 + 0.02;
    const monthlyRate = ((house.mortgageRate ?? currentRate) / 12);
    const numberOfPayments = ((house.mortgageTermYears ?? 30) * 12);
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  const calculateDownPayment = (house: Housing): number => {
    return house.price * (downPaymentPercent / 100);
  };

  const calculateStampDutyForHouse = (house: Housing): number => {
    // Count number of properties owned (excluding rentals)
    const ownedProperties = game.player.properties.filter(p => p.type === 'OWNED').length;
    // If this is not replacing the primary residence, it's an additional property
    const isAdditionalProperty = ownedProperties > 0;
    return calculateStampDuty(house.price, game.player.currentYear, isAdditionalProperty);
  };

  const canAffordDownPayment = (house: Housing): boolean => {
    const downPayment = calculateDownPayment(house);
    const stampDutyTax = calculateStampDutyForHouse(house);
    const totalUpfrontCost = downPayment + stampDutyTax;
    return game.player.cash >= totalUpfrontCost;
  };

  const toggleSection = (section: 'houses' | 'rentals' | 'owned') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleHouseClick = (house: Housing) => {
    setSelectedHouse(selectedHouse?.name === house.name ? null : house);
  };

  const handleBuyHouse = (house: Housing): void => {
    const downPayment = calculateDownPayment(house);
    const stampDutyTax = calculateStampDutyForHouse(house);
    const totalUpfrontCost = downPayment + stampDutyTax;

    if (game.player.cash < totalUpfrontCost) {
      alert("You don't have enough cash for the down payment and stamp duty!");
      return;
    }

    const monthlyPayment = calculateMortgage(house);
    const newHouse: Housing = {
      ...house,
      type: 'OWNED',
      downPayment,
      monthlyPayment,
      purchaseYear: game.player.currentYear,
    };

    game.player.cash -= totalUpfrontCost;
    game.player.properties.push(newHouse);

    if (!game.player.housing) {
      game.player.housing = newHouse;
      game.player.monthlyHousingPayment = monthlyPayment;
      game.player.monthlyExpenses = {
        ...game.player.monthlyExpenses,
        rent: 0
      };
      game.player.updateTransportCosts();
    }

    game.addNotification(`Purchased ${house.name} for ${formatCurrency(house.price)} with ${downPaymentPercent}% down payment and ${formatCurrency(stampDutyTax)} stamp duty`);
    updateGame(game);
    onClose();
  };

  // Helper function to handle security deposit refund
  const handleSecurityDepositRefund = (oldProperty: Housing | null): void => {
    if (oldProperty?.type === 'RENT' && oldProperty.securityDeposit && oldProperty.rentalStartDate) {
      // Check if the contract has been active for at least a year
      const contractStartYear = oldProperty.rentalStartDate.year;
      const contractStartMonth = oldProperty.rentalStartDate.month;
      const currentYear = game.player.currentYear;
      const currentMonth = game.player.currentMonth;
      
      // Calculate total months since contract start
      const monthsSinceStart = (currentYear - contractStartYear) * 12 + (currentMonth - contractStartMonth);
      
      console.log('Contract duration (months):', monthsSinceStart);
      
      if (monthsSinceStart < 12) {
        // Contract ended early, no refund
        game.addNotification(`No security deposit refund as you're breaking the 1-year rental contract early.`);
        console.log('No refund - contract ended early');
        return;
      }
      
      // Contract completed, provide refund with wear and tear deduction
      const wearAndTearLoss = 0.1; // 10% loss for wear and tear
      const refundAmount = oldProperty.securityDeposit * (1 - wearAndTearLoss);
      
      console.log('Processing security deposit refund:');
      console.log('Original deposit:', oldProperty.securityDeposit);
      console.log('Refund amount:', refundAmount);
      
      game.player.cash += refundAmount;
      game.addNotification(`Received security deposit refund of ${formatCurrency(refundAmount)} (10% deducted for wear and tear)`);
    }
  };

  // Helper function to handle security deposit payment
  const handleSecurityDepositPayment = (property: Housing): number | null => {
    if (property.type === 'RENT') {
      const securityDeposit = property.monthlyPayment * 3;
      if (game.player.cash < securityDeposit) {
        game.addNotification(`You need ${formatCurrency(securityDeposit)} (3 months rent) as security deposit!`, 'negative');
        return 0;
      }
      
      game.player.cash -= securityDeposit;
      
      const updatedProperty = {
        ...property,
        securityDeposit: securityDeposit,
        rentalStartDate: {
          year: game.player.currentYear,
          month: game.player.currentMonth
        }
      };
      
      // Update the property in the housing market listings if it exists there
      const rentalIndex = game.housingMarket.rentals.findIndex(h => h.id === property.id);
      if (rentalIndex !== -1) {
        game.housingMarket.rentals[rentalIndex] = updatedProperty;
      }
      
      return securityDeposit;
    }
    
    return null;
  };

  const handleRentHouse = (newRentedHouse: Housing): void => {
    const depositPaid = handleSecurityDepositPayment(newRentedHouse);
    if (!depositPaid || depositPaid === 0) return; // If security deposit payment failed

    const oldPrimaryResidence = game.player.housing;
        // Refund security deposit from old rental property
    handleSecurityDepositRefund(oldPrimaryResidence);
    
    game.player.housing = newRentedHouse;
    game.player.monthlyHousingPayment = newRentedHouse.monthlyPayment;
    game.player.monthlyExpenses = {
      ...game.player.monthlyExpenses,
      rent: newRentedHouse.monthlyPayment
    };
    game.player.updateTransportCosts();

    game.addNotification(`Rented ${newRentedHouse.name} for ${formatCurrency(newRentedHouse.monthlyPayment)} per month, paid ${formatCurrency(depositPaid)} as security deposit.`);
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

  const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const convertSqMToSqFt = (sqm: number): number => {
    return Math.round(sqm * 10.764);
  };

  const handleRefresh = () => {
    setSelectedHouse(null);
    game.generateNewListings();
    updateGame(game);
  };

  const handleMoveIn = (ownedHouseToMoveIn: Housing) => {
    // Store the current primary residence if it exists
    const oldPrimaryResidence = game.player.housing;
    
    // Refund security deposit from old rental property
    handleSecurityDepositRefund(oldPrimaryResidence);
    
    // Pay security deposit for new rental property
    if (ownedHouseToMoveIn === oldPrimaryResidence) return; // If trying to move into the same house
    
    // Set the selected property as the new primary residence
    game.player.housing = ownedHouseToMoveIn;
    game.player.monthlyHousingPayment = 0;
    game.player.monthlyExpenses = {
      ...game.player.monthlyExpenses,
      rent: 0
    };
    game.player.updateTransportCosts();

    // If we had a previous primary residence that we owned, it becomes an investment property
    if (oldPrimaryResidence && oldPrimaryResidence.type === 'OWNED') {
      // Make sure it's in the properties array if it's not already
      if (!game.player.properties.includes(oldPrimaryResidence)) {
        game.player.properties.push(oldPrimaryResidence);
      }
    }

    game.addNotification(`Moved into ${ownedHouseToMoveIn.name}`, 'positive');
    updateGame(game);
  };

  const handleRentOut = (property: Housing) => {
    // Calculate rental income using the utility function
    const actualRent = calculateRent(
        property.location,
        game.player.currentYear,
        property.size,
        property.condition,
        true // Apply market discount
    );

    // Update the property
    property.isRental = true;
    property.rentalIncome = actualRent;

    game.addNotification(`Started renting out ${property.name} for ${formatCurrency(actualRent)} per month`);
    updateGame(game);
  };

  const handleStopRenting = (property: Housing) => {
    property.isRental = false;
    property.rentalIncome = 0;

    game.addNotification(`Stopped renting out ${property.name}`);
    updateGame(game);
  };

  const handleSaleConfirmation = (property: Housing, index: number) => {
    setSaleConfirmation({ property, index });
  };

  const handleSaleCancel = () => {
    setSaleConfirmation(null);
  };

  const calculateEarlyRepaymentCharge = (property: Housing): number => {
    if (!property.purchaseYear) return 0;
    
    // Calculate years into mortgage
    const yearsIntoMortgage = game.player.currentYear - property.purchaseYear;
    
    // If mortgage term is complete, no ERC
    if (yearsIntoMortgage >= (property.mortgageTermYears || 30)) return 0;
    
    // ERC starts at 5% and decreases by 1% each year
    const ercPercentage = Math.max(5 - yearsIntoMortgage, 0);
    
    // Calculate remaining mortgage
    const remainingMortgage = game.player.calculateRemainingMortgage(property);
    
    return remainingMortgage * (ercPercentage / 100);
  };

  const handleSellProperty = (property: Housing, index: number) => {
    console.log("Attempting to sell property:", property);
    
    // Don't allow selling the primary residence
    if (property === game.player.housing) {
      console.log("Cannot sell primary residence");
      game.addNotification("You cannot sell your primary residence!");
      return;
    }

    try {
      // Calculate remaining mortgage debt using the new function
      const remainingDebt = game.player.calculateRemainingMortgage(property);
      console.log("Remaining debt:", remainingDebt);

      // Calculate early repayment charge
      const earlyRepaymentCharge = calculateEarlyRepaymentCharge(property);
      console.log("Early repayment charge:", earlyRepaymentCharge);

      // Calculate current market value based on location and appreciation
      const basePrice = GAME_DATA.housePrice[property.location][game.player.currentYear] || 
                       GAME_DATA.housePrice[property.location][Number(Object.keys(GAME_DATA.housePrice[property.location]).slice(-1)[0])];
      
      // Calculate years passed since purchase for appreciation
      const yearsSincePurchase = property.purchaseYear 
        ? game.player.currentYear - property.purchaseYear 
        : 0; // If purchaseYear is undefined, assume it was purchased this year
      const appreciationMultiplier = Math.pow(1 + property.appreciationRate, yearsSincePurchase);
      
      // Calculate current value considering:
      // 1. Original price as base
      // 2. Property appreciation over time
      // 3. Market conditions (using current market price per sqm as a factor)
      // 4. Property condition
      const marketPriceRatio = property.purchaseYear
        ? basePrice / (GAME_DATA.housePrice[property.location][property.purchaseYear] || basePrice)
        : 1; // If purchaseYear is undefined, assume no market price change
      const conditionAdjustment = 1 + ((property.condition - 7) * 0.1); // ±10% per point difference from 7
      const rentalPremium = property.isRental ? 1.05 : 1; // Rental premium if applicable
      
      const currentValue = Math.round(
        property.price * // Original price
        appreciationMultiplier * // Basic appreciation
        marketPriceRatio * // Market conditions
        conditionAdjustment * // Condition adjustment
        rentalPremium // Rental premium if applicable
      );
      
      console.log("Appreciation years:", yearsSincePurchase);
      console.log("Appreciation multiplier:", appreciationMultiplier);
      console.log("Market price ratio:", marketPriceRatio);
      console.log("Current value:", currentValue);
      
      // Calculate net proceeds after paying off mortgage and ERC
      const netProceeds = currentValue - remainingDebt - earlyRepaymentCharge;
      console.log("Net proceeds:", netProceeds);

      // Check if the sale would leave enough money to pay off the mortgage and ERC
      if (netProceeds < 0) {
        console.log("Negative equity situation");
        game.addNotification(`Cannot sell property - sale price (${formatCurrency(currentValue)}) is less than remaining mortgage (${formatCurrency(remainingDebt)}) plus early repayment charge (${formatCurrency(earlyRepaymentCharge)})`);
        return;
      }

      // Calculate capital gain/loss (sale price minus purchase price)
      const capitalGain = currentValue - property.price;
      console.log("Capital gain:", capitalGain);
      
      // Add capital gain to tax tracking if positive
      if (capitalGain > 0) {
        game.player.capitalGains.currentTaxYear += capitalGain;
      }

      // Pay off the mortgage and add remaining proceeds to cash
      game.player.cash += netProceeds;
      console.log("Updated player cash:", game.player.cash);
      
      // Handle rental status
      if (property.isRental && property.rentalIncome) {
        const monthlyLoss = property.rentalIncome;
        game.addNotification(`Monthly rental income will decrease by ${formatCurrency(monthlyLoss)}`);
        game.addNotification(`Property sold with existing tenants - added 5% to sale value`);
      }
      
      // Remove from properties array
      const propertyIndex = game.player.properties.findIndex(p => p === property);
      if (propertyIndex !== -1) {
        game.player.properties.splice(propertyIndex, 1);
        console.log("Property removed from array");
      }
      
      game.addNotification(`Sold ${property.name} for ${formatCurrency(currentValue)}. Net proceeds after mortgage: ${formatCurrency(netProceeds)}`);
      if (capitalGain > 0) {
        game.addNotification(`Capital gain of ${formatCurrency(capitalGain)} will be subject to tax`);
      }
      
      // Update the game state
      updateGame(game);
      
      // Close the modal after successful sale
      onClose();
      
    } catch (error) {
      console.error("Error selling property:", error);
      game.addNotification("An error occurred while selling the property");
    }
  };

  const calculateEstimatedRent = (house: Housing): number => {
    return calculateRent(
        house.location,
        game.player.currentYear,
        house.size,
        house.condition
    );
  };

  const calculatePropertyValue = (property: Housing) => {
    const basePrice = GAME_DATA.housePrice[property.location][game.player.currentYear] || 
                     GAME_DATA.housePrice[property.location][Number(Object.keys(GAME_DATA.housePrice[property.location]).slice(-1)[0])];
    
    const marketPriceRatio = property.purchaseYear
      ? basePrice / (GAME_DATA.housePrice[property.location][property.purchaseYear] || basePrice)
      : 1;
    const conditionAdjustment = 1 + ((property.condition - 7) * 0.1);
    const rentalPremium = property.isRental ? 1.05 : 1;
    
    return Math.round(
      property.price * 
      marketPriceRatio * 
      conditionAdjustment * 
      rentalPremium
    );
  };

  const calculateRenovationCost = (property: Housing): number => {
    const baseValue = calculatePropertyValue(property);
    const conditionMultiplier = Math.pow(1.5, property.condition - 1);
    const sizeMultiplier = property.size / 50;
    return Math.round(baseValue * 0.04 * conditionMultiplier * sizeMultiplier);
  };

  const handleRenovateConfirmation = (property: Housing) => {
    if (property.isRental) {
      game.addNotification("Cannot renovate while property is being rented out. Stop renting first.");
      return;
    }

    if (property.condition >= 10) {
      game.addNotification("This property is already in perfect condition!");
      return;
    }

    const renovationCost = calculateRenovationCost(property);
    setRenovationConfirmation({ property, cost: renovationCost });
  };

  const handleRenovate = () => {
    if (!renovationConfirmation) return;

    const { property, cost } = renovationConfirmation;

    if (game.player.cash < cost) {
      game.addNotification(`Not enough cash for renovation. Cost: ${formatCurrency(cost)}`);
      setRenovationConfirmation(null);
      return;
    }

    // Apply renovation
    game.player.cash -= cost;
    property.condition += 1;
    
    // Add notifications
    game.addNotification(`Renovated ${property.name} from condition ${property.condition - 1} to ${property.condition}`);
    game.addNotification(`Renovation cost: ${formatCurrency(cost)}`);
    
    setRenovationConfirmation(null);
    updateGame(game);
  };

  const handleRenovateCancel = () => {
    setRenovationConfirmation(null);
  };

  return (
    <div className="housing-market">
      <div className="housing-options">
        <div className="housing-section">
          <div className="housing-section">
            <div 
              className={`section-header ${expandedSection === 'owned' ? 'expanded' : ''}`}
              onClick={() => toggleSection('owned')}
            >
              <h3>My Properties</h3>
              <span className="material-icons">
                {expandedSection === 'owned' ? 'expand_less' : 'expand_more'}
              </span>
            </div>
            {expandedSection === 'owned' && (
              <div className="houses-grid">
                {game.player.housing && (
                  <div className="house-card primary-residence">
                    <div className="house-summary">
                      <h4>{game.player.housing.name}</h4>
                      <p className="property-tag">Primary Residence</p>
                      <p>Type: {game.player.housing.type === 'OWNED' ? 'Owned' : 'Rented'}</p>
                      <p>{game.player.housing.type === 'OWNED' ? 'Value' : 'Monthly Rent'}: {formatCurrency(game.player.housing.type === 'OWNED' ? game.player.housing.price : game.player.housing.monthlyPayment)}</p>
                      <p>Size: {game.player.housing.size}m² ({convertSqMToSqFt(game.player.housing.size)} sq ft)</p>
                      <p>Location: {game.player.housing.location}</p>
                      <p>Condition: {game.player.housing.condition}/10</p>
                      {game.player.housing.type === 'OWNED' && (
                        <>
                          <p>Property Tax: {formatCurrency(game.player.housing.propertyTax || 0)}/year</p>
                          <p>Mortgage Payment: {formatCurrency(game.player.monthlyHousingPayment)}/month</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {game.player.properties.map((property, index) => (
                  property !== game.player.housing && (
                    <div key={index} className="house-card investment-property">
                      <div className="house-summary">
                        <h4>{property.name}</h4>
                        <p className="property-tag">Investment Property</p>
                        <p>Purchase Price: {formatCurrency(property.price)}</p>
                        <p className="estimated-value">Est. Current Value: {(() => {
                          // Get current market price for the location
                          const basePrice = GAME_DATA.housePrice[property.location][game.player.currentYear] || 
                                          GAME_DATA.housePrice[property.location][Number(Object.keys(GAME_DATA.housePrice[property.location]).slice(-1)[0])];
                          
                          return formatCurrency(
                            property.price * // Original price
                            (basePrice / (GAME_DATA.housePrice[property.location][property.purchaseYear] || basePrice)) * // Market conditions
                            (1 + ((property.condition - 7) * 0.1)) * // Condition adjustment
                            (property.isRental ? 1.05 : 1) // Rental premium if applicable
                          );
                        })()}</p>
                        <p>Size: {property.size}m² ({convertSqMToSqFt(property.size)} sq ft)</p>
                        <p>Location: {property.location}</p>
                        <p>Condition: {property.condition}/10</p>
                        <p>Property Tax: {formatCurrency(property.propertyTax || 0)}/year</p>
                        <p>Mortgage Payment: {formatCurrency(property.monthlyPayment)}/month</p>
                        {property.isRental ? (
                          <p className="rental-income">Rental Income: {formatCurrency(property.rentalIncome || 0)}/month</p>
                        ) : (
                          <p className="estimated-rent">Est. Rental Income: {formatCurrency(calculateEstimatedRent(property) * 0.95)}/month</p>
                        )}
                        <div className="property-actions">
                          <button 
                            className="hm-action-button move-in"
                            onClick={() => handleMoveIn(property)}
                          >
                            Move In
                          </button>
                          {!property.isRental ? (
                            <button 
                              className="hm-action-button rent-out"
                              onClick={() => handleRentOut(property)}
                            >
                              Rent Out
                            </button>
                          ) : (
                            <button 
                              className="hm-action-button stop-renting"
                              onClick={() => handleStopRenting(property)}
                            >
                              Stop Rent
                            </button>
                          )}
                          <button 
                            onClick={() => handleRenovateConfirmation(property)}
                            className="hm-action-button renovate"
                            disabled={property.condition >= 10 || property.isRental}
                            title={property.isRental ? "Stop renting out the property to renovate" : property.condition >= 10 ? "Property is in perfect condition" : "Renovate property"}
                          >
                            Renovate
                          </button>
                          <button 
                            className="hm-action-button sell"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaleConfirmation(property, index);
                            }}
                            disabled={property === game.player.housing}
                            title={property === game.player.housing ? "Cannot sell primary residence" : ""}
                          >
                            Sell
                          </button>
                        </div>
                        {!property.isRental && (
                          <div className="investment-details">
                            <h4>Rental Potential</h4>
                            <p>Estimated Monthly Rent: {formatCurrency(calculateEstimatedRent(property) * 0.95)}</p>
                            <p>Monthly Mortgage: {formatCurrency(property.monthlyPayment)}</p>
                            <p className="cash-flow">Est. Monthly Cash Flow: {formatCurrency(calculateEstimatedRent(property) * 0.95 - property.monthlyPayment)}</p>
                            <p>Est. Annual Return: {((calculateEstimatedRent(property) * 0.95 * 12 / property.downPayment) * 100).toFixed(1)}% (before expenses)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ))}
                {!game.player.housing && game.player.properties.length === 0 && (
                  <div className="no-properties-message">
                    <p>You don't own any properties yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="housing-section">
          <div 
            className={`section-header ${expandedSection === 'houses' ? 'expanded' : ''}`}
            onClick={() => toggleSection('houses')}
          >
            <div className="section-header-content">
              <h3>Houses for Sale</h3>
              {expandedSection === 'houses' && (
                <button className="refresh-button" onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}>
                  <span className="material-icons">refresh</span>
                  New Listings
                </button>
              )}
            </div>
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
                    <p className="estimated-rent">Est. Monthly Rent: {formatCurrency(calculateEstimatedRent(house))}</p>
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
                        <p>Stamp Duty: {formatCurrency(calculateStampDutyForHouse(house))} 
                          {game.player.properties.filter(p => p.type === 'OWNED').length > 0 && 
                            " (includes additional property surcharge)"}
                        </p>
                        <p>Current Interest Rate: {((house.mortgageRate ?? (getInterestRateForYearMonth(game.player.currentYear, game.player.currentMonth) / 100 + 0.02)) * 100).toFixed(2)}%</p>
                        <div className="down-payment-slider">
                          <label>Down Payment: {downPaymentPercent}%</label>
                          <input
                            type="range"
                            min={calculateRequiredDownPayment(house)}
                            max="100"
                            value={Math.max(downPaymentPercent, calculateRequiredDownPayment(house))}
                            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                          />
                          <p>Down Payment Amount: {formatCurrency(calculateDownPayment(house))}</p>
                          <p>Stamp Duty: {formatCurrency(calculateStampDutyForHouse(house))}</p>
                          <p>Total Upfront Cost: {formatCurrency(calculateDownPayment(house) + calculateStampDutyForHouse(house))}</p>
                          <p>Monthly Payment: {formatCurrency(calculateMortgage(house))}</p>
                          {!canAffordDownPayment(house) && (
                            <p className="error-message">Insufficient funds for down payment and stamp duty</p>
                          )}
                          {calculateRequiredDownPayment(house) > getMinimumDownPayment() && (
                            <p className="info-message">
                              Based on your annual income (£{formatNumber(game.player.calculateMonthlyIncome() * 12)}), 
                              you need at least {calculateRequiredDownPayment(house)}% down payment for this property.
                              This is because lenders cap loans at 4.5× annual income (£{formatNumber(calculateMaxMortgageLoanAmount())}).
                            </p>
                          )}
                        </div>
                        <div className="investment-details">
                          <h4>Investment Potential</h4>
                          <p>Estimated Monthly Rent: {formatCurrency(calculateEstimatedRent(house))}</p>
                          <p>Monthly Mortgage: {formatCurrency(calculateMortgage(house))}</p>
                          <p className="cash-flow">Monthly Cash Flow: {formatCurrency(calculateEstimatedRent(house) - calculateMortgage(house))}</p>
                          <p>Annual Return: {((calculateEstimatedRent(house) * 12 / calculateDownPayment(house)) * 100).toFixed(1)}% (before expenses)</p>
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
            <div className="section-header-content">
              <h3>Houses for Rent</h3>
              {expandedSection === 'rentals' && (
                <button className="refresh-button" onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}>
                  <span className="material-icons">refresh</span>
                  New Listings
                </button>
              )}
            </div>
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

      {/* Add Sale Confirmation Modal */}
      {saleConfirmation && (
        <div className="modal-overlay">
          <div className="sale-confirmation-modal">
            <h3>Confirm Property Sale</h3>
            <div className="sale-details">
              <h4>{saleConfirmation.property.name}</h4>
              
              <div className="financial-breakdown">
                <div className="breakdown-item">
                  <span>Original Purchase Price:</span>
                  <span>{formatCurrency(saleConfirmation.property.price)}</span>
                </div>
                
                <div className="breakdown-item">
                  <span>Current Market Value:</span>
                  <span>{formatCurrency(calculatePropertyValue(saleConfirmation.property))}</span>
                </div>
                
                <div className="breakdown-item">
                  <span>Remaining Mortgage:</span>
                  <span className="negative">
                    {formatCurrency(game.player.calculateRemainingMortgage(saleConfirmation.property))}
                  </span>
                </div>

                {calculateEarlyRepaymentCharge(saleConfirmation.property) > 0 && (
                  <div className="breakdown-item">
                    <span>Early Repayment Charge:</span>
                    <span className="negative">
                      {formatCurrency(calculateEarlyRepaymentCharge(saleConfirmation.property))}
                    </span>
                  </div>
                )}
                
                {saleConfirmation.property.isRental && (
                  <div className="breakdown-item rental-note">
                    <span>Monthly Rental Income Loss:</span>
                    <span className="negative">-{formatCurrency(saleConfirmation.property.rentalIncome || 0)}</span>
                  </div>
                )}
                
                <div className="breakdown-item capital-gains">
                  <span>Capital Gain/Loss:</span>
                  <span className={calculatePropertyValue(saleConfirmation.property) - saleConfirmation.property.price > 0 ? 'positive' : 'negative'}>
                    {formatCurrency(calculatePropertyValue(saleConfirmation.property) - saleConfirmation.property.price)}
                  </span>
                </div>
                
                {calculatePropertyValue(saleConfirmation.property) - saleConfirmation.property.price > 0 && (
                  <div className="breakdown-item tax-note">
                    <span>Estimated Capital Gains Tax:</span>
                    <span className="negative">
                      {formatCurrency((calculatePropertyValue(saleConfirmation.property) - saleConfirmation.property.price) * 0.20)}
                    </span>
                    <p className="tax-explanation">*20% on profit, payable in next tax year</p>
                  </div>
                )}
                
                <div className="breakdown-item net-proceeds">
                  <span>Net Proceeds:</span>
                  <span className="highlight">
                    {formatCurrency(
                      calculatePropertyValue(saleConfirmation.property) - 
                      game.player.calculateRemainingMortgage(saleConfirmation.property) -
                      calculateEarlyRepaymentCharge(saleConfirmation.property) -
                      // Deduct capital gains tax if there's a profit
                      (calculatePropertyValue(saleConfirmation.property) - saleConfirmation.property.price > 0 
                        ? (calculatePropertyValue(saleConfirmation.property) - saleConfirmation.property.price) * 0.20 
                        : 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="confirmation-buttons">
                <button 
                  className="confirm-sale"
                  onClick={() => {
                    handleSellProperty(saleConfirmation.property, saleConfirmation.index);
                    setSaleConfirmation(null);
                  }}
                >
                  Confirm Sale
                </button>
                <button 
                  className="cancel-sale"
                  onClick={handleSaleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renovation Confirmation Modal */}
      {renovationConfirmation && (
        <div className="modal-overlay">
          <div className="sale-confirmation-modal">
            <h3>Confirm Renovation</h3>
            <div className="sale-details">
              <h4>{renovationConfirmation.property.name}</h4>
              
              <div className="financial-breakdown">
                <div className="breakdown-item">
                  <span>Current Condition:</span>
                  <span>{renovationConfirmation.property.condition}/10</span>
                </div>
                
                <div className="breakdown-item">
                  <span>New Condition:</span>
                  <span className="positive">{renovationConfirmation.property.condition + 1}/10</span>
                </div>
                
                <div className="breakdown-item">
                  <span>Renovation Cost:</span>
                  <span className="negative">
                    {formatCurrency(renovationConfirmation.cost)}
                  </span>
                </div>

                <div className="breakdown-item">
                  <span>Your Cash:</span>
                  <span>{formatCurrency(game.player.cash)}</span>
                </div>
                
                <div className="breakdown-item">
                  <span>Current Value:</span>
                  <span>{formatCurrency(calculatePropertyValue(renovationConfirmation.property))}</span>
                </div>
                
                <div className="breakdown-item">
                  <span>Value After Renovation:</span>
                  <span className="positive">{formatCurrency(calculatePropertyValue({
                    ...renovationConfirmation.property,
                    condition: renovationConfirmation.property.condition + 1
                  }))}</span>
                </div>
                
                <div className="breakdown-item">
                  <span>Value Increase:</span>
                  <span className="highlight">{formatCurrency(
                    calculatePropertyValue({
                      ...renovationConfirmation.property,
                      condition: renovationConfirmation.property.condition + 1
                    }) - calculatePropertyValue(renovationConfirmation.property)
                  )}</span>
                </div>

                {/* Add rental income section */}
                <div className="breakdown-item rental-note">
                  <span>Current Monthly Rent:</span>
                  <span>
                    {renovationConfirmation.property.isRental 
                      ? formatCurrency(renovationConfirmation.property.rentalIncome || 0)
                      : formatCurrency(calculateEstimatedRent(renovationConfirmation.property) * 0.95)}
                  </span>
                </div>

                <div className="breakdown-item rental-note">
                  <span>Rent After Renovation:</span>
                  <span className="positive">
                    {formatCurrency(calculateEstimatedRent({
                      ...renovationConfirmation.property,
                      condition: renovationConfirmation.property.condition + 1
                    }) * 0.95)}
                  </span>
                </div>

                <div className="breakdown-item rental-note">
                  <span>Monthly Rent Increase:</span>
                  <span className="highlight">
                    {formatCurrency(
                      calculateEstimatedRent({
                        ...renovationConfirmation.property,
                        condition: renovationConfirmation.property.condition + 1
                      }) * 0.95 - 
                      (renovationConfirmation.property.isRental 
                        ? (renovationConfirmation.property.rentalIncome || 0)
                        : calculateEstimatedRent(renovationConfirmation.property) * 0.95)
                    )}
                  </span>
                </div>

                {/* Add annual return on investment */}
                <div className="breakdown-item rental-note">
                  <span>Return on Investment:</span>
                  <span className="highlight">
                    {(((calculateEstimatedRent({
                      ...renovationConfirmation.property,
                      condition: renovationConfirmation.property.condition + 1
                    }) * 0.95 - 
                    (renovationConfirmation.property.isRental 
                      ? (renovationConfirmation.property.rentalIncome || 0)
                      : calculateEstimatedRent(renovationConfirmation.property) * 0.95)) * 12 / 
                    renovationConfirmation.cost) * 100).toFixed(1)}% per year
                  </span>
                </div>

                {game.player.cash < renovationConfirmation.cost && (
                  <div className="breakdown-item error-message">
                    <span>Warning:</span>
                    <span>Not enough cash for renovation!</span>
                  </div>
                )}
              </div>

              <div className="confirmation-buttons">
                <button 
                  className="confirm-sale"
                  onClick={handleRenovate}
                  disabled={game.player.cash < renovationConfirmation.cost}
                >
                  Confirm Renovation
                </button>
                <button 
                  className="cancel-sale"
                  onClick={handleRenovateCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 