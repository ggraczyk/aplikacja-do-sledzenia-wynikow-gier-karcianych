import { GameType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllGames } from "@/hooks/useQueries";
import { Calendar, GamepadIcon, Play, Trophy, Users } from "lucide-react";

interface GamesListProps {
  onGameSelected: (gameCode: string) => void;
}

export function GamesList({ onGameSelected }: GamesListProps) {
  const { data: games, isLoading, error } = useGetAllGames();

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

  const getGameTypeDescription = (type: GameType) => {
    switch (type) {
      case GameType.canasta:
        return "Gra parami NS/WE, system progów";
      case GameType.bridge:
        return "Gra parami NS/WE, wyniki sportowe";
      default:
        return "";
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <GamepadIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Wszystkie Gry</h2>
        </div>
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, index is stable and unique within this list
          <Card key={i} className="card-table">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Błąd podczas ładowania gier</p>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <GamepadIcon className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">Brak gier</h3>
          <p className="text-muted-foreground">
            Nie ma jeszcze żadnych utworzonych gier. Utwórz pierwszą grę!
          </p>
        </div>
      </div>
    );
  }

  // Sort games by createdAt timestamp in descending order (newest first)
  const sortedGames = [...games].sort((a, b) => {
    const timeA = Number(a[1].createdAt);
    const timeB = Number(b[1].createdAt);
    return timeB - timeA; // Descending order (newest first)
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GamepadIcon className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          Wszystkie Gry ({sortedGames.length})
        </h2>
      </div>

      <div className="space-y-3">
        {sortedGames.map(([code, gameData]) => (
          <Card
            key={code}
            className="card-table hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-mono">{code}</CardTitle>
                <Badge variant="secondary">
                  {getGameTypeLabel(gameData.gameType)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(gameData.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {getGameTypeDescription(gameData.gameType)}
                  </div>
                </div>

                {gameData.finalScore && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Zakończona (najwyższy wynik:{" "}
                    {gameData.finalScore.toString()})
                  </div>
                )}

                <Button
                  onClick={() => onGameSelected(code)}
                  className="w-full"
                  variant={gameData.finalScore ? "outline" : "default"}
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {gameData.finalScore ? "Zobacz Wyniki" : "Kontynuuj Grę"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
