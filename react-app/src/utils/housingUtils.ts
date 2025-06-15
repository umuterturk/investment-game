import { GAME_DATA } from '../data/gameData';

export const calculateRent = (
    location: string,
    currentYear: number,
    size: number,
    condition: number,
    applyMarketDiscount: boolean = false
): number => {
    // Get base rent for the location
    const baseRent = GAME_DATA.rentPrice[location][currentYear];
    
    // Apply size multiplier (baseRent is for 50m²)
    const sizeMultiplier = size / 50;
    
    // Apply condition adjustment (±10% per point difference from 7)
    const conditionAdjustment = 1 + ((condition - 7) * 0.1);
    
    // Calculate market rent
    const marketRent = Math.round(baseRent * sizeMultiplier * conditionAdjustment);
    
    // Apply a 5% discount if requested (for actual rental properties)
    return applyMarketDiscount ? Math.round(marketRent * 0.95) : marketRent;
}; 