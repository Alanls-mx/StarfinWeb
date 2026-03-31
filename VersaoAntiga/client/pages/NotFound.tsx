import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {}, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
          <p className="text-2xl font-bold mb-4">Página não encontrada</p>
          <p className="text-lg text-muted-foreground mb-8">
            Desculpe, a página que você está procurando não existe.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold"
          >
            Voltar à Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
