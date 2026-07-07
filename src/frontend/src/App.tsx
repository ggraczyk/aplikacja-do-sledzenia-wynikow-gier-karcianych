import { Footer } from "@/components/Footer";
import { GameCodeGenerator } from "@/components/GameCodeGenerator";
import { GameView } from "@/components/GameView";
import { GamesList } from "@/components/GamesList";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

const queryClient = new QueryClient();

function AppContent() {
  const [currentGameCode, setCurrentGameCode] = useState<string | null>(null);

  if (currentGameCode) {
    return (
      <div className="min-h-screen felt-background">
        <GameView
          gameCode={currentGameCode}
          onBack={() => setCurrentGameCode(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen felt-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Śledzenie Wyników Gier Karcianych
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Śledź wyniki swoich gier w Canastę i Brydża. Graj parami NS/WE z
              automatycznym obliczaniem wyników.
            </p>
          </div>

          <Card className="card-table shadow-lg">
            <CardContent className="p-4 md:p-6">
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="create" className="text-xs md:text-sm">
                    Utwórz
                  </TabsTrigger>
                  <TabsTrigger value="games" className="text-xs md:text-sm">
                    Moje Gry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6">
                  <GameCodeGenerator onGameCreated={setCurrentGameCode} />
                </TabsContent>

                <TabsContent value="games" className="space-y-6">
                  <GamesList onGameSelected={setCurrentGameCode} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
