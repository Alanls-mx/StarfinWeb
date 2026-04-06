import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminGetSettings, adminSaveSettings, type CareerJob, type TeamMemberProfile } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeJobs(jobs: CareerJob[]) {
  return jobs.map((job) => ({
    ...job,
    id: job.id?.trim() || createId('job'),
    title: job.title.trim(),
    location: job.location.trim(),
    salary: job.salary.trim(),
    type: job.type.trim(),
    description: job.description.trim(),
    enabled: Boolean(job.enabled)
  }));
}

function normalizeTeam(team: TeamMemberProfile[]) {
  return team.map((member) => ({
    ...member,
    id: member.id?.trim() || createId('team'),
    name: member.name.trim(),
    role: member.role.trim(),
    bio: member.bio.trim(),
    imageUrl: member.imageUrl.trim(),
    skills: member.skills.map((skill) => skill.trim()).filter(Boolean)
  }));
}

export function AdminContentPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [team, setTeam] = useState<TeamMemberProfile[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminGetSettings(token)
      .then((settings) => {
        setJobs(settings.careersJobs ?? []);
        setTeam(settings.aboutTeam ?? []);
      })
      .catch((error) => {
        console.error(error);
        toast.error('Nao foi possivel carregar os dados de conteudo.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const addJob = () => {
    setJobs((prev) => [
      ...prev,
      {
        id: createId('job'),
        title: '',
        location: 'Remoto',
        salary: 'A combinar',
        type: 'Tempo Integral',
        description: '',
        enabled: true
      }
    ]);
  };

  const addMember = () => {
    setTeam((prev) => [
      ...prev,
      {
        id: createId('team'),
        name: '',
        role: '',
        bio: '',
        imageUrl: '',
        skills: []
      }
    ]);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const nextJobs = normalizeJobs(jobs);
      const nextTeam = normalizeTeam(team);
      await adminSaveSettings(token, {
        careersJobs: nextJobs,
        aboutTeam: nextTeam
      });
      setJobs(nextJobs);
      setTeam(nextTeam);
      toast.success('Conteudo salvo com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar conteudo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Conteudo do Site</h1>
        <p className="text-gray-400">Edite vagas de carreiras e informacoes da equipe exibidas nas paginas publicas.</p>
      </div>

      <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Vagas de Carreira</h2>
            <p className="text-gray-500 text-sm mt-1">Voce pode ativar/desativar vagas e editar todos os textos.</p>
          </div>
          <button
            type="button"
            onClick={addJob}
            className="px-4 py-2 bg-[#7B2CBF]/20 border border-[#7B2CBF]/30 rounded-xl text-[#C77DFF] hover:bg-[#7B2CBF]/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova vaga
          </button>
        </div>

        <div className="space-y-4">
          {jobs.map((job, index) => (
            <div key={job.id} className="p-5 rounded-xl border border-[#7B2CBF]/15 bg-[#0B0B0F]/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 font-medium">Vaga #{index + 1}</div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-400">Ativa</label>
                  <button
                    type="button"
                    onClick={() =>
                      setJobs((prev) => prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)))
                    }
                    className={`w-12 h-6 rounded-full transition-all relative ${job.enabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${job.enabled ? 'left-7' : 'left-1'}`}></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobs((prev) => prev.filter((_, i) => i !== index))}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={job.title}
                  onChange={(event) =>
                    setJobs((prev) => prev.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))
                  }
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                  placeholder="Titulo da vaga"
                />
                <input
                  value={job.type}
                  onChange={(event) =>
                    setJobs((prev) => prev.map((item, i) => (i === index ? { ...item, type: event.target.value } : item)))
                  }
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                  placeholder="Tipo (Tempo Integral, Meio Periodo...)"
                />
                <input
                  value={job.location}
                  onChange={(event) =>
                    setJobs((prev) => prev.map((item, i) => (i === index ? { ...item, location: event.target.value } : item)))
                  }
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                  placeholder="Localizacao"
                />
                <input
                  value={job.salary}
                  onChange={(event) =>
                    setJobs((prev) => prev.map((item, i) => (i === index ? { ...item, salary: event.target.value } : item)))
                  }
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                  placeholder="Faixa salarial"
                />
              </div>
              <textarea
                value={job.description}
                onChange={(event) =>
                  setJobs((prev) => prev.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)))
                }
                className="w-full px-4 py-3 min-h-24 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                placeholder="Descricao da vaga"
              />
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="text-gray-500 text-sm p-6 border border-dashed border-[#7B2CBF]/20 rounded-xl text-center">
              Nenhuma vaga cadastrada.
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Equipe (Pagina Sobre)</h2>
            <p className="text-gray-500 text-sm mt-1">Atualize nome, cargo, foto e descricao dos membros.</p>
          </div>
          <button
            type="button"
            onClick={addMember}
            className="px-4 py-2 bg-[#7B2CBF]/20 border border-[#7B2CBF]/30 rounded-xl text-[#C77DFF] hover:bg-[#7B2CBF]/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo membro
          </button>
        </div>

        <div className="space-y-4">
          {team.map((member, index) => (
            <div key={member.id} className="p-5 rounded-xl border border-[#7B2CBF]/15 bg-[#0B0B0F]/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 font-medium">Membro #{index + 1}</div>
                <button
                  type="button"
                  onClick={() => setTeam((prev) => prev.filter((_, i) => i !== index))}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={member.name}
                  onChange={(event) =>
                    setTeam((prev) => prev.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))
                  }
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                  placeholder="Nome"
                />
                <input
                  value={member.role}
                  onChange={(event) =>
                    setTeam((prev) => prev.map((item, i) => (i === index ? { ...item, role: event.target.value } : item)))
                  }
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                  placeholder="Cargo"
                />
              </div>

              <input
                value={member.imageUrl}
                onChange={(event) =>
                  setTeam((prev) => prev.map((item, i) => (i === index ? { ...item, imageUrl: event.target.value } : item)))
                }
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                placeholder="URL da foto"
              />

              <textarea
                value={member.bio}
                onChange={(event) =>
                  setTeam((prev) => prev.map((item, i) => (i === index ? { ...item, bio: event.target.value } : item)))
                }
                className="w-full px-4 py-3 min-h-24 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                placeholder="Descricao"
              />

              <input
                value={member.skills.join(', ')}
                onChange={(event) =>
                  setTeam((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            skills: event.target.value
                              .split(',')
                              .map((skill) => skill.trim())
                              .filter(Boolean)
                          }
                        : item
                    )
                  )
                }
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
                placeholder="Skills separadas por virgula"
              />
            </div>
          ))}
          {team.length === 0 && (
            <div className="text-gray-500 text-sm p-6 border border-dashed border-[#7B2CBF]/20 rounded-xl text-center">
              Nenhum membro cadastrado.
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-10 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/40 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Conteudo'}
        </button>
      </div>
    </div>
  );
}
