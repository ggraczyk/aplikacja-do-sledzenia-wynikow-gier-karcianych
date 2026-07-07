import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          © 2025. Stworzone z{" "}
          <Heart className="inline h-4 w-4 text-red-500 fill-current" />{" "}
          używając{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
