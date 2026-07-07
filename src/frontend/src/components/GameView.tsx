import { type BridgeDeal, type CanastaRound, GameType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useFinishGame,
  useGetBridgeDeals,
  useGetCanastaRounds,
  useGetGame,
  useGetNextDealer,
  useSaveBridgeDeal,
  useSaveCanastaRound,
  useUpdateBridgeDeal,
  useUpdateCanastaRound,
} from "@/hooks/useQueries";
import {
  calculateBridgeScore,
  calculateImp,
  getBridgeExpectedScore,
} from "@/lib/bridgeCalculations";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GameViewProps {
  gameCode: string;
  onBack: () => void;
}

interface BridgeContractDetails {
  nsGameState: boolean;
  weGameState: boolean;
  level: number;
  suit: string;
  double: "none" | "double" | "redouble";
  tricksTaken: number;
  declarer: "NS" | "WE";
  pcValue: number;
  actualScore?: number;
  expectedScore?: number;
  difference?: number;
  imp?: number;
  opponent?: boolean;
}

interface Round {
  id: number;
  nsScore: number;
  weScore: number;
  details?: BridgeContractDetails;
}

/** Strip non-digit characters; returns the absolute numeric string. */
function sanitizeDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/** Format a signed number for display with explicit '-' prefix when negative. */
function formatSigned(value: number): string {
  return value < 0 ? `-${Math.abs(value)}` : String(value);
}

/**
 * Numeric input with an always-visible "minus" checkbox.
 * The input holds only digits (absolute value); the checkbox controls the sign.
 * On save, the consumer combines abs + sign into a signed number.
 */
interface SignedNumberInputProps {
  value: string;
  negative: boolean;
  onValueChange: (value: string) => void;
  onNegativeChange: (negative: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  inputOcid: string;
  checkboxOcid: string;
  label?: string;
  step?: string;
}

function SignedNumberInput({
  value,
  negative,
  onValueChange,
  onNegativeChange,
  placeholder = "0",
  disabled = false,
  inputOcid,
  checkboxOcid,
  label,
  step,
}: SignedNumberInputProps) {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-stretch gap-2">
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onValueChange(sanitizeDigits(e.target.value))}
          placeholder={placeholder}
          step={step}
          disabled={disabled}
          data-ocid={inputOcid}
          className="font-mono"
        />
        <label
          className={`flex items-center gap-2 px-3 rounded-md border transition-colors cursor-pointer select-none touch-target ${
            negative
              ? "border-destructive/60 bg-destructive/10 text-destructive"
              : "border-input bg-muted/40 text-muted-foreground hover:bg-muted"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          data-ocid={checkboxOcid}
        >
          <input
            type="checkbox"
            checked={negative}
            onChange={(e) => onNegativeChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 accent-destructive"
            data-ocid={checkboxOcid}
          />
          <span className="text-sm font-medium">minus</span>
        </label>
      </div>
      {negative && value && value !== "0" && (
        <p className="text-xs text-destructive">Wartość: -{value || "0"}</p>
      )}
    </div>
  );
}

export function GameView({ gameCode, onBack }: GameViewProps) {
  const queryClient = useQueryClient();
  const { data: gameData, isLoading } = useGetGame(gameCode);
  const { data: canastaRounds = [], isLoading: isLoadingCanasta } =
    useGetCanastaRounds(gameCode);
  const { data: bridgeDeals = [], isLoading: isLoadingBridge } =
    useGetBridgeDeals(gameCode);
  const { data: nextDealer = 0n, isLoading: isLoadingDealer } =
    useGetNextDealer(gameCode);

  const finishGameMutation = useFinishGame();
  const saveCanastaRoundMutation = useSaveCanastaRound();
  const saveBridgeDealMutation = useSaveBridgeDeal();
  const updateCanastaRoundMutation = useUpdateCanastaRound();
  const updateBridgeDealMutation = useUpdateBridgeDeal();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Canasta add-form state (absolute value + per-field sign)
  const [nsCanasta, setNsCanasta] = useState("");
  const [nsCanastaNeg, setNsCanastaNeg] = useState(false);
  const [weCanasta, setWeCanasta] = useState("");
  const [weCanastaNeg, setWeCanastaNeg] = useState(false);

  // Bridge add-form state
  const [bridgeContract, setBridgeContract] = useState<BridgeContractDetails>({
    nsGameState: false,
    weGameState: false,
    level: 1,
    suit: "NT",
    double: "none",
    tricksTaken: 7,
    declarer: "NS",
    pcValue: 20,
    actualScore: undefined,
  });
  // Bridge pcValue uses the signed-input pattern too (absolute + minus checkbox)
  const [pcValueStr, setPcValueStr] = useState("20");
  const [pcValueNeg, setPcValueNeg] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleRefreshGame = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["game", gameCode] }),
        queryClient.invalidateQueries({
          queryKey: ["canastaRounds", gameCode],
        }),
        queryClient.invalidateQueries({ queryKey: ["bridgeDeals", gameCode] }),
        queryClient.invalidateQueries({ queryKey: ["nextDealer", gameCode] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["game", gameCode] }),
        queryClient.refetchQueries({ queryKey: ["canastaRounds", gameCode] }),
        queryClient.refetchQueries({ queryKey: ["bridgeDeals", gameCode] }),
        queryClient.refetchQueries({ queryKey: ["nextDealer", gameCode] }),
      ]);
      toast.success("Stan gry został odświeżony z blockchain");
    } catch (error) {
      toast.error("Błąd podczas odświeżania stanu gry");
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load rounds from backend data when available
  useEffect(() => {
    if (gameData?.gameType === GameType.canasta && canastaRounds.length > 0) {
      const convertedRounds: Round[] = canastaRounds.map((round, index) => ({
        id: index + 1,
        nsScore: Number(round.nsScore),
        weScore: Number(round.weScore),
      }));
      setRounds(convertedRounds);
    } else if (
      gameData?.gameType === GameType.bridge &&
      bridgeDeals.length > 0
    ) {
      const convertedRounds: Round[] = bridgeDeals.map((deal, index) => {
        const contractParts = deal.contract.split(" ");
        const level = Number.parseInt(contractParts[0]);
        const suit = contractParts[1];
        const actualScore = Number(deal.actualScore);
        const expectedScore = Number(deal.expectedScore);
        const difference = actualScore - expectedScore;
        const opponent = difference < 0;
        let nsScore = 0;
        let weScore = 0;
        const impValue = Number(deal.impScore);
        if (deal.declarer === "NS") {
          if (opponent) {
            weScore = Math.abs(impValue);
          } else {
            nsScore = impValue;
          }
        } else {
          if (opponent) {
            nsScore = Math.abs(impValue);
          } else {
            weScore = impValue;
          }
        }
        return {
          id: index + 1,
          nsScore,
          weScore,
          details: {
            nsGameState: false,
            weGameState: false,
            level,
            suit,
            double: "none",
            tricksTaken: Number(deal.tricksTaken),
            declarer: deal.declarer as "NS" | "WE",
            pcValue: Number(deal.pcValue),
            actualScore,
            expectedScore,
            difference,
            imp: impValue,
            opponent,
          },
        };
      });
      setRounds(convertedRounds);
    }
  }, [canastaRounds, bridgeDeals, gameData?.gameType]);

  useEffect(() => {
    if (gameData?.finalScore) {
      setIsGameFinished(true);
    }
  }, [gameData]);

  const getGameTypeLabel = (type: GameType) => {
    switch (type) {
      case GameType.canasta:
        return "Canasta";
      case GameType.bridge:
        return "Brydż";
      default:
        return "Nieznany";
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCanastaThresholdForScore = (score: number) => {
    if (score >= 10000)
      return { text: "Koniec gry!", type: "finish", icon: "🏆" };
    if (score >= 7500)
      return { text: "Wyjście na kanastę", type: "canasta", icon: "🎯" };
    if (score >= 5000)
      return { text: "Wyjście na 150", type: "threshold", icon: "📈" };
    if (score >= 3000)
      return { text: "Wyjście na 120", type: "threshold", icon: "📈" };
    if (score >= 1500)
      return { text: "Wyjście na 90", type: "threshold", icon: "📈" };
    if (score >= 5)
      return { text: "Wyjście na 50", type: "threshold", icon: "📈" };
    if (score < 0)
      return { text: "Wyjście na 15", type: "negative", icon: "⚠️" };
    return { text: "Zbieraj punkty", type: "start", icon: "🎮" };
  };

  const getPlayerLabel = (dealerIndex: number) => `gracz${dealerIndex + 1}`;

  /** Combine absolute value string + sign flag into a signed integer. */
  const toSignedInt = (absStr: string, negative: boolean): number => {
    const abs = Number.parseInt(absStr) || 0;
    return negative ? -abs : abs;
  };

  const addCanastaRound = async () => {
    const nsScore = toSignedInt(nsCanasta, nsCanastaNeg);
    const weScore = toSignedInt(weCanasta, weCanastaNeg);

    if (nsScore % 5 !== 0 || weScore % 5 !== 0) {
      toast.error("Wyniki w Canaście muszą być wielokrotnością 5");
      return;
    }
    if (nsScore === 0 && weScore === 0) {
      toast.error("Wprowadź przynajmniej jeden wynik różny od zera");
      return;
    }

    try {
      const round: CanastaRound = {
        roundNumber: BigInt(rounds.length + 1),
        nsScore: BigInt(nsScore),
        weScore: BigInt(weScore),
        timestamp: BigInt(Date.now() * 1000000),
      };
      await saveCanastaRoundMutation.mutateAsync({ gameCode, round });
      setNsCanasta("");
      setNsCanastaNeg(false);
      setWeCanasta("");
      setWeCanastaNeg(false);
      toast.success(`Dodano rundę ${rounds.length + 1}`);
    } catch (error) {
      toast.error("Błąd podczas zapisywania rundy");
      console.error("Save canasta round error:", error);
    }
  };

  const addBridgeRound = async () => {
    try {
      const pcValue = toSignedInt(pcValueStr, pcValueNeg);
      // Bridge pcValue validation: 0-40 inclusive (absolute value)
      const absPc = Math.abs(pcValue);
      if (absPc < 0 || absPc > 40) {
        toast.error("Wartość PC musi być w zakresie 0-40");
        return;
      }
      const contractWithPc = { ...bridgeContract, pcValue: absPc };
      const actualScore = calculateBridgeScore(contractWithPc);
      const declarerGameState =
        bridgeContract.declarer === "NS"
          ? bridgeContract.nsGameState
          : bridgeContract.weGameState;
      const expectedScore = getBridgeExpectedScore(absPc, declarerGameState);
      if (expectedScore === null) {
        toast.error(
          "Nie można obliczyć oczekiwanego wyniku dla podanej wartości PC",
        );
        return;
      }
      const difference = actualScore - expectedScore;
      const absDifference = Math.abs(difference);
      const imp = calculateImp(absDifference);
      const contractString = `${bridgeContract.level} ${bridgeContract.suit}`;
      const deal: BridgeDeal = {
        dealNumber: BigInt(rounds.length + 1),
        contract: contractString,
        declarer: bridgeContract.declarer,
        tricksTaken: BigInt(bridgeContract.tricksTaken),
        pcValue: BigInt(absPc),
        expectedScore: BigInt(expectedScore),
        actualScore: BigInt(actualScore),
        impScore: BigInt(imp),
        timestamp: BigInt(Date.now() * 1000000),
      };
      await saveBridgeDealMutation.mutateAsync({ gameCode, deal });
      setBridgeContract({
        nsGameState: false,
        weGameState: false,
        level: 1,
        suit: "NT",
        double: "none",
        tricksTaken: 7,
        declarer: "NS",
        pcValue: 20,
        actualScore: undefined,
      });
      setPcValueStr("20");
      setPcValueNeg(false);
      toast.success(`Dodano rozdanie ${rounds.length + 1}`);
    } catch (error) {
      toast.error("Błąd podczas obliczania wyniku brydżowego");
      console.error("Bridge calculation error:", error);
    }
  };

  const getTotalScores = () =>
    rounds.reduce(
      (totals, round) => ({
        ns: totals.ns + round.nsScore,
        we: totals.we + round.weScore,
      }),
      { ns: 0, we: 0 },
    );

  const finishGame = async () => {
    if (rounds.length === 0) {
      toast.error("Nie można zakończyć gry bez rund");
      return;
    }
    const totals = getTotalScores();
    const finalScore = Math.max(totals.ns, totals.we);
    try {
      await finishGameMutation.mutateAsync({
        code: gameCode,
        finalScore: BigInt(finalScore),
      });
      setIsGameFinished(true);
      const winner = totals.ns > totals.we ? "NS" : "WE";
      toast.success(
        `Gra zakończona! Wygrała linia ${winner} z wynikiem ${finalScore}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Błąd podczas kończenia gry",
      );
    }
  };

  if (isLoading || isLoadingCanasta || isLoadingBridge || isLoadingDealer) {
    return (
      <div className="min-h-screen felt-background p-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót
        </Button>
        <div className="text-center py-8">
          <p>Ładowanie gry...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen felt-background p-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót
        </Button>
        <div className="text-center py-8">
          <p className="text-destructive">Nie znaleziono gry</p>
        </div>
      </div>
    );
  }

  const totals = getTotalScores();
  const nsThreshold =
    gameData.gameType === GameType.canasta
      ? getCanastaThresholdForScore(totals.ns)
      : null;
  const weThreshold =
    gameData.gameType === GameType.canasta
      ? getCanastaThresholdForScore(totals.we)
      : null;
  const shouldShowFinishButton =
    gameData.gameType === GameType.canasta &&
    (totals.ns >= 10000 || totals.we >= 10000);
  const currentBridgeScore =
    gameData.gameType === GameType.bridge
      ? calculateBridgeScore(bridgeContract)
      : 0;
  const dealerIndex = Number(nextDealer);
  const currentDealer = getPlayerLabel(dealerIndex);

  return (
    <div className="min-h-screen felt-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            size="sm"
            data-ocid="game.back_button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
          {isGameFinished && (
            <Badge variant="secondary" className="text-sm">
              <Trophy className="mr-1 h-4 w-4" />
              Zakończona
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="card-table">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-xl font-mono text-center cursor-pointer hover:text-primary transition-colors flex items-center justify-center gap-2"
              onClick={handleRefreshGame}
              title="Kliknij aby odświeżyć stan gry z blockchain"
            >
              {gameCode}
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
              )}
            </CardTitle>
            <CardDescription className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(gameData.createdAt)}
              </div>
              <Badge variant="outline" className="mt-1">
                {getGameTypeLabel(gameData.gameType)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Kliknij kod gry aby odświeżyć stan z blockchain
              </p>
            </CardDescription>
          </CardHeader>
        </Card>

        {gameData.gameType === GameType.canasta && (
          <Card className="card-table">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {rounds.length === 0 ? "Następny rozdający:" : "Rozdaje:"}
                </p>
                <p className="text-lg font-bold text-primary">
                  {currentDealer}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="card-table">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Wyniki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm font-medium text-muted-foreground">
                  NS
                </div>
                <div className="text-2xl font-bold font-mono">{totals.ns}</div>
                {gameData.gameType === GameType.bridge && (
                  <div className="text-sm text-muted-foreground mt-1">
                    IMP: {totals.ns}
                  </div>
                )}
                {nsThreshold && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="mr-1">{nsThreshold.icon}</span>
                    {nsThreshold.text}
                  </div>
                )}
              </div>
              <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="text-sm font-medium text-muted-foreground">
                  WE
                </div>
                <div className="text-2xl font-bold font-mono">{totals.we}</div>
                {gameData.gameType === GameType.bridge && (
                  <div className="text-sm text-muted-foreground mt-1">
                    IMP: {totals.we}
                  </div>
                )}
                {weThreshold && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="mr-1">{weThreshold.icon}</span>
                    {weThreshold.text}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!isGameFinished && (
          <Card className="card-table">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {gameData.gameType === GameType.canasta
                  ? "Nowa Runda"
                  : "Nowe Rozdanie"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameData.gameType === GameType.canasta ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SignedNumberInput
                      label="NS"
                      value={nsCanasta}
                      negative={nsCanastaNeg}
                      onValueChange={setNsCanasta}
                      onNegativeChange={setNsCanastaNeg}
                      placeholder="0"
                      step="5"
                      disabled={
                        shouldShowFinishButton ||
                        saveCanastaRoundMutation.isPending
                      }
                      inputOcid="canasta.ns_input"
                      checkboxOcid="canasta.ns_minus"
                    />
                    <SignedNumberInput
                      label="WE"
                      value={weCanasta}
                      negative={weCanastaNeg}
                      onValueChange={setWeCanasta}
                      onNegativeChange={setWeCanastaNeg}
                      placeholder="0"
                      step="5"
                      disabled={
                        shouldShowFinishButton ||
                        saveCanastaRoundMutation.isPending
                      }
                      inputOcid="canasta.we_input"
                      checkboxOcid="canasta.we_minus"
                    />
                  </div>
                  {shouldShowFinishButton ? (
                    <Button
                      onClick={finishGame}
                      className="w-full"
                      size="lg"
                      data-ocid="canasta.finish_button"
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Zakończ Grę
                    </Button>
                  ) : (
                    <Button
                      onClick={addCanastaRound}
                      className="w-full"
                      disabled={saveCanastaRoundMutation.isPending}
                      data-ocid="canasta.add_button"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {saveCanastaRoundMutation.isPending
                        ? "Zapisywanie..."
                        : "Dodaj Rundę"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Stan partii</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 mobile-game-state">
                        <Switch
                          checked={bridgeContract.nsGameState}
                          onCheckedChange={(checked) =>
                            setBridgeContract({
                              ...bridgeContract,
                              nsGameState: checked,
                            })
                          }
                          className="mobile-switch"
                        />
                        <Label className="text-sm">NS po partii</Label>
                      </div>
                      <div className="flex items-center space-x-2 mobile-game-state">
                        <Switch
                          checked={bridgeContract.weGameState}
                          onCheckedChange={(checked) =>
                            setBridgeContract({
                              ...bridgeContract,
                              weGameState: checked,
                            })
                          }
                          className="mobile-switch"
                        />
                        <Label className="text-sm">WE po partii</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Poziom</Label>
                      <Select
                        value={bridgeContract.level.toString()}
                        onValueChange={(v) =>
                          setBridgeContract({
                            ...bridgeContract,
                            level: Number.parseInt(v),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kolor</Label>
                      <Select
                        value={bridgeContract.suit}
                        onValueChange={(v) =>
                          setBridgeContract({ ...bridgeContract, suit: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NT">NT</SelectItem>
                          <SelectItem value="S">♠</SelectItem>
                          <SelectItem value="H">♥</SelectItem>
                          <SelectItem value="D">♦</SelectItem>
                          <SelectItem value="C">♣</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Linia rozgrywająca</Label>
                      <Select
                        value={bridgeContract.declarer}
                        onValueChange={(v) =>
                          setBridgeContract({
                            ...bridgeContract,
                            declarer: v as "NS" | "WE",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NS">NS</SelectItem>
                          <SelectItem value="WE">WE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kontra</Label>
                      <Select
                        value={bridgeContract.double}
                        onValueChange={(v) =>
                          setBridgeContract({
                            ...bridgeContract,
                            double: v as "none" | "double" | "redouble",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Brak</SelectItem>
                          <SelectItem value="double">Kontra</SelectItem>
                          <SelectItem value="redouble">Rekontra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Wzięte lewy</Label>
                    <Select
                      value={bridgeContract.tricksTaken.toString()}
                      onValueChange={(v) =>
                        setBridgeContract({
                          ...bridgeContract,
                          tricksTaken: Number.parseInt(v),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(
                          (n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <SignedNumberInput
                    label="PC (Punkty Kontrolne)"
                    value={pcValueStr}
                    negative={pcValueNeg}
                    onValueChange={setPcValueStr}
                    onNegativeChange={setPcValueNeg}
                    placeholder="20"
                    disabled={saveBridgeDealMutation.isPending}
                    inputOcid="bridge.pc_input"
                    checkboxOcid="bridge.pc_minus"
                  />
                  <p className="text-xs text-muted-foreground">
                    Wprowadź wartość PC (obsługiwane wartości od 0 do 40
                    włącznie)
                  </p>

                  <div className="space-y-2">
                    <Label>Obliczony wynik rozdania</Label>
                    <div className="p-3 bg-accent/20 rounded-lg border border-accent/30">
                      <div className="text-lg font-mono font-bold text-center">
                        {currentBridgeScore} punktów
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Automatycznie obliczony na podstawie kontraktu według
                        zasad Chicago
                      </p>
                    </div>
                  </div>

                  <BridgePreview
                    bridgeContract={{
                      ...bridgeContract,
                      pcValue: Math.abs(toSignedInt(pcValueStr, pcValueNeg)),
                    }}
                  />

                  <Button
                    onClick={addBridgeRound}
                    className="w-full"
                    disabled={saveBridgeDealMutation.isPending}
                    data-ocid="bridge.add_button"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {saveBridgeDealMutation.isPending
                      ? "Zapisywanie..."
                      : "Dodaj Rozdanie"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {rounds.length > 0 && (
          <Card className="card-table">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Historia{" "}
                {gameData.gameType === GameType.canasta ? "Rund" : "Rozdań"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rounds.map((round, index) => (
                  <RoundRow
                    key={round.id}
                    round={round}
                    gameType={gameData.gameType}
                    isEditing={editingId === round.id}
                    onEdit={() => setEditingId(round.id)}
                    onCancel={() => setEditingId(null)}
                    onSave={async (nsScore, weScore, details) => {
                      try {
                        if (gameData.gameType === GameType.canasta) {
                          await updateCanastaRoundMutation.mutateAsync({
                            gameCode,
                            roundIndex: BigInt(index),
                            nsScore: BigInt(nsScore),
                            weScore: BigInt(weScore),
                          });
                        } else if (
                          gameData.gameType === GameType.bridge &&
                          details
                        ) {
                          const actualScore = calculateBridgeScore(details);
                          const declarerGameState =
                            details.declarer === "NS"
                              ? details.nsGameState
                              : details.weGameState;
                          const expectedScore = getBridgeExpectedScore(
                            Math.abs(details.pcValue),
                            declarerGameState,
                          );
                          if (expectedScore === null) {
                            toast.error(
                              "Nie można obliczyć oczekiwanego wyniku dla podanej wartości PC",
                            );
                            return;
                          }
                          const difference = actualScore - expectedScore;
                          const imp = calculateImp(Math.abs(difference));
                          await updateBridgeDealMutation.mutateAsync({
                            gameCode,
                            dealIndex: BigInt(index),
                            contract: `${details.level} ${details.suit}`,
                            declarer: details.declarer,
                            tricksTaken: BigInt(details.tricksTaken),
                            pcValue: BigInt(Math.abs(details.pcValue)),
                            expectedScore: BigInt(expectedScore),
                            actualScore: BigInt(actualScore),
                            impScore: BigInt(imp),
                          });
                        }
                        setEditingId(null);
                        toast.success("Wpis zaktualizowany");
                      } catch (error) {
                        toast.error("Błąd podczas aktualizacji wpisu");
                        console.error("Update error:", error);
                      }
                    }}
                    isSaving={
                      updateCanastaRoundMutation.isPending ||
                      updateBridgeDealMutation.isPending
                    }
                    itemIndex={index + 1}
                  />
                ))}
              </div>

              {gameData.gameType === GameType.bridge && rounds.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-sm font-medium mb-2">
                    Podsumowanie IMP:
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>NS IMP:</span>
                      <span className="font-mono font-bold">{totals.ns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WE IMP:</span>
                      <span className="font-mono font-bold">{totals.we}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {rounds.length > 0 && !isGameFinished && !shouldShowFinishButton && (
          <Card className="card-table">
            <CardContent className="pt-6">
              <Button
                onClick={finishGame}
                className="w-full"
                size="lg"
                disabled={finishGameMutation.isPending}
                data-ocid="game.finish_button"
              >
                <Save className="mr-2 h-4 w-4" />
                {finishGameMutation.isPending
                  ? "Kończenie gry..."
                  : "Zakończ Grę"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/** A single round/deal row with inline-edit capability. */
interface RoundRowProps {
  round: Round;
  gameType: GameType;
  isEditing: boolean;
  isSaving: boolean;
  itemIndex: number;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (
    nsScore: number,
    weScore: number,
    details?: BridgeContractDetails,
  ) => Promise<void>;
}

function RoundRow({
  round,
  gameType,
  isEditing,
  isSaving,
  itemIndex,
  onEdit,
  onCancel,
  onSave,
}: RoundRowProps) {
  if (gameType === GameType.canasta) {
    return (
      <CanastaRoundRow
        round={round}
        isEditing={isEditing}
        isSaving={isSaving}
        itemIndex={itemIndex}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
      />
    );
  }
  return (
    <BridgeDealRow
      round={round}
      isEditing={isEditing}
      isSaving={isSaving}
      itemIndex={itemIndex}
      onEdit={onEdit}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}

function CanastaRoundRow({
  round,
  isEditing,
  isSaving,
  itemIndex,
  onEdit,
  onCancel,
  onSave,
}: Omit<RoundRowProps, "gameType">) {
  const [nsAbs, setNsAbs] = useState(String(Math.abs(round.nsScore)));
  const [nsNeg, setNsNeg] = useState(round.nsScore < 0);
  const [weAbs, setWeAbs] = useState(String(Math.abs(round.weScore)));
  const [weNeg, setWeNeg] = useState(round.weScore < 0);

  // Sync from props when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setNsAbs(String(Math.abs(round.nsScore)));
      setNsNeg(round.nsScore < 0);
      setWeAbs(String(Math.abs(round.weScore)));
      setWeNeg(round.weScore < 0);
    }
  }, [isEditing, round.nsScore, round.weScore]);

  const handleSave = async () => {
    const nsScore = nsNeg
      ? -(Number.parseInt(nsAbs) || 0)
      : Number.parseInt(nsAbs) || 0;
    const weScore = weNeg
      ? -(Number.parseInt(weAbs) || 0)
      : Number.parseInt(weAbs) || 0;
    if (nsScore % 5 !== 0 || weScore % 5 !== 0) {
      toast.error("Wyniki w Canaście muszą być wielokrotnością 5");
      return;
    }
    await onSave(nsScore, weScore);
  };

  if (!isEditing) {
    return (
      <div
        className="p-3 bg-accent/10 rounded-lg border border-accent/20"
        data-ocid={`canasta.item.${itemIndex}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Runda {round.id}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            data-ocid={`canasta.edit_button.${itemIndex}`}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edytuj
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>NS</span>
            <span className="font-mono font-bold">
              {formatSigned(round.nsScore)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>WE</span>
            <span className="font-mono font-bold">
              {formatSigned(round.weScore)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 bg-primary/5 rounded-lg border border-primary/30"
      data-ocid={`canasta.item.${itemIndex}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Runda {round.id} — edycja</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <SignedNumberInput
          label="NS"
          value={nsAbs}
          negative={nsNeg}
          onValueChange={setNsAbs}
          onNegativeChange={setNsNeg}
          placeholder="0"
          step="5"
          disabled={isSaving}
          inputOcid={`canasta.edit.ns_input.${itemIndex}`}
          checkboxOcid={`canasta.edit.ns_minus.${itemIndex}`}
        />
        <SignedNumberInput
          label="WE"
          value={weAbs}
          negative={weNeg}
          onValueChange={setWeAbs}
          onNegativeChange={setWeNeg}
          placeholder="0"
          step="5"
          disabled={isSaving}
          inputOcid={`canasta.edit.we_input.${itemIndex}`}
          checkboxOcid={`canasta.edit.we_minus.${itemIndex}`}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          data-ocid={`canasta.save_button.${itemIndex}`}
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </Button>
        <Button
          onClick={onCancel}
          disabled={isSaving}
          variant="outline"
          size="sm"
          data-ocid={`canasta.cancel_button.${itemIndex}`}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Anuluj
        </Button>
      </div>
    </div>
  );
}

function BridgeDealRow({
  round,
  isEditing,
  isSaving,
  itemIndex,
  onEdit,
  onCancel,
  onSave,
}: Omit<RoundRowProps, "gameType">) {
  const baseDetails: BridgeContractDetails = round.details ?? {
    nsGameState: false,
    weGameState: false,
    level: 1,
    suit: "NT",
    double: "none",
    tricksTaken: 7,
    declarer: "NS",
    pcValue: 20,
  };
  const [details, setDetails] = useState<BridgeContractDetails>(baseDetails);
  const [pcAbs, setPcAbs] = useState(String(Math.abs(baseDetails.pcValue)));
  const [pcNeg, setPcNeg] = useState(baseDetails.pcValue < 0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: baseDetails is a stable default; including it would re-trigger on every render
  useEffect(() => {
    if (isEditing) {
      setDetails(round.details ?? baseDetails);
      setPcAbs(String(Math.abs(round.details?.pcValue ?? 20)));
      setPcNeg((round.details?.pcValue ?? 20) < 0);
    }
  }, [isEditing, round.details]);

  const handleSave = async () => {
    const pcValue = pcNeg
      ? -(Number.parseInt(pcAbs) || 0)
      : Number.parseInt(pcAbs) || 0;
    if (Math.abs(pcValue) < 0 || Math.abs(pcValue) > 40) {
      toast.error("Wartość PC musi być w zakresie 0-40");
      return;
    }
    await onSave(0, 0, { ...details, pcValue });
  };

  if (!isEditing) {
    return (
      <div
        className="p-3 bg-accent/10 rounded-lg border border-accent/20"
        data-ocid={`bridge.item.${itemIndex}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Rozdanie {round.id}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            data-ocid={`bridge.edit_button.${itemIndex}`}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edytuj
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>NS</span>
            <span className="font-mono font-bold">
              {formatSigned(round.nsScore)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>WE</span>
            <span className="font-mono font-bold">
              {formatSigned(round.weScore)}
            </span>
          </div>
        </div>
        {round.details && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-2">
            <p>
              {round.details.level}
              {round.details.suit}
              {round.details.double !== "none" && ` (${round.details.double})`},{" "}
              {round.details.tricksTaken} lew, rozgrywający:{" "}
              {round.details.declarer}
            </p>
            <p>
              Stan partii: NS {round.details.nsGameState ? "po" : "przed"}, WE{" "}
              {round.details.weGameState ? "po" : "przed"}
            </p>
            <p>PC: {formatSigned(round.details.pcValue)}</p>
            <div className="bridge-score-display">
              <p>
                Rzeczywisty wynik: {round.details.actualScore}, Oczekiwanie:{" "}
                {round.details.expectedScore}, Różnica:{" "}
                {round.details.difference}
              </p>
              {round.details.imp !== undefined && (
                <div className="mt-1 pt-1 border-t border-border/30 flex justify-center">
                  <span className="font-bold">
                    IMP: {round.details.imp}
                    {round.details.opponent && (
                      <span className="text-orange-500 ml-1">
                        (przypisano przeciwnikowi)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-3 bg-primary/5 rounded-lg border border-primary/30"
      data-ocid={`bridge.item.${itemIndex}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Rozdanie {round.id} — edycja</h4>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Poziom</Label>
            <Select
              value={details.level.toString()}
              onValueChange={(v) =>
                setDetails({ ...details, level: Number.parseInt(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kolor</Label>
            <Select
              value={details.suit}
              onValueChange={(v) => setDetails({ ...details, suit: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NT">NT</SelectItem>
                <SelectItem value="S">♠</SelectItem>
                <SelectItem value="H">♥</SelectItem>
                <SelectItem value="D">♦</SelectItem>
                <SelectItem value="C">♣</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Linia rozgrywająca</Label>
            <Select
              value={details.declarer}
              onValueChange={(v) =>
                setDetails({ ...details, declarer: v as "NS" | "WE" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NS">NS</SelectItem>
                <SelectItem value="WE">WE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kontra</Label>
            <Select
              value={details.double}
              onValueChange={(v) =>
                setDetails({
                  ...details,
                  double: v as "none" | "double" | "redouble",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Brak</SelectItem>
                <SelectItem value="double">Kontra</SelectItem>
                <SelectItem value="redouble">Rekontra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Wzięte lewy</Label>
          <Select
            value={details.tricksTaken.toString()}
            onValueChange={(v) =>
              setDetails({ ...details, tricksTaken: Number.parseInt(v) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 mobile-game-state">
            <Switch
              checked={details.nsGameState}
              onCheckedChange={(checked) =>
                setDetails({ ...details, nsGameState: checked })
              }
              className="mobile-switch"
            />
            <Label className="text-sm">NS po partii</Label>
          </div>
          <div className="flex items-center space-x-2 mobile-game-state">
            <Switch
              checked={details.weGameState}
              onCheckedChange={(checked) =>
                setDetails({ ...details, weGameState: checked })
              }
              className="mobile-switch"
            />
            <Label className="text-sm">WE po partii</Label>
          </div>
        </div>
        <SignedNumberInput
          label="PC (Punkty Kontrolne)"
          value={pcAbs}
          negative={pcNeg}
          onValueChange={setPcAbs}
          onNegativeChange={setPcNeg}
          placeholder="20"
          disabled={isSaving}
          inputOcid={`bridge.edit.pc_input.${itemIndex}`}
          checkboxOcid={`bridge.edit.pc_minus.${itemIndex}`}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            data-ocid={`bridge.save_button.${itemIndex}`}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isSaving}
            variant="outline"
            size="sm"
            data-ocid={`bridge.cancel_button.${itemIndex}`}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Anuluj
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component for bridge calculation preview
function BridgePreview({
  bridgeContract,
}: { bridgeContract: BridgeContractDetails }) {
  const [preview, setPreview] = useState<{
    declarer?: string;
    actualScore?: number;
    declarerGameState?: boolean;
    expectedScore?: number;
    difference?: number;
    absDifference?: number;
    imp?: number;
    pcValue?: number;
    opponent?: boolean;
    finalAssignment?: string;
    error?: string;
  } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: dep array intentionally lists specific fields of bridgeContract instead of the whole object
  useEffect(() => {
    const loadPreview = () => {
      try {
        const actualScore = calculateBridgeScore(bridgeContract);
        const declarerGameState =
          bridgeContract.declarer === "NS"
            ? bridgeContract.nsGameState
            : bridgeContract.weGameState;
        const expectedScore = getBridgeExpectedScore(
          Math.abs(bridgeContract.pcValue),
          declarerGameState,
        );
        if (expectedScore !== null) {
          const difference = actualScore - expectedScore;
          const opponent = difference < 0;
          const absDifference = Math.abs(difference);
          const imp = calculateImp(absDifference);
          let finalAssignment = "";
          if (opponent) {
            const opponentSide = bridgeContract.declarer === "NS" ? "WE" : "NS";
            finalAssignment = `${opponentSide} otrzyma ${imp} IMP (ujemna różnica)`;
          } else {
            finalAssignment = `${bridgeContract.declarer} otrzyma ${imp} IMP`;
          }
          setPreview({
            declarer: bridgeContract.declarer,
            actualScore,
            declarerGameState,
            expectedScore,
            difference,
            absDifference,
            imp,
            pcValue: bridgeContract.pcValue,
            opponent,
            finalAssignment,
          });
        } else {
          setPreview({
            error: "Wartość PC poza obsługiwanym zakresem (0 do 40 włącznie)",
            pcValue: bridgeContract.pcValue,
          });
        }
      } catch (error) {
        console.error("Preview calculation error:", error);
        setPreview({
          error: "Błąd podczas obliczania podglądu",
          pcValue: bridgeContract.pcValue,
        });
      }
    };

    if (
      Math.abs(bridgeContract.pcValue) >= 0 &&
      Math.abs(bridgeContract.pcValue) <= 40
    ) {
      loadPreview();
    } else {
      setPreview({
        error: "Wartość PC poza obsługiwanym zakresem (0 do 40 włącznie)",
        pcValue: bridgeContract.pcValue,
      });
    }
  }, [
    bridgeContract.level,
    bridgeContract.suit,
    bridgeContract.double,
    bridgeContract.tricksTaken,
    bridgeContract.declarer,
    bridgeContract.nsGameState,
    bridgeContract.weGameState,
    bridgeContract.pcValue,
  ]);

  if (!preview) {
    return (
      <div className="bridge-score-display space-y-2">
        <div className="text-xs text-muted-foreground mb-1">
          Brak podglądu obliczeń
        </div>
      </div>
    );
  }

  if (preview.error) {
    return (
      <div className="bridge-score-display space-y-2">
        <div className="text-xs text-muted-foreground mb-1">
          Podgląd obliczeń:
        </div>
        <div className="text-sm text-destructive">
          PC: {preview.pcValue} - {preview.error}
        </div>
      </div>
    );
  }

  return (
    <div className="bridge-score-display space-y-2">
      <div className="text-xs text-muted-foreground mb-1">
        Podgląd obliczeń (lokalne obliczenia):
      </div>
      <div className="space-y-2">
        <div className="text-sm">
          <div className="font-medium">Rozgrywający: {preview.declarer}</div>
          <div className="ml-2 text-xs space-y-1">
            <div>Rzeczywisty wynik: {preview.actualScore}</div>
            <div>
              Stan: {preview.declarerGameState ? "po partii" : "przed partią"}
            </div>
            <div>PC: {preview.pcValue}</div>
            <div>Oczekiwanie: {preview.expectedScore}</div>
            <div>Różnica: {preview.difference} (rzeczywisty - oczekiwany)</div>
            <div>Wartość bezwzględna różnicy: {preview.absDifference}</div>
            <div>IMP z tabeli: {preview.imp}</div>
            <div className="font-bold text-primary">
              Przypisanie: {preview.finalAssignment}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
