import React from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Tag, ArrowRight, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

export function BlogPage() {
  const posts = [
    {
      id: 1,
      title: 'O Guia Completo para Performance em Servidores Minecraft',
      category: 'Tutoriais',
      author: 'Lucas Mendes',
      date: '24 Mar 2024',
      image: 'https://images.unsplash.com/photo-1587573089734-09cb99c0a2b4?w=800&q=80',
      description: 'Descubra as melhores práticas de otimização de JVM e configurações para garantir que seu servidor rode sem lag.',
      icon: TrendingUp,
    },
    {
      id: 2,
      title: 'Novidades no Sistema de Licenças Starfin v2',
      category: 'Atualizações',
      author: 'Equipe Starfin',
      date: '18 Mar 2024',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
      description: 'Lançamos a nova versão do nosso sistema de licenças com validação em tempo real e maior segurança.',
      icon: ShieldCheck,
    },
    {
      id: 3,
      title: 'Por que o Kotlin está se tornando o padrão no desenvolvimento de plugins',
      category: 'Desenvolvimento',
      author: 'Roberto Silva',
      date: '10 Mar 2024',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      description: 'Kotlin traz modernidade e segurança para o desenvolvimento de plugins, saiba por que estamos migrando.',
      icon: Cpu,
    },
  ];

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
        >
          Blog & Novidades
        </motion.h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Fique por dentro de tutoriais, atualizações e insights sobre o desenvolvimento de servidores.
        </p>
      </div>

      {/* Featured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-3xl bg-[#13131A] border border-[#7B2CBF]/10 mb-6">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] to-transparent opacity-60" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-[#7B2CBF] rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                  {post.category}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {post.date}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#C77DFF] transition-colors leading-tight">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                {post.description}
              </p>
              <div className="flex items-center gap-2 text-[#C77DFF] font-bold text-sm group-hover:gap-4 transition-all pt-2">
                Ler mais <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Newsletter Section */}
      <div className="mt-24 p-12 bg-[#13131A] border border-[#7B2CBF]/10 rounded-3xl text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B2CBF]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Inscreva-se na nossa Newsletter</h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Receba as novidades, atualizações de plugins e promoções exclusivas direto na sua caixa de entrada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="seuemail@exemplo.com"
              className="flex-1 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B2CBF] transition-all"
            />
            <button className="bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#7B2CBF]/20">
              Inscrever-se
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-medium">Prometemos não enviar spam</p>
        </div>
      </div>
    </div>
  );
}
