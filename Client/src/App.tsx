import { Facebook, Github, MessageCircle } from "lucide-react";
import AudioUploader from "./AudioUpload";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      {/* Developer Credit Header */}
      <header className="mt-12 pt-6 border-t border-muted">
        <div className="flex items-center justify-center gap-5">
          <p className="text-sm text-muted-foreground">
            Developed by Mohamed Mohamud
          </p>
          
          <div className="flex items-center">
            <a
              href="https:/github.com/mohamed-tsx"
              target="_blank"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="https://wa.me/252619880131"
              target="_blank"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="https://www.facebook.com/mohammet122/"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>
      </header>
      <div className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold">
          Somali Dialect Detector
        </h1>
        <AudioUploader />
      </div>
    </main>
  );
}
