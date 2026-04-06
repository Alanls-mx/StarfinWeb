import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin, DollarSign, Clock, Users, ArrowRight, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { applyCareer, getPublicSettings, type CareerJob } from '../lib/api';

type CareerFormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  resumeUrl: string;
  message: string;
};

const defaultJobs: CareerJob[] = [
  {
    id: 'job_java_senior',
    title: 'Desenvolvedor Java Senior',
    location: 'Remoto',
    salary: 'A combinar',
    type: 'Tempo Integral',
    description: 'Responsavel pela arquitetura e desenvolvimento de plugins complexos de alta performance.',
    enabled: true
  },
  {
    id: 'job_ui_ux',
    title: 'Designer de UI/UX',
    location: 'Remoto',
    salary: 'A combinar',
    type: 'Tempo Integral',
    description: 'Criar interfaces modernas e intuitivas para nossos plugins e dashboard web.',
    enabled: true
  },
  {
    id: 'job_support',
    title: 'Suporte Tecnico',
    location: 'Remoto',
    salary: 'A combinar',
    type: 'Meio Periodo',
    description: 'Auxiliar clientes com instalacao e configuracao de plugins e licencas.',
    enabled: true
  }
];

function buildInitialForm(role: string): CareerFormState {
  return {
    name: '',
    email: '',
    phone: '',
    role,
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    message: ''
  };
}

export function CareersPage() {
  const [jobs, setJobs] = useState<CareerJob[]>(defaultJobs);
  const [hasLoadedRemoteJobs, setHasLoadedRemoteJobs] = useState(false);
  const talentPoolRole = 'Banco de Talentos';
  const availableRoles = useMemo(() => [talentPoolRole, ...jobs.map((job) => job.title)], [jobs]);
  const [isApplying, setIsApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CareerFormState>(buildInitialForm(talentPoolRole));

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (!Array.isArray(settings.careersJobs)) return;
        const nextJobs = settings.careersJobs.filter((job) => job.enabled);
        setJobs(nextJobs);
        setHasLoadedRemoteJobs(true);
      })
      .catch(() => null);
  }, []);

  const handleFieldChange = (field: keyof CareerFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openApplyModal = (role: string) => {
    setForm(buildInitialForm(role));
    setIsApplying(true);
  };

  const closeApplyModal = () => {
    if (submitting) return;
    setIsApplying(false);
  };

  const handleApplySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
      message: form.message.trim(),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.resumeUrl.trim() ? { resumeUrl: form.resumeUrl.trim() } : {}),
      ...(form.portfolioUrl.trim() ? { portfolioUrl: form.portfolioUrl.trim() } : {}),
      ...(form.linkedinUrl.trim() ? { linkedinUrl: form.linkedinUrl.trim() } : {}),
      ...(form.githubUrl.trim() ? { githubUrl: form.githubUrl.trim() } : {})
    };

    if (!payload.name || !payload.email || !payload.role || !payload.message) {
      toast.error('Preencha os campos obrigatorios para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      await applyCareer(payload);
      toast.success('Candidatura enviada com sucesso! Nossa equipe entrara em contato.');
      setIsApplying(false);
      setForm(buildInitialForm(talentPoolRole));
    } catch (error) {
      console.error(error);
      toast.error('Nao foi possivel enviar sua candidatura. Revise os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
        >
          Venha Criar o Futuro
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Estamos sempre em busca de talentos apaixonados por tecnologia e Minecraft para se juntarem ao nosso time.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {[
          { title: 'Trabalho 100% Remoto', icon: MapPin, desc: 'Trabalhe de onde voce se sentir mais produtivo.' },
          { title: 'Horarios Flexiveis', icon: Clock, desc: 'Organize seu tempo da forma que preferir.' },
          { title: 'Ambiente Inovador', icon: Users, desc: 'Trabalhe com as tecnologias mais modernas do mercado.' }
        ].map((perk, i) => (
          <motion.div
            key={perk.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-[#13131A] border border-[#7B2CBF]/10 rounded-3xl group hover:border-[#7B2CBF]/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <perk.icon className="w-6 h-6 text-[#C77DFF]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{perk.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{perk.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-10">Vagas Abertas</h2>
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-[#13131A] border border-[#7B2CBF]/10 rounded-3xl flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 hover:border-[#7B2CBF]/30 transition-all group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#7B2CBF]/10 border border-[#7B2CBF]/20 rounded-full text-[#C77DFF] text-xs font-bold uppercase tracking-wider">
                  {job.type}
                </span>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {job.location}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#C77DFF] transition-colors">{job.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{job.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-white font-bold mb-1 flex items-center gap-1 justify-end">
                  <DollarSign className="w-4 h-4 text-[#7B2CBF]" /> {job.salary}
                </div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Remuneracao Media</div>
              </div>
              <button
                type="button"
                onClick={() => openApplyModal(job.title)}
                className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Candidatar-se <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {hasLoadedRemoteJobs && jobs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#7B2CBF]/30 bg-[#13131A]/70 p-8 text-center text-gray-400">
            No momento nao temos vagas publicadas.
          </div>
        )}
      </div>

      <div className="mt-24 p-12 bg-gradient-to-b from-[#13131A] to-transparent border border-[#7B2CBF]/10 rounded-3xl text-center">
        <h3 className="text-2xl font-bold mb-4 text-white">Nao encontrou sua vaga?</h3>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto text-sm leading-relaxed">
          Sempre queremos conhecer pessoas talentosas. Mande seu curriculo para nosso banco de talentos e entraremos em contato assim que surgir uma oportunidade.
        </p>
        <button
          type="button"
          onClick={() => openApplyModal(talentPoolRole)}
          className="text-[#C77DFF] font-bold hover:text-white transition-colors underline underline-offset-8"
        >
          Enviar Curriculo para Banco de Talentos
        </button>
      </div>

      <AnimatePresence>
        {isApplying && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Fechar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeApplyModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#7B2CBF]/20 bg-[#13131A]/95 backdrop-blur">
                <h3 className="text-xl text-white font-bold">Candidatar-se</h3>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  disabled={submitting}
                  className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome completo *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => handleFieldChange('name', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">E-mail *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) => handleFieldChange('email', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="voce@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">WhatsApp / Telefone</label>
                    <input
                      value={form.phone}
                      onChange={(event) => handleFieldChange('phone', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Vaga de interesse *</label>
                    <select
                      required
                      value={form.role}
                      onChange={(event) => handleFieldChange('role', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">LinkedIn</label>
                    <input
                      type="url"
                      value={form.linkedinUrl}
                      onChange={(event) => handleFieldChange('linkedinUrl', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="https://linkedin.com/in/seu-perfil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">GitHub</label>
                    <input
                      type="url"
                      value={form.githubUrl}
                      onChange={(event) => handleFieldChange('githubUrl', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="https://github.com/seu-usuario"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Portfolio / Site</label>
                    <input
                      type="url"
                      value={form.portfolioUrl}
                      onChange={(event) => handleFieldChange('portfolioUrl', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="https://seuportfolio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Link do curriculo (PDF)</label>
                    <input
                      type="url"
                      value={form.resumeUrl}
                      onChange={(event) => handleFieldChange('resumeUrl', event.target.value)}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mensagem *</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(event) => handleFieldChange('message', event.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-32"
                    placeholder="Conte sua experiencia, principais resultados e por que quer fazer parte do time."
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={closeApplyModal}
                    disabled={submitting}
                    className="sm:flex-1 py-3 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:flex-1 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Enviando candidatura...' : 'Enviar candidatura'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
