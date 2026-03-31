import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-card/60 backdrop-blur-sm" style={{ backgroundImage: 'url(/api/assets/header)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            {!logoFailed ? (
              <img
                src="/api/assets/logo"
                alt="StarfinPlugins"
                className="w-12 h-12 rounded-lg object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = "/starfinplugins.png";
                  setLogoFailed(true);
                }}
                loading="lazy"
              />
            ) : (
              <img
                src="/starfinplugins.png"
                alt="StarfinPlugins"
                className="w-12 h-12 rounded-lg object-contain"
                onError={() => {
                  setLogoFailed(true);
                }}
                loading="lazy"
              />
            )}
            <span className="text-foreground">StarfinPlugins</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/shop"
              className="text-foreground hover:text-primary transition"
            >
              Loja
            </Link>
            <Link
              to="/about"
              className="text-foreground hover:text-primary transition"
            >
              Sobre
            </Link>
            <Link
              to="/support"
              className="text-foreground hover:text-primary transition"
            >
              Suporte
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link to="/area-do-cliente" className="hidden sm:inline-block px-3 py-2 border border-border rounded-lg hover:bg-card-foreground/5 transition">
              Área do Cliente
            </Link>
            {user && (
              <Link to="/minha-conta" className="hidden sm:inline-block px-3 py-2 border border-border rounded-lg hover:bg-card-foreground/5 transition">
                Minha Conta
              </Link>
            )}
            <Link to="/cart" className="relative hover:text-primary transition">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center rounded-full">
                {items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                {user.role === "admin" && (
                  <Link to="/admin" className="px-3 py-2 border border-border rounded-lg hover:bg-card-foreground/5 transition">
                    Admin
                  </Link>
                )}
                <span className="text-foreground">{user.username}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Entrar
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-foreground"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2 border-t border-border pt-4">
            <Link
              to="/shop"
              className="block text-foreground hover:text-primary transition py-2"
            >
              Loja
            </Link>
            <Link
              to="/about"
              className="block text-foreground hover:text-primary transition py-2"
            >
              Sobre
            </Link>
            <Link
              to="/support"
              className="block text-foreground hover:text-primary transition py-2"
            >
              Suporte
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/minha-conta" className="px-3 py-2 border border-border rounded-lg hover:bg-card-foreground/5 transition">
                  Minha Conta
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" className="px-3 py-2 border border-border rounded-lg hover:bg-card-foreground/5 transition">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Entrar
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
