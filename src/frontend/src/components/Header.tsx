import { Button } from "@/components/ui/button";
import { useDownloadSourceCode } from "@/hooks/useQueries";
import { Download, Loader2, Moon, Spade, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function Header() {
  const { theme, setTheme } = useTheme();
  const downloadMutation = useDownloadSourceCode();

  const handleDownloadSource = async () => {
    try {
      const sourceCode = await downloadMutation.mutateAsync();

      // Create a blob with the source code content
      const blob = new Blob([sourceCode], { type: "application/zip" });
      const url = URL.createObjectURL(blob);

      // Create a temporary download link
      const link = document.createElement("a");
      link.href = url;
      link.download = "gry-karciane-source.zip";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Kod źródłowy został pobrany!");
    } catch (error) {
      toast.error("Błąd podczas pobierania kodu źródłowego");
      console.error("Download error:", error);
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Spade className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Gry Karciane
              </h1>
              <p className="text-sm text-muted-foreground">Śledzenie wyników</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSource}
              disabled={downloadMutation.isPending}
              className="hidden sm:flex"
            >
              {downloadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadMutation.isPending ? "Pobieranie..." : "Pobierz Kod"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadSource}
              disabled={downloadMutation.isPending}
              className="sm:hidden"
              title="Pobierz kod źródłowy"
            >
              {downloadMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Przełącz motyw</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
