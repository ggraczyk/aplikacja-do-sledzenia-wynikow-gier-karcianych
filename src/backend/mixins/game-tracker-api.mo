import OrderedMap "mo:base/OrderedMap";
import Types "../types/game-tracker";
import GameTrackerLib "../lib/game-tracker";

/// Publiczny API domeny game-tracker.
/// Stan wstrzykiwany przez parametry mixinu: bieżące mapy rund Canasta i dealów Bridge
/// oraz funkcje setter przypisujące zaktualizowane mapy z powrotem do pól aktora.
mixin (
  canastaRounds : OrderedMap.Map<Text, [Types.CanastaRound]>,
  setCanastaRounds : OrderedMap.Map<Text, [Types.CanastaRound]> -> (),
  bridgeDeals : OrderedMap.Map<Text, [Types.BridgeDeal]>,
  setBridgeDeals : OrderedMap.Map<Text, [Types.BridgeDeal]> -> (),
) {
  /// Aktualizuje rundę Canasta po indeksie, nadpisując pola wartości (nsScore, weScore).
  /// Zwraca zaktualizowany wpis lub null, jeśli indeks nie istnieje.
  public func updateCanastaRound(
    gameCode : Text,
    roundIndex : Nat,
    nsScore : Int,
    weScore : Int,
  ) : async ?Types.CanastaRound {
    let update : Types.CanastaRoundUpdate = {
      nsScore;
      weScore;
    };
    let (newMap, result) = GameTrackerLib.updateCanastaRound(
      canastaRounds,
      gameCode,
      roundIndex,
      update,
    );
    setCanastaRounds(newMap);
    result;
  };

  /// Aktualizuje deala Bridge po indeksie, nadpisując wszystkie pola dealu
  /// (contract, declarer, tricksTaken, pcValue, expectedScore, actualScore, impScore).
  /// Zwraca zaktualizowany wpis lub null, jeśli indeks nie istnieje.
  public func updateBridgeDeal(
    gameCode : Text,
    dealIndex : Nat,
    contract : Text,
    declarer : Text,
    tricksTaken : Nat,
    pcValue : Int,
    expectedScore : Int,
    actualScore : Int,
    impScore : Int,
  ) : async ?Types.BridgeDeal {
    let update : Types.BridgeDealUpdate = {
      contract;
      declarer;
      tricksTaken;
      pcValue;
      expectedScore;
      actualScore;
      impScore;
    };
    let (newMap, result) = GameTrackerLib.updateBridgeDeal(
      bridgeDeals,
      gameCode,
      dealIndex,
      update,
    );
    setBridgeDeals(newMap);
    result;
  };
};
