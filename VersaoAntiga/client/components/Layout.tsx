import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">{children}</main>
      <Footer />
    </div>
  );
}
