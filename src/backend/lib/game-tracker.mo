import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Types "../types/game-tracker";

module {
  /// Aktualizuje rundę Canasta po indeksie, nadpisując pola wartości (nsScore, weScore).
  /// Zwraca (nową mapę, zaktualizowany wpis lub null).
  public func updateCanastaRound(
    rounds : OrderedMap.Map<Text, [Types.CanastaRound]>,
    gameCode : Text,
    roundIndex : Nat,
    update : Types.CanastaRoundUpdate,
  ) : (OrderedMap.Map<Text, [Types.CanastaRound]>, ?Types.CanastaRound) {
    let textOps = OrderedMap.Make(Text.compare);
    switch (textOps.get(rounds, gameCode)) {
      case null { (rounds, null) };
      case (?roundList) {
        if (roundIndex >= roundList.size()) {
          (rounds, null);
        } else {
          let updatedList = Array.mapEntries(
            roundList,
            func(round, i) {
              if (i == roundIndex) {
                {
                  round with
                  nsScore = update.nsScore;
                  weScore = update.weScore;
                  timestamp = Time.now();
                };
              } else {
                round;
              };
            },
          );
          let newMap = textOps.put(rounds, gameCode, updatedList);
          (newMap, ?updatedList[roundIndex]);
        };
      };
    };
  };

  /// Aktualizuje deala Bridge po indeksie, nadpisując wszystkie pola dealu
  /// (poza dealNumber, który jest identyfikatorem).
  /// Zwraca (nową mapę, zaktualizowany wpis lub null).
  public func updateBridgeDeal(
    deals : OrderedMap.Map<Text, [Types.BridgeDeal]>,
    gameCode : Text,
    dealIndex : Nat,
    update : Types.BridgeDealUpdate,
  ) : (OrderedMap.Map<Text, [Types.BridgeDeal]>, ?Types.BridgeDeal) {
    let textOps = OrderedMap.Make(Text.compare);
    switch (textOps.get(deals, gameCode)) {
      case null { (deals, null) };
      case (?dealList) {
        if (dealIndex >= dealList.size()) {
          (deals, null);
        } else {
          let updatedList = Array.mapEntries(
            dealList,
            func(deal, i) {
              if (i == dealIndex) {
                {
                  deal with
                  contract = update.contract;
                  declarer = update.declarer;
                  tricksTaken = update.tricksTaken;
                  pcValue = update.pcValue;
                  expectedScore = update.expectedScore;
                  actualScore = update.actualScore;
                  impScore = update.impScore;
                  timestamp = Time.now();
                };
              } else {
                deal;
              };
            },
          );
          let newMap = textOps.put(deals, gameCode, updatedList);
          (newMap, ?updatedList[dealIndex]);
        };
      };
    };
  };
};
