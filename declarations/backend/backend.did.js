export const idlFactory = ({ IDL }) => {
  const GameType = IDL.Variant({ 'bridge' : IDL.Null, 'canasta' : IDL.Null });
  const Time = IDL.Int;
  const GameData = IDL.Record({
    'createdAt' : Time,
    'finalScore' : IDL.Opt(IDL.Int),
    'gameType' : GameType,
  });
  const BridgeDeal = IDL.Record({
    'contract' : IDL.Text,
    'dealNumber' : IDL.Nat,
    'expectedScore' : IDL.Int,
    'pcValue' : IDL.Int,
    'tricksTaken' : IDL.Nat,
    'timestamp' : Time,
    'declarer' : IDL.Text,
    'actualScore' : IDL.Int,
    'impScore' : IDL.Int,
  });
  const CanastaRound = IDL.Record({
    'timestamp' : Time,
    'weScore' : IDL.Int,
    'roundNumber' : IDL.Nat,
    'nsScore' : IDL.Int,
  });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  const TransformationInput = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : http_request_result,
  });
  const TransformationOutput = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    'createGame' : IDL.Func([IDL.Text, GameType], [], []),
    'downloadSourceCode' : IDL.Func([], [IDL.Text], []),
    'finishGame' : IDL.Func([IDL.Text, IDL.Int], [], []),
    'generateGameCode' : IDL.Func([IDL.Text], [IDL.Text], []),
    'getAllGames' : IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, GameData))], []),
    'getBridgeDeals' : IDL.Func([IDL.Text], [IDL.Vec(BridgeDeal)], []),
    'getCanastaRounds' : IDL.Func([IDL.Text], [IDL.Vec(CanastaRound)], []),
    'getGame' : IDL.Func([IDL.Text], [IDL.Opt(GameData)], []),
    'saveBridgeDeal' : IDL.Func([IDL.Text, BridgeDeal], [], []),
    'saveCanastaRound' : IDL.Func([IDL.Text, CanastaRound], [], []),
    'transform' : IDL.Func(
        [TransformationInput],
        [TransformationOutput],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
