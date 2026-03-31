import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">
              StarfinPlugins
            </h3>
            <p className="text-muted-foreground text-sm">
              O melhor lugar para encontrar e vender plugins do Minecraft.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Loja</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/shop" className="hover:text-primary transition">
                  Explorar Plugins
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=pagos"
                  className="hover:text-primary transition"
                >
                  Pagos
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=gratuitos"
                  className="hover:text-primary transition"
                >
                  Gratuitos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary transition">
                  Suporte
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition">
                  Termos de Serviço
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2024 StarfinPlugins. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
