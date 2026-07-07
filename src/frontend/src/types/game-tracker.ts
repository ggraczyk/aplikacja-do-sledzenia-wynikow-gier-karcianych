/**
 * Local domain types for the game-tracker backend.
 *
 * The generated actor bindings in @/backend are stale (missing the
 * updateCanastaRound / updateBridgeDeal methods), so we mirror the Candid
 * shapes here and expose a structural `GameTrackerActor` interface that
 * callers can cast the actor through when invoking the update methods.
 */

export type GameType = "canasta" | "bridge";

export interface CanastaRound {
  roundNumber: bigint;
  nsScore: bigint;
  weScore: bigint;
  timestamp: bigint;
}

export interface BridgeDeal {
  dealNumber: bigint;
  contract: string;
  declarer: string;
  tricksTaken: bigint;
  pcValue: bigint;
  expectedScore: bigint;
  actualScore: bigint;
  impScore: bigint;
  timestamp: bigint;
}

export interface CanastaRoundUpdate {
  nsScore: bigint;
  weScore: bigint;
}

export interface BridgeDealUpdate {
  contract: string;
  declarer: string;
  tricksTaken: bigint;
  pcValue: bigint;
  expectedScore: bigint;
  actualScore: bigint;
  impScore: bigint;
}

/**
 * Structural view of the actor that includes the update methods which are
 * not yet present in the generated @/backend bindings. Cast the actor
 * through this interface when calling updateCanastaRound / updateBridgeDeal.
 */
export interface GameTrackerActor {
  updateCanastaRound(
    gameCode: string,
    roundIndex: bigint,
    nsScore: bigint,
    weScore: bigint,
  ): Promise<CanastaRound | null>;

  updateBridgeDeal(
    gameCode: string,
    dealIndex: bigint,
    contract: string,
    declarer: string,
    tricksTaken: bigint,
    pcValue: bigint,
    expectedScore: bigint,
    actualScore: bigint,
    impScore: bigint,
  ): Promise<BridgeDeal | null>;
}
