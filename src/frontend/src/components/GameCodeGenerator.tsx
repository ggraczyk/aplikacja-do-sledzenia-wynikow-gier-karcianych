import { GameType } from "@/backend";
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
import { Separator } from "@/components/ui/separator";
import { useCreateGame, useGenerateGameCode } from "@/hooks/useQueries";
import { Loader2, Plus, Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GameCodeGeneratorProps {
  onGameCreated: (gameCode: string) => void;
}

export function GameCodeGenerator({ onGameCreated }: GameCodeGeneratorProps) {
  const [userInput, setUserInput] = useState("");
  const [gameType, setGameType] = useState<GameType | "">("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const generateCodeMutation = useGenerateGameCode();
  const createGameMutation = useCreateGame();

  const handleGenerateCode = async () => {
    if (!userInput.trim()) {
      toast.error("Wprowadź swoje inicjały lub krótką frazę");
      return;
    }

    if (userInput.length > 8) {
      toast.error("Wprowadzona fraza jest za długa (maksymalnie 8 znaków)");
      return;
    }

    try {
      const code = await generateCodeMutation.mutateAsync(userInput.trim());
      setGeneratedCode(code);
      toast.success("Kod został wygenerowany!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Błąd podczas generowania kodu",
      );
    }
  };

  const handleCreateGame = async () => {
    if (!generatedCode || !gameType) {
      toast.error("Wybierz typ gry");
      return;
    }

    try {
      await createGameMutation.mutateAsync({
        code: generatedCode,
        gameType: gameType as GameType,
      });
      toast.success("Gra została utworzona!");
      onGameCreated(generatedCode);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Błąd podczas tworzenia gry",
      );
    }
  };

  const generateSuggestion = () => {
    const suggestions = ["GEDA", "GREA"];
    const randomSuggestion =
      suggestions[Math.floor(Math.random() * suggestions.length)];
    setUserInput(randomSuggestion);
  };

  const handleGameTypeChange = (value: string) => {
    setGameType(value as GameType | "");
  };

  return (
    <Card className="card-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Utwórz Nową Grę
        </CardTitle>
        <CardDescription>
          Wygeneruj pamiętliwy kod dostępu i utwórz nową grę parami (NS/WE)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userInput">
            Twoje inicjały lub krótka fraza (max 8 znaków)
          </Label>
          <div className="flex gap-2">
            <Input
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="np. GEDA"
              maxLength={8}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={generateSuggestion}
              title="Losowa sugestia"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Zostanie połączone z losową liczbą (np. GEDA_1234)
          </p>
        </div>

        <Button
          onClick={handleGenerateCode}
          disabled={generateCodeMutation.isPending || !userInput.trim()}
          className="w-full"
        >
          {generateCodeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generowanie...
            </>
          ) : (
            "Wygeneruj Kod"
          )}
        </Button>

        {generatedCode && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
                <Label className="text-sm font-medium">Wygenerowany kod:</Label>
                <p className="text-lg font-mono font-bold text-primary mt-1">
                  {generatedCode}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameType">Typ gry</Label>
                <Select value={gameType} onValueChange={handleGameTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ gry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GameType.canasta}>
                      <div className="space-y-1">
                        <div className="font-medium">Canasta</div>
                        <div className="text-xs text-muted-foreground">
                          Wyniki wielokrotnością 5, system progów punktowych
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value={GameType.bridge}>
                      <div className="space-y-1">
                        <div className="font-medium">Brydż</div>
                        <div className="text-xs text-muted-foreground">
                          Automatyczne obliczanie wyników sportowych
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateGame}
                disabled={createGameMutation.isPending || !gameType}
                className="w-full"
                size="lg"
              >
                {createGameMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tworzenie gry...
                  </>
                ) : (
                  "Utwórz Grę"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
