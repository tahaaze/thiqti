import { ToastProvider } from "@/components/Toast";
import ChatWidgetClient from "@/components/ChatWidgetClient";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#eef1fb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <ToastProvider>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#6d5dfc]/20 blur-[120px]" />
            <div className="absolute -right-32 top-1/4 h-[460px] w-[460px] rounded-full bg-[#22a9f0]/20 blur-[120px]" />
            <div className="absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-[#f0a8ff]/15 blur-[130px]" />
          </div>
          <main className="relative z-10">{children}</main>
          <ChatWidgetClient />
        </ToastProvider>
      </body>
    </html>
  );
}
