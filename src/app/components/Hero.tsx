import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0F] via-[#1A1A22] to-[#0B0B0F]">
        {/* Particle Effect */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at center, transparent 0%, #0B0B0F 100%),
                           radial-gradient(2px 2px at 20% 30%, #7B2CBF 1px, transparent 1px),
                           radial-gradient(2px 2px at 60% 70%, #C77DFF 1px, transparent 1px),
                           radial-gradient(1px 1px at 50% 50%, #7B2CBF 1px, transparent 1px),
                           radial-gradient(1px 1px at 80% 10%, #9D4EDD 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 200px 200px, 150px 150px, 100px 100px, 250px 250px',
          backgroundPosition: 'center, 0 0, 40px 60px, 130px 270px, 70px 100px',
          animation: 'particle-float 20s ease-in-out infinite'
        }}></div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7B2CBF] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C77DFF] rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/30 rounded-full mb-8 group hover:border-[#C77DFF]/50 transition-all duration-300">
          <Sparkles className="w-4 h-4 text-[#C77DFF] group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-sm text-gray-300">Mais de 500+ plugins premium</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-white via-[#C77DFF] to-white bg-clip-text text-transparent animate-gradient">
          Plugins profissionais para elevar seu servidor Minecraft
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Descubra plugins de alta qualidade, otimizados para desempenho e construídos por desenvolvedores experientes. Transforme seu servidor com ferramentas profissionais.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            onClick={() => navigate('/plugins')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="group relative px-8 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl overflow-hidden transition-all duration-300"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C77DFF] to-[#7B2CBF] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>

            <span className="relative flex items-center gap-2">
              Ver Plugins
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </motion.button>

          <motion.button
            onClick={() => navigate('/account')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-transparent border-2 border-[#7B2CBF] text-white rounded-xl hover:bg-[#7B2CBF]/10 hover:border-[#C77DFF] hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all duration-300"
          >
            Criar Conta
          </motion.button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { number: '500+', label: 'Plugins Premium' },
            { number: '50K+', label: 'Servidores Ativos' },
            { number: '4.9/5', label: 'Avaliação Média' },
            { number: '24/7', label: 'Suporte' }
          ].map((stat, index) => (
            <div
              key={index}
              className="p-6 bg-[#1A1A22]/40 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl hover:border-[#7B2CBF]/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl font-bold text-[#C77DFF] mb-2">{stat.number}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
