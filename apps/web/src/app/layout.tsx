import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <ToastProvider>
          <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]">
            <div className="zellige-pattern h-full w-full" />
          </div>
          <main className="relative z-10">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
