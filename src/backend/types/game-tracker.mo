module {
  /// Typ gry obsługiwany przez tracker.
  public type GameType = {
    #canasta;
    #bridge;
  };

  /// Dane gry zapisane pod kodem gry.
  public type GameData = {
    gameType : GameType;
    createdAt : Int;
    finalScore : ?Int;
  };

  /// Wpis rundy Canasta. nsScore/weScore to punkty par NS/WE.
  public type CanastaRound = {
    roundNumber : Nat;
    nsScore : Int;
    weScore : Int;
    timestamp : Int;
  };

  /// Wpis deala Bridge. Aktualizacja nadpisuje wszystkie pola poza identyfikatorem.
  public type BridgeDeal = {
    dealNumber : Nat;
    contract : Text;
    declarer : Text;
    tricksTaken : Nat;
    pcValue : Int;
    expectedScore : Int;
    actualScore : Int;
    impScore : Int;
    timestamp : Int;
  };

  /// Argument aktualizacji rundy Canasta po indeksie.
  /// Nadpisuje tylko pola wartości (nsScore, weScore).
  public type CanastaRoundUpdate = {
    nsScore : Int;
    weScore : Int;
  };

  /// Argument aktualizacji deala Bridge po indeksie.
  /// Nadpisuje wszystkie pola dealu (poza dealNumber, który jest identyfikatorem).
  public type BridgeDealUpdate = {
    contract : Text;
    declarer : Text;
    tricksTaken : Nat;
    pcValue : Int;
    expectedScore : Int;
    actualScore : Int;
    impScore : Int;
  };
};
