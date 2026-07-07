import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import GameTrackerTypes "types/game-tracker";
import GameTrackerApi "mixins/game-tracker-api";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinViews "mo:caffeineai-data-viewer/MixinViews";

actor GameTracker {
  transient let textMap = OrderedMap.Make(Text.compare);
  let accessControlState = AccessControl.initState();

  var gameCodes = textMap.empty<Bool>();
  var games = textMap.empty<GameData>();
  var canastaRounds = textMap.empty<[CanastaRound]>();
  var bridgeDeals = textMap.empty<[BridgeDeal]>();
  var canastaDealers = textMap.empty<Nat>();

  type GameType = {
    #canasta;
    #bridge;
  };

  type GameData = {
    gameType : GameType;
    createdAt : Time.Time;
    finalScore : ?Int;
  };

  type CanastaRound = {
    roundNumber : Nat;
    nsScore : Int;
    weScore : Int;
    timestamp : Time.Time;
  };

  type BridgeDeal = {
    dealNumber : Nat;
    contract : Text;
    declarer : Text;
    tricksTaken : Nat;
    pcValue : Int;
    expectedScore : Int;
    actualScore : Int;
    impScore : Int;
    timestamp : Time.Time;
  };

  // Podłączenie domeny game-tracker: metody updateCanastaRound / updateBridgeDeal
  // wstrzykują bieżące mapy oraz funkcje setter przypisujące zaktualizowane mapy
  // z powrotem do pól aktora (var canastaRounds / var bridgeDeals).
  include GameTrackerApi(
    canastaRounds,
    func(m : OrderedMap.Map<Text, [GameTrackerTypes.CanastaRound]>) { canastaRounds := m },
    bridgeDeals,
    func(m : OrderedMap.Map<Text, [GameTrackerTypes.BridgeDeal]>) { bridgeDeals := m },
  );
  include MixinViews();
  include MixinAuthorization(accessControlState, null);

  public func generateGameCode(userInput : Text) : async Text {
    let randomNumber = Nat.toText(Int.abs(Time.now()) % 10000);
    let code = userInput # "_" # randomNumber;

    if (Text.size(code) > 12) {
      Debug.trap("Kod przekracza 12 znaków");
    };

    if (textMap.contains(gameCodes, code)) {
      Debug.trap("Kod już istnieje");
    };

    gameCodes := textMap.put(gameCodes, code, true);
    code;
  };

  public func createGame(code : Text, gameType : GameType) : async () {
    if (textMap.contains(games, code)) {
      Debug.trap("Gra z tym kodem już istnieje");
    };

    let gameData : GameData = {
      gameType;
      createdAt = Time.now();
      finalScore = null;
    };

    games := textMap.put(games, code, gameData);

    if (gameType == #canasta) {
      canastaDealers := textMap.put(canastaDealers, code, 0);
    };
  };

  public func getGame(code : Text) : async ?GameData {
    textMap.get(games, code);
  };

  public func finishGame(code : Text, finalScore : Int) : async () {
    switch (textMap.get(games, code)) {
      case (null) { Debug.trap("Gra nie znaleziona") };
      case (?gameData) {
        let updatedGameData : GameData = {
          gameType = gameData.gameType;
          createdAt = gameData.createdAt;
          finalScore = ?finalScore;
        };
        games := textMap.put(games, code, updatedGameData);
      };
    };
  };

  public func getAllGames() : async [(Text, GameData)] {
    Iter.toArray(textMap.entries(games));
  };

  public func saveCanastaRound(gameCode : Text, round : CanastaRound) : async () {
    let existingRounds = switch (textMap.get(canastaRounds, gameCode)) {
      case (null) { [] };
      case (?rounds) { rounds };
    };

    let updatedRounds = Array.append(existingRounds, [round]);
    canastaRounds := textMap.put(canastaRounds, gameCode, updatedRounds);

    switch (textMap.get(canastaDealers, gameCode)) {
      case (null) {
        canastaDealers := textMap.put(canastaDealers, gameCode, 1);
      };
      case (?currentDealer) {
        let nextDealer = (currentDealer + 1) % 4;
        canastaDealers := textMap.put(canastaDealers, gameCode, nextDealer);
      };
    };
  };

  public func getCanastaRounds(gameCode : Text) : async [CanastaRound] {
    switch (textMap.get(canastaRounds, gameCode)) {
      case (null) { [] };
      case (?rounds) { rounds };
    };
  };

  public func getNextDealer(gameCode : Text) : async Nat {
    switch (textMap.get(canastaDealers, gameCode)) {
      case (null) { 0 };
      case (?dealer) { dealer };
    };
  };

  public func saveBridgeDeal(gameCode : Text, deal : BridgeDeal) : async () {
    let existingDeals = switch (textMap.get(bridgeDeals, gameCode)) {
      case (null) { [] };
      case (?deals) { deals };
    };

    let updatedDeals = Array.append(existingDeals, [deal]);
    bridgeDeals := textMap.put(bridgeDeals, gameCode, updatedDeals);
  };

  public func getBridgeDeals(gameCode : Text) : async [BridgeDeal] {
    switch (textMap.get(bridgeDeals, gameCode)) {
      case (null) { [] };
      case (?deals) { deals };
    };
  };
};

