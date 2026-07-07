import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BridgeDeal__1 {
    contract: string;
    dealNumber: bigint;
    expectedScore: bigint;
    pcValue: bigint;
    tricksTaken: bigint;
    timestamp: Time;
    declarer: string;
    actualScore: bigint;
    impScore: bigint;
}
export type Time = bigint;
export interface CanastaRound__1 {
    timestamp: Time;
    weScore: bigint;
    roundNumber: bigint;
    nsScore: bigint;
}
export interface Map_4 {
    root: Tree_4;
    size: bigint;
}
export type Tree_2 = {
    __kind__: "red";
    red: [Tree_2, Text, Array<CanastaRound__1>, Tree_2];
} | {
    __kind__: "leaf";
    leaf: null;
} | {
    __kind__: "black";
    black: [Tree_2, Text, Array<CanastaRound__1>, Tree_2];
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Tree_3 = {
    __kind__: "red";
    red: [Tree_3, Text, bigint, Tree_3];
} | {
    __kind__: "leaf";
    leaf: null;
} | {
    __kind__: "black";
    black: [Tree_3, Text, bigint, Tree_3];
};
export interface CanastaRound {
    timestamp: bigint;
    weScore: bigint;
    roundNumber: bigint;
    nsScore: bigint;
}
export type Tree = {
    __kind__: "red";
    red: [Tree, Text, GameData, Tree];
} | {
    __kind__: "leaf";
    leaf: null;
} | {
    __kind__: "black";
    black: [Tree, Text, GameData, Tree];
};
export type Text = string;
export interface Map_3 {
    root: Tree_3;
    size: bigint;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Map_1 {
    root: Tree_1;
    size: bigint;
}
export type Tree_4 = {
    __kind__: "red";
    red: [Tree_4, Text, Array<BridgeDeal__1>, Tree_4];
} | {
    __kind__: "leaf";
    leaf: null;
} | {
    __kind__: "black";
    black: [Tree_4, Text, Array<BridgeDeal__1>, Tree_4];
};
export interface GameData {
    createdAt: Time;
    finalScore?: bigint;
    gameType: GameType;
}
export interface BridgeDeal {
    contract: string;
    dealNumber: bigint;
    expectedScore: bigint;
    pcValue: bigint;
    tricksTaken: bigint;
    timestamp: bigint;
    declarer: string;
    actualScore: bigint;
    impScore: bigint;
}
export interface Map_2 {
    root: Tree_2;
    size: bigint;
}
export type Tree_1 = {
    __kind__: "red";
    red: [Tree_1, Text, boolean, Tree_1];
} | {
    __kind__: "leaf";
    leaf: null;
} | {
    __kind__: "black";
    black: [Tree_1, Text, boolean, Tree_1];
};
export interface Map_ {
    root: Tree;
    size: bigint;
}
export enum GameType {
    bridge = "bridge",
    canasta = "canasta"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGame(code: string, gameType: GameType): Promise<void>;
    finishGame(code: string, finalScore: bigint): Promise<void>;
    generateGameCode(userInput: string): Promise<string>;
    getAllGames(): Promise<Array<[string, GameData]>>;
    getBridgeDeals(gameCode: string): Promise<Array<BridgeDeal__1>>;
    getCallerUserRole(): Promise<UserRole>;
    getCanastaRounds(gameCode: string): Promise<Array<CanastaRound__1>>;
    getGame(code: string): Promise<GameData | null>;
    getNextDealer(gameCode: string): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    saveBridgeDeal(gameCode: string, deal: BridgeDeal__1): Promise<void>;
    saveCanastaRound(gameCode: string, round: CanastaRound__1): Promise<void>;
    updateBridgeDeal(gameCode: string, dealIndex: bigint, contract: string, declarer: string, tricksTaken: bigint, pcValue: bigint, expectedScore: bigint, actualScore: bigint, impScore: bigint): Promise<BridgeDeal | null>;
    updateCanastaRound(gameCode: string, roundIndex: bigint, nsScore: bigint, weScore: bigint): Promise<CanastaRound | null>;
}
