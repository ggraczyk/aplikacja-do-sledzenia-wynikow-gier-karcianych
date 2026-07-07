import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BridgeDeal {
  'contract' : string,
  'dealNumber' : bigint,
  'expectedScore' : bigint,
  'pcValue' : bigint,
  'tricksTaken' : bigint,
  'timestamp' : Time,
  'declarer' : string,
  'actualScore' : bigint,
  'impScore' : bigint,
}
export interface CanastaRound {
  'timestamp' : Time,
  'weScore' : bigint,
  'roundNumber' : bigint,
  'nsScore' : bigint,
}
export interface GameData {
  'createdAt' : Time,
  'finalScore' : [] | [bigint],
  'gameType' : GameType,
}
export type GameType = { 'bridge' : null } |
  { 'canasta' : null };
export type Time = bigint;
export interface TransformationInput {
  'context' : Uint8Array | number[],
  'response' : http_request_result,
}
export interface TransformationOutput {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface _SERVICE {
  'createGame' : ActorMethod<[string, GameType], undefined>,
  'downloadSourceCode' : ActorMethod<[], string>,
  'finishGame' : ActorMethod<[string, bigint], undefined>,
  'generateGameCode' : ActorMethod<[string], string>,
  'getAllGames' : ActorMethod<[], Array<[string, GameData]>>,
  'getBridgeDeals' : ActorMethod<[string], Array<BridgeDeal>>,
  'getCanastaRounds' : ActorMethod<[string], Array<CanastaRound>>,
  'getGame' : ActorMethod<[string], [] | [GameData]>,
  'saveBridgeDeal' : ActorMethod<[string, BridgeDeal], undefined>,
  'saveCanastaRound' : ActorMethod<[string, CanastaRound], undefined>,
  'transform' : ActorMethod<[TransformationInput], TransformationOutput>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
