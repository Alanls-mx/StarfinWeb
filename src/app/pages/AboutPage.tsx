import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Target, Rocket, Shield, Heart, Zap } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getPublicSettings, type TeamMemberProfile } from '../lib/api';

const defaultTeamMembers: TeamMemberProfile[] = [
  {
    id: 'team_ana',
    name: 'Ana Ribeiro',
    role: 'Head de Produto',
    bio: 'Define o roadmap dos plugins e garante que cada lancamento resolva dores reais dos donos de servidores.',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    skills: ['Produto', 'UX', 'Metricas']
  },
  {
    id: 'team_lucas',
    name: 'Lucas Fernandes',
    role: 'Tech Lead Backend',
    bio: 'Lidera a arquitetura dos sistemas criticos com foco em estabilidade, baixa latencia e escalabilidade.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    skills: ['Java', 'APIs', 'Performance']
  },
  {
    id: 'team_marina',
    name: 'Marina Costa',
    role: 'Especialista em Sucesso do Cliente',
    bio: 'Acompanha servidores parceiros de ponta a ponta para acelerar adocao e retencao dos plugins.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    skills: ['Onboarding', 'Suporte', 'Retencao']
  },
  {
    id: 'team_rafael',
    name: 'Rafael Nogueira',
    role: 'Designer UI/UX',
    bio: 'Transforma fluxos complexos em interfaces claras, mantendo consistencia visual em toda a plataforma.',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    skills: ['Design System', 'Pesquisa', 'Prototipacao']
  }
];

export function AboutPage() {
  const stats = [
    { label: 'Clientes Ativos', value: '10.000+', icon: Users },
    { label: 'Plugins Criados', value: '50+', icon: Zap },
    { label: 'Anos de Experiencia', value: '5+', icon: Rocket },
    { label: 'Suporte 24/7', value: '100%', icon: Shield }
  ];

  const values = [
    {
      title: 'Inovacao',
      description: 'Sempre buscando tecnologias recentes para oferecer performance maxima.',
      icon: Zap
    },
    {
      title: 'Comunidade',
      description: 'Nossos clientes sao o coracao de tudo que fazemos. Ouvimos e evoluimos juntos.',
      icon: Heart
    },
    {
      title: 'Qualidade',
      description: 'Codigo limpo, otimizado e testado antes de cada lancamento.',
      icon: Target
    }
  ];

  const [teamMembers, setTeamMembers] = useState<TeamMemberProfile[]>(defaultTeamMembers);

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (Array.isArray(settings.aboutTeam)) {
          setTeamMembers(settings.aboutTeam);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
        >
          Nossa Historia
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed"
        >
          A StarfinPlugins nasceu da paixao por criar experiencias unicas em servidores de Minecraft. O que comecou como
          pequenos scripts para amigos evoluiu para uma das maiores lojas de plugins do mercado.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl text-center group hover:border-[#7B2CBF]/30 transition-all"
          >
            <stat.icon className="w-8 h-8 text-[#7B2CBF] mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
        <div>
          <h2 className="text-3xl font-bold mb-6">Nossa Missao</h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            Nossa missao e fornecer ferramentas poderosas e intuitivas que permitam aos donos de servidores focarem no
            que realmente importa: criar diversao para seus jogadores.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Acreditamos que a tecnologia nao deve ser um obstaculo, mas sim uma ponte para a criatividade. Por isso,
            cada linha de codigo e pensada na facilidade de uso e na performance.
          </p>
        </div>
        <div className="grid gap-6">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center flex-shrink-0">
                <value.icon className="w-6 h-6 text-[#C77DFF]" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Nossa Equipe</h2>
            <p className="text-gray-400 mt-2">Profissionais dedicados a entregar produtos estaveis, uteis e com alto padrao tecnico.</p>
          </div>
          <span className="text-xs uppercase tracking-wider text-[#C77DFF] bg-[#7B2CBF]/15 border border-[#7B2CBF]/25 px-3 py-1 rounded-full w-fit">
            Time multidisciplinar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {teamMembers.map((member, i) => (
            <motion.article
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl overflow-hidden hover:border-[#7B2CBF]/30 transition-all group"
            >
              <div className="relative h-60 overflow-hidden">
                <ImageWithFallback
                  src={member.imageUrl}
                  alt={`Foto de ${member.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-white">{member.name}</h3>
                <p className="text-[#C77DFF] text-sm font-semibold mt-1">{member.role}</p>
                <p className="text-sm text-gray-400 leading-relaxed mt-3">{member.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 text-xs text-gray-300 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
