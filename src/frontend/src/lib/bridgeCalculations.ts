// Bridge score and IMP calculation tables and logic

export interface BridgeScoreEntry {
  pcValue: number;
  expectedBefore: number;
  expectedAfter: number;
}

export interface ImpEntry {
  minDiff: number;
  maxDiff: number;
  impValue: number;
}

// Bridge score table for PC values 0-40 - Updated with exact values as specified
// This table contains the definitive expected scores for all PC values from 0 to 40
// expectedBefore: expected score when declarer is "przed partią" (before game)
// expectedAfter: expected score when declarer is "po partii" (after game)
// The application uses ONLY these values without any modifications or additional calculations
export const bridgeScoreTable: BridgeScoreEntry[] = [
  { pcValue: 0, expectedBefore: -1400, expectedAfter: -2100 },
  { pcValue: 1, expectedBefore: -1400, expectedAfter: -2100 },
  { pcValue: 2, expectedBefore: -1400, expectedAfter: -2100 },
  { pcValue: 3, expectedBefore: -1400, expectedAfter: -2100 },
  { pcValue: 4, expectedBefore: -1200, expectedAfter: -1800 },
  { pcValue: 5, expectedBefore: -1100, expectedAfter: -1650 },
  { pcValue: 6, expectedBefore: -1000, expectedAfter: -1500 },
  { pcValue: 7, expectedBefore: -900, expectedAfter: -1350 },
  { pcValue: 8, expectedBefore: -700, expectedAfter: -1050 },
  { pcValue: 9, expectedBefore: -600, expectedAfter: -800 },
  { pcValue: 10, expectedBefore: -490, expectedAfter: -690 },
  { pcValue: 11, expectedBefore: -460, expectedAfter: -660 },
  { pcValue: 12, expectedBefore: -430, expectedAfter: -630 },
  { pcValue: 13, expectedBefore: -400, expectedAfter: -600 },
  { pcValue: 14, expectedBefore: -350, expectedAfter: -520 },
  { pcValue: 15, expectedBefore: -300, expectedAfter: -440 },
  { pcValue: 16, expectedBefore: -200, expectedAfter: -290 },
  { pcValue: 17, expectedBefore: -110, expectedAfter: -110 },
  { pcValue: 18, expectedBefore: -70, expectedAfter: -70 },
  { pcValue: 19, expectedBefore: -50, expectedAfter: -50 },
  { pcValue: 20, expectedBefore: 0, expectedAfter: 0 },
  { pcValue: 21, expectedBefore: 50, expectedAfter: 50 },
  { pcValue: 22, expectedBefore: 70, expectedAfter: 70 },
  { pcValue: 23, expectedBefore: 110, expectedAfter: 110 },
  { pcValue: 24, expectedBefore: 200, expectedAfter: 290 },
  { pcValue: 25, expectedBefore: 300, expectedAfter: 440 },
  { pcValue: 26, expectedBefore: 350, expectedAfter: 520 },
  { pcValue: 27, expectedBefore: 400, expectedAfter: 600 },
  { pcValue: 28, expectedBefore: 430, expectedAfter: 630 },
  { pcValue: 29, expectedBefore: 460, expectedAfter: 660 },
  { pcValue: 30, expectedBefore: 490, expectedAfter: 690 },
  { pcValue: 31, expectedBefore: 600, expectedAfter: 800 },
  { pcValue: 32, expectedBefore: 700, expectedAfter: 1050 },
  { pcValue: 33, expectedBefore: 900, expectedAfter: 1350 },
  { pcValue: 34, expectedBefore: 1000, expectedAfter: 1500 },
  { pcValue: 35, expectedBefore: 1100, expectedAfter: 1650 },
  { pcValue: 36, expectedBefore: 1200, expectedAfter: 1800 },
  { pcValue: 37, expectedBefore: 1400, expectedAfter: 2100 },
  { pcValue: 38, expectedBefore: 1400, expectedAfter: 2100 },
  { pcValue: 39, expectedBefore: 1400, expectedAfter: 2100 },
  { pcValue: 40, expectedBefore: 1400, expectedAfter: 2100 },
];

// IMP conversion table - exact values as per specification
export const impTable: ImpEntry[] = [
  { minDiff: 0, maxDiff: 10, impValue: 0 },
  { minDiff: 20, maxDiff: 40, impValue: 1 },
  { minDiff: 50, maxDiff: 80, impValue: 2 },
  { minDiff: 90, maxDiff: 120, impValue: 3 },
  { minDiff: 130, maxDiff: 160, impValue: 4 },
  { minDiff: 170, maxDiff: 210, impValue: 5 },
  { minDiff: 220, maxDiff: 260, impValue: 6 },
  { minDiff: 270, maxDiff: 310, impValue: 7 },
  { minDiff: 320, maxDiff: 360, impValue: 8 },
  { minDiff: 370, maxDiff: 420, impValue: 9 },
  { minDiff: 430, maxDiff: 490, impValue: 10 },
  { minDiff: 500, maxDiff: 590, impValue: 11 },
  { minDiff: 600, maxDiff: 740, impValue: 12 },
  { minDiff: 750, maxDiff: 890, impValue: 13 },
  { minDiff: 900, maxDiff: 1090, impValue: 14 },
  { minDiff: 1100, maxDiff: 1290, impValue: 15 },
  { minDiff: 1300, maxDiff: 1490, impValue: 16 },
  { minDiff: 1500, maxDiff: 1740, impValue: 17 },
  { minDiff: 1750, maxDiff: 1990, impValue: 18 },
  { minDiff: 2000, maxDiff: 2240, impValue: 19 },
  { minDiff: 2250, maxDiff: 2490, impValue: 20 },
  { minDiff: 2500, maxDiff: 2990, impValue: 21 },
  { minDiff: 3000, maxDiff: 3490, impValue: 22 },
  { minDiff: 3500, maxDiff: 3990, impValue: 23 },
];

/**
 * Get expected score from the bridgeScoreTable for a given PC value and game state.
 * This function performs DIRECT LOOKUP ONLY - no modifications, calculations, or processing.
 * The values returned are exactly as stored in the bridgeScoreTable without any changes.
 *
 * @param pcValue - PC (punkty kontrolne) value from 0 to 40 inclusive
 * @param isPoPartii - true if "po partii" (after game), false if "przed partią" (before game)
 * @returns Expected score from table or null if PC value is out of range
 */
export function getBridgeExpectedScore(
  pcValue: number,
  isPoPartii: boolean,
): number | null {
  // Ensure PC value is within valid range (0-40 inclusive)
  if (pcValue < 0 || pcValue > 40) {
    console.warn(`PC value ${pcValue} is outside supported range (0-40)`);
    return null;
  }

  // Direct lookup in the bridgeScoreTable - NO processing, NO modification of values
  // The table contains exact values as specified by the user
  const entry = bridgeScoreTable.find((e) => e.pcValue === pcValue);

  if (!entry) {
    // This should never happen for values 0-40, but adding safety check
    console.error(
      `No entry found in bridgeScoreTable for PC value: ${pcValue}`,
    );
    return null;
  }

  // Return EXACT value from table based on game state - NO calculations, NO modifications
  // The application uses ONLY these values from the bridgeScoreTable
  return isPoPartii ? entry.expectedAfter : entry.expectedBefore;
}

/**
 * Calculate IMP from difference using the impTable.
 *
 * @param difference - Absolute difference in points
 * @returns IMP value according to the conversion table
 */
export function calculateImp(difference: number): number {
  const absDifference = Math.abs(difference);

  // Handle edge case for 0 difference
  if (absDifference === 0) {
    return 0;
  }

  // Find appropriate IMP value from the table
  for (const entry of impTable) {
    if (absDifference >= entry.minDiff && absDifference <= entry.maxDiff) {
      return entry.impValue;
    }
  }

  // For differences above the highest range, return the highest IMP value
  return impTable[impTable.length - 1].impValue;
}

/**
 * Calculate bridge score based on contract details according to Chicago scoring rules.
 *
 * @param contract - Contract details including level, suit, double, tricks taken, etc.
 * @returns Calculated score in points
 */
export function calculateBridgeScore(contract: {
  level: number;
  suit: string;
  double: "none" | "double" | "redouble";
  tricksTaken: number;
  declarer: "NS" | "WE";
  nsGameState: boolean;
  weGameState: boolean;
}): number {
  const {
    level,
    suit,
    double,
    tricksTaken,
    declarer,
    nsGameState,
    weGameState,
  } = contract;

  // Determine if declarer is vulnerable (po partii)
  const isVulnerable = declarer === "NS" ? nsGameState : weGameState;

  // Calculate required tricks (6 + level)
  const requiredTricks = 6 + level;
  const overtricks = tricksTaken - requiredTricks;

  // Base points for different suits
  const suitPoints: { [key: string]: number } = {
    C: 20, // Clubs
    D: 20, // Diamonds
    H: 30, // Hearts
    S: 30, // Spades
    NT: 30, // No Trump
  };

  let score = 0;

  if (overtricks >= 0) {
    // Contract made

    // Basic contract points
    let basicPoints = level * suitPoints[suit];
    if (suit === "NT") {
      basicPoints += 10; // NT bonus for first trick
    }

    // Apply double/redouble multiplier to basic points
    let contractPoints = basicPoints;
    if (double === "double") {
      contractPoints *= 2;
    } else if (double === "redouble") {
      contractPoints *= 4;
    }

    score += contractPoints;

    // Game bonus
    if (contractPoints >= 100) {
      score += isVulnerable ? 500 : 300; // Game bonus
    } else {
      score += 50; // Part game bonus
    }

    // Overtrick points
    if (overtricks > 0) {
      let overtrickPoints = 0;
      if (double === "none") {
        // Normal overtricks
        if (suit === "C" || suit === "D") {
          overtrickPoints = overtricks * 20;
        } else {
          overtrickPoints = overtricks * 30;
        }
      } else {
        // Doubled/redoubled overtricks
        const baseOvertrick = isVulnerable ? 200 : 100;
        overtrickPoints = overtricks * baseOvertrick;
        if (double === "redouble") {
          overtrickPoints *= 2;
        }
      }
      score += overtrickPoints;
    }

    // Double/redouble bonus
    if (double === "double") {
      score += 50;
    } else if (double === "redouble") {
      score += 100;
    }

    // Slam bonuses
    if (level === 6) {
      // Small slam
      score += isVulnerable ? 750 : 500;
    } else if (level === 7) {
      // Grand slam
      score += isVulnerable ? 1500 : 1000;
    }
  } else {
    // Contract failed
    const undertricks = Math.abs(overtricks);

    if (double === "none") {
      // Normal penalties
      score = -(undertricks * (isVulnerable ? 100 : 50));
    } else {
      // Doubled/redoubled penalties
      let penalty = 0;

      for (let i = 1; i <= undertricks; i++) {
        if (i === 1) {
          penalty += isVulnerable ? 200 : 100;
        } else if (i <= 3) {
          penalty += isVulnerable ? 300 : 200;
        } else {
          penalty += 300;
        }
      }

      if (double === "redouble") {
        penalty *= 2;
      }

      score = -penalty;
    }
  }

  return score;
}
