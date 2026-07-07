import type { GameData } from "@/backend";
import type {
  BridgeDeal,
  CanastaRound,
  GameTrackerActor,
  GameType,
} from "@/types/game-tracker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGenerateGameCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userInput: string) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      return actor.generateGameCode(userInput);
    },
  });
}

export function useCreateGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      gameType,
    }: { code: string; gameType: GameType }) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      return actor.createGame(code, gameType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useGetGame(code: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<GameData | null>({
    queryKey: ["game", code],
    queryFn: async () => {
      if (!actor || !code) return null;
      return actor.getGame(code);
    },
    enabled: !!actor && !isFetching && !!code,
  });
}

export function useGetAllGames() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, GameData]>>({
    queryKey: ["games"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGames();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFinishGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      finalScore,
    }: { code: string; finalScore: bigint }) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      return actor.finishGame(code, finalScore);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["game", variables.code] });
    },
  });
}

export function useDownloadSourceCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      return actor.downloadSourceCode();
    },
  });
}

// New hooks for Canasta rounds
export function useSaveCanastaRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameCode,
      round,
    }: { gameCode: string; round: CanastaRound }) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      return actor.saveCanastaRound(gameCode, round);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["canastaRounds", variables.gameCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["nextDealer", variables.gameCode],
      });
    },
  });
}

export function useGetCanastaRounds(gameCode: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CanastaRound[]>({
    queryKey: ["canastaRounds", gameCode],
    queryFn: async () => {
      if (!actor || !gameCode) return [];
      return actor.getCanastaRounds(gameCode);
    },
    enabled: !!actor && !isFetching && !!gameCode,
  });
}

// New hook for getting next dealer
export function useGetNextDealer(gameCode: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["nextDealer", gameCode],
    queryFn: async () => {
      if (!actor || !gameCode) return 0n;
      return actor.getNextDealer(gameCode);
    },
    enabled: !!actor && !isFetching && !!gameCode,
  });
}

// New hooks for Bridge deals
export function useSaveBridgeDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameCode,
      deal,
    }: { gameCode: string; deal: BridgeDeal }) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      return actor.saveBridgeDeal(gameCode, deal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bridgeDeals", variables.gameCode],
      });
    },
  });
}

export function useGetBridgeDeals(gameCode: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<BridgeDeal[]>({
    queryKey: ["bridgeDeals", gameCode],
    queryFn: async () => {
      if (!actor || !gameCode) return [];
      return actor.getBridgeDeals(gameCode);
    },
    enabled: !!actor && !isFetching && !!gameCode,
  });
}

// Update an existing Canasta round in place by index (no remove + re-add).
export function useUpdateCanastaRound() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameCode,
      roundIndex,
      nsScore,
      weScore,
    }: {
      gameCode: string;
      roundIndex: bigint;
      nsScore: bigint;
      weScore: bigint;
    }) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      const tracker = actor as unknown as GameTrackerActor;
      return tracker.updateCanastaRound(gameCode, roundIndex, nsScore, weScore);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["canastaRounds", variables.gameCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["nextDealer", variables.gameCode],
      });
      queryClient.invalidateQueries({ queryKey: ["game", variables.gameCode] });
    },
  });
}

// Update an existing Bridge deal in place by index (no remove + re-add).
export function useUpdateBridgeDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameCode,
      dealIndex,
      contract,
      declarer,
      tricksTaken,
      pcValue,
      expectedScore,
      actualScore,
      impScore,
    }: {
      gameCode: string;
      dealIndex: bigint;
      contract: string;
      declarer: string;
      tricksTaken: bigint;
      pcValue: bigint;
      expectedScore: bigint;
      actualScore: bigint;
      impScore: bigint;
    }) => {
      if (!actor) throw new Error("Actor nie jest dostępny");
      const tracker = actor as unknown as GameTrackerActor;
      return tracker.updateBridgeDeal(
        gameCode,
        dealIndex,
        contract,
        declarer,
        tricksTaken,
        pcValue,
        expectedScore,
        actualScore,
        impScore,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bridgeDeals", variables.gameCode],
      });
      queryClient.invalidateQueries({ queryKey: ["game", variables.gameCode] });
    },
  });
}
