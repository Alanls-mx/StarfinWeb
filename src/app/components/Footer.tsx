import { Github, Twitter, Youtube, Mail } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  const footerLinks = {
    produto: [
      { name: 'Plugins', to: '/plugins' },
      { name: 'Categorias', to: '/categories' },
      { name: 'Preços', to: '/plugins' },
      { name: 'Novidades', to: '/plugins' }
    ],
    empresa: [
      { name: 'Sobre Nós', to: '/docs' },
      { name: 'Blog', to: '/docs' },
      { name: 'Carreiras', to: '/support' },
      { name: 'Contato', to: '/support' }
    ],
    suporte: [
      { name: 'Documentação', to: '/docs' },
      { name: 'FAQ', to: '/support' },
      { name: 'Suporte', to: '/support' },
      { name: 'API', to: '/docs#api' }
    ],
    legal: [
      { name: 'Termos de Uso', to: '/docs' },
      { name: 'Privacidade', to: '/docs' },
      { name: 'Licenças', to: '/docs' },
      { name: 'Cookies', to: '/docs' }
    ]
  };

  return (
    <footer className="relative bg-gradient-to-b from-[#0B0B0F] to-[#1A1A22] border-t border-[#7B2CBF]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF] rounded-lg flex items-center justify-center shadow-lg shadow-[#7B2CBF]/50">
                  <div className="w-6 h-6 border-2 border-white/90 rounded-sm" style={{
                    backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 75%, transparent 75%), linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 75%, transparent 75%)',
                    backgroundSize: '4px 4px',
                    backgroundPosition: '0 0, 2px 2px'
                  }}></div>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#C77DFF] to-white bg-clip-text text-transparent">
                StarfinPlugins
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              A plataforma líder em plugins premium para Minecraft. Eleve seu servidor com ferramentas profissionais.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Youtube, label: 'YouTube' },
                { icon: Mail, label: 'Email' }
              ].map((social, index) => (
                <button
                  key={index}
                  className="w-10 h-10 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#C77DFF] hover:border-[#7B2CBF]/50 hover:bg-[#7B2CBF]/10 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white mb-4 capitalize">{category}</h4>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.to}
                      className="text-gray-400 text-sm hover:text-[#C77DFF] transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-gradient-to-r from-[#7B2CBF]/10 to-[#3C096C]/10 border border-[#7B2CBF]/20 rounded-xl p-8 mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl mb-2">Fique por dentro das novidades</h3>
            <p className="text-gray-400 mb-6">
              Receba atualizações sobre novos plugins, promoções e dicas exclusivas
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 whitespace-nowrap">
                Inscrever-se
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#7B2CBF]/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © 2026 StarfinPlugins. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/status" className="text-gray-500 text-sm hover:text-[#C77DFF] transition-colors duration-300">
                Status do Sistema
              </Link>
              <Link to="/changelog" className="text-gray-500 text-sm hover:text-[#C77DFF] transition-colors duration-300">
                Changelog
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7B2CBF] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C77DFF] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
    </footer>
  );
}
