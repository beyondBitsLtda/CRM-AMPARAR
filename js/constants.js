/* ============================================================
   AMPARAR CRM — js/constants.js   v2.0
   Beyond Bits Tecnologia © 2026
   ============================================================ */
'use strict';

const STAGE_ORDER = ['lead','ligacao','agendamento','visita','venda','carteira'];

const STAGE_CONFIG = {
  lead:        { label: 'Lead',         icon: '🌱', color: '#3B82F6', addLabel: '+ Novo Lead' },
  ligacao:     { label: 'Ligação',      icon: '📞', color: '#10B981', addLabel: '+ Registrar' },
  agendamento: { label: 'Agendamento',  icon: '📅', color: '#8B5CF6', addLabel: '+ Agendar'  },
  visita:      { label: 'Visita',       icon: '🏠', color: '#F59E0B', addLabel: '+ Visita'   },
  venda:       { label: 'Venda',        icon: '💰', color: '#1B6B3A', addLabel: '+ Venda'    },
  carteira:    { label: 'Carteira',     icon: '👛', color: '#4A5568', addLabel: ''            },
};

const TAG_CONFIG = {
  quente:  { cls: 'tag-quente',  label: '🔥 Quente'  },
  atencao: { cls: 'tag-atencao', label: '⚠️ Atenção' },
  novo:    { cls: 'tag-novo',    label: '🆕 Novo'     },
  delay:   { cls: 'tag-delay',   label: '⏳ Delay'    },
  vip:     { cls: 'tag-vip',     label: '⭐ VIP'      },
  ativo:   { cls: 'tag-ativo',   label: '✅ Ativo'    },
};

const CURRICULO_STATUS = {
  recebido:   { bg: '#F3F4F6', color: '#6B7280', label: '📥 Recebido'           },
  em_analise: { bg: '#FEF3C7', color: '#D97706', label: '⏳ Em Análise'         },
  entrevista: { bg: '#DBEAFE', color: '#2563EB', label: '📋 Entrevista Agendada' },
  aprovado:   { bg: '#D1FAE5', color: '#059669', label: '✅ Aprovado'            },
  reprovado:  { bg: '#FEE2E2', color: '#DC2626', label: '❌ Reprovado'           },
};

const PERFIL_CONFIG = {
  especialista: { cls: 'badge-especialista', label: 'Especialista' },
  supervisor:   { cls: 'badge-supervisor',   label: 'Supervisor'   },
  gerente:      { cls: 'badge-gerente',      label: 'Gerente'      },
};

const FONTES_LEAD = [
  { value: 'Carteira Amparar',            desc: 'Leads provenientes da carteira inativa da Amparar'          },
  { value: 'Inativo',                     desc: 'Clientes inativos que podem ser reativados'                 },
  { value: 'Associado Novo Veículo',      desc: 'Associado que adquiriu novo veículo'                        },
  { value: 'Cliente Potencial',           desc: 'Contato identificado como potencial cliente'                 },
  { value: 'Consultor que Saiu',          desc: 'Leads deixados por consultor que saiu da empresa'           },
  { value: 'Recomendação Associado',      desc: 'Indicação feita por associado ativo'                        },
  { value: 'Recomendação Não Associado',  desc: 'Indicação feita por não associado'                          },
  { value: 'Troca de Titularidade',       desc: 'Cliente que trocou a titularidade do veículo'               },
  { value: 'Projeto 150 X',               desc: 'Leads do Projeto 150 linha X'                               },
  { value: 'Projeto 150 Y',               desc: 'Leads do Projeto 150 linha Y'                               },
  { value: 'Internos',                    desc: 'Leads gerados internamente pela equipe'                      },
  { value: 'Site',                        desc: 'Leads captados pelo site da Amparar'                        },
  { value: 'Terceiros',                   desc: 'Leads originados de parceiros e terceiros'                   },
  { value: 'Redes Sociais',               desc: 'Captados via Instagram, Facebook, etc.'                     },
  { value: 'Externos',                    desc: 'Prospecção externa em eventos, ruas, etc.'                  },
  { value: 'Reciclagem',                  desc: 'Leads que voltaram ao funil após período sem contato'        },
  { value: 'Minha Carteira',              desc: 'Contatos da carteira pessoal do especialista'               },
];

const FILIAIS = [
  { id: 'matriz-es',  nome: 'Matriz',  local: 'Esmeraldas (ES)' },
  { id: 'belvedere',  nome: 'Belvedere', local: 'Esmeraldas (ES)' },
  { id: 'centro-es',  nome: 'Centro',  local: 'Esmeraldas (ES)' },
  { id: 'sjv',        nome: 'São José da Varginha', local: 'SJV' },
  { id: 'pequi',      nome: 'Pequi',   local: 'Pequi' },
];

const CATEGORIAS_VEICULO = [
  'Nacional Particular','Importado/Diesel','Nacional Trabalho','Motocicleta','Caminhão','Não sei'
];

const RESULTADO_LIGACAO_SEM_CONTATO = ['Não Atendeu','Número Errado','Pediu para Retornar'];
const RESULTADO_LIGACAO_CONTATO     = ['Não Agendou','Agendamento'];

/* --- Dados iniciais --- */
const INITIAL_LEADS = [
  { id:'AMP-2026-0043', nome:'Ana Rocha',       tel:'(48) 99821-4532', fonte:'Recomendação Associado',      captador:'Carlos Mendes', tags:['novo'],    etapa:'lead',        tentativas:0,  obs:'', placa:'', fipe:'', mensalidadeEst:'' },
  { id:'AMP-2026-0044', nome:'Roberto Neves',   tel:'(48) 99134-7823', fonte:'Site',                        captador:'Ana Beatriz',   tags:['atencao'], etapa:'lead',        tentativas:0,  obs:'', placa:'', fipe:'', mensalidadeEst:'' },
  { id:'AMP-2026-0040', nome:'Pedro Lima',      tel:'(48) 99721-3344', fonte:'Carteira Amparar',            captador:'Carlos Mendes', tags:['quente'],  etapa:'ligacao',     tentativas:5,  obs:'Cliente demonstrou interesse em cobertura para importado.', placa:'', fipe:'', mensalidadeEst:'R$ 189,00' },
  { id:'AMP-2026-0039', nome:'Lucas Ferreira',  tel:'(48) 98832-9910', fonte:'Inativo',                    captador:'Carlos Mendes', tags:[],          etapa:'ligacao',     tentativas:2,  obs:'', placa:'', fipe:'', mensalidadeEst:'' },
  { id:'AMP-2026-0037', nome:'Maria Costa',     tel:'(48) 99234-5566', fonte:'Redes Sociais',               captador:'Carlos Mendes', tags:['quente'],  etapa:'agendamento', tentativas:3,  obs:'Agendamento confirmado para 26/03.', placa:'', fipe:'', mensalidadeEst:'' },
  { id:'AMP-2026-0036', nome:'Sandra Oliveira', tel:'(48) 98877-4422', fonte:'Site',                        captador:'Ana Beatriz',   tags:[],          etapa:'agendamento', tentativas:2,  obs:'', placa:'', fipe:'', mensalidadeEst:'' },
  { id:'AMP-2026-0032', nome:'Carlos Melo',     tel:'(48) 99543-2211', fonte:'Carteira Amparar',            captador:'Carlos Mendes', tags:['delay'],   etapa:'visita',      tentativas:4,  obs:'Solicitou mais prazo.', placa:'ABC-1234', fipe:'R$ 42.000', mensalidadeEst:'' },
  { id:'AMP-2026-0029', nome:'Renata Souza',    tel:'(48) 98712-3399', fonte:'Minha Carteira',              captador:'Rodrigo Lopes', tags:[],          etapa:'visita',      tentativas:3,  obs:'', placa:'', fipe:'', mensalidadeEst:'' },
  { id:'AMP-2026-0015', nome:'João Silva',      tel:'(48) 99911-2233', fonte:'Recomendação Associado',      captador:'Carlos Mendes', tags:['ativo'],   etapa:'venda',       tentativas:6,  obs:'', placa:'DEF-5678', fipe:'R$ 58.000', mensalidadeEst:'' },
  { id:'AMP-2026-0010', nome:'Marcos Alves',    tel:'(48) 99387-1122', fonte:'Carteira Amparar',            captador:'Carlos Mendes', tags:['ativo'],   etapa:'carteira',    tentativas:0,  obs:'', placa:'GHI-9012', fipe:'', mensalidadeEst:'', dataVenda:'2026-01-15', aniversario:'1985-03-28' },
  { id:'AMP-2026-0009', nome:'Priscila Gomes',  tel:'(48) 98865-7744', fonte:'Inativo',                    captador:'Ana Beatriz',   tags:[],          etapa:'carteira',    tentativas:0,  obs:'', placa:'', fipe:'', mensalidadeEst:'', dataVenda:'2026-02-10', aniversario:'1990-03-30' },
];

const INITIAL_CURRICULOS = [
  { id:1, nome:'Thiago Barbosa', cargo:'Consultor Comercial', email:'thiago@email.com', tel:'(48) 99123-4567', exp:5, status:'em_analise',  obs:'', nascimento:'1995-05-10', endereco:'Rua A, 100', sexo:'M', cnh:true,  nota:null },
  { id:2, nome:'Letícia Nunes',  cargo:'Atendimento',         email:'leticia@email.com', tel:'(48) 98765-4321', exp:2, status:'aprovado',    obs:'Ótima comunicação.', nascimento:'1998-08-20', endereco:'Av. B, 200', sexo:'F', cnh:false, nota:8   },
  { id:3, nome:'Rafael Cunha',   cargo:'Vendas',              email:'rafael@email.com',  tel:'(48) 99456-7890', exp:3, status:'reprovado',   obs:'Sem disponibilidade.', nascimento:'1993-11-05', endereco:'Rua C, 50', sexo:'M', cnh:true,  nota:5   },
];

const INITIAL_USUARIOS = [
  { nome:'Carlos Mendes',   sigla:'CM', filial:'Matriz',            perfil:'especialista', status:'ativo', meta_mensalidade: 2448.60, meta_vendas: 14, email:'carlos@amparar.com.br' },
  { nome:'Ana Beatriz',     sigla:'AB', filial:'Centro',            perfil:'especialista', status:'ativo', meta_mensalidade: 2448.60, meta_vendas: 14, email:'ana@amparar.com.br'    },
  { nome:'Rodrigo Lopes',   sigla:'RL', filial:'São José da Varginha', perfil:'especialista', status:'ativo', meta_mensalidade: 2000, meta_vendas: 12, email:'rodrigo@amparar.com.br' },
  { nome:'Fernanda Costa',  sigla:'FC', filial:'Matriz',            perfil:'supervisor',   status:'ativo', meta_mensalidade: 0,       meta_vendas: 0,  email:'fernanda@amparar.com.br'},
  { nome:'Ricardo Almeida', sigla:'RA', filial:'Todas',             perfil:'gerente',      status:'ativo', meta_mensalidade: 0,       meta_vendas: 0,  email:'ricardo@amparar.com.br' },
];

const INITIAL_ATIVIDADES = [
  { icon:'📞', bg:'#D1FAE5', color:'#059669', nome:'João Silva',   det:'Ligação • Resultado: Agendamento • (48) 99911-2233', hora:'09:42', data:'25/03/26', esp:'Carlos Mendes', tipo:'ligacao'     },
  { icon:'📅', bg:'#DBEAFE', color:'#2563EB', nome:'Maria Costa',  det:'Agendamento • 26/03 às 14h • Local: Interno',        hora:'10:15', data:'25/03/26', esp:'Carlos Mendes', tipo:'agendamento' },
  { icon:'📞', bg:'#FEF3C7', color:'#D97706', nome:'Pedro Lima',   det:'Ligação • Não atendeu • Tentativa #5',               hora:'10:52', data:'25/03/26', esp:'Carlos Mendes', tipo:'ligacao'     },
  { icon:'🏠', bg:'#EDE9FE', color:'#7C3AED', nome:'Carlos Melo',  det:'Visita • Resultado: Delay',                          hora:'13:20', data:'25/03/26', esp:'Carlos Mendes', tipo:'visita'      },
  { icon:'💰', bg:'#D1FAE5', color:'#059669', nome:'João Silva',   det:'Venda • Nacional Particular • R$189/mês',            hora:'14:45', data:'24/03/26', esp:'Carlos Mendes', tipo:'venda'       },
  { icon:'👛', bg:'#F3F4F6', color:'#6B7280', nome:'Marcos Alves', det:'Carteira • Pedido de recomendações',                 hora:'16:00', data:'24/03/26', esp:'Carlos Mendes', tipo:'carteira'    },
];

const AGENDA_DATA = {
  'Seg':{ '08:00':[], '09:00':['VR','LM'], '10:00':['NB'], '11:00':['KP','NB'], '12:00':['KP'], '13:00':['LM'], '14:00':['IE'], '15:00':['LM'], '16:00':['KP'], '17:00':['KP'], '18:00':['DE'], '19:00':['MM'] },
  'Ter':{ '08:00':['MM'], '09:00':['VR','LM'], '10:00':['NB'], '11:00':['KP','NB'], '12:00':['KP'], '13:00':['IE'], '14:00':['LM'], '15:00':['NB','MM'], '16:00':['LM'], '17:00':['KP','NB'], '18:00':['KP'], '19:00':['VR'] },
  'Qua':{ '08:00':['DE'], '09:00':['LM'], '10:00':['IE'], '11:00':['NB','IE'], '12:00':['KP','VR'], '13:00':['LM'], '14:00':['KP','MM'], '15:00':['DE'], '16:00':['NB'], '17:00':['SA'], '18:00':['SA'], '19:00':['MM'] },
  'Qui':{ '08:00':['KP'], '09:00':['LM','VR'], '10:00':['KP','IE'], '11:00':['SA'], '12:00':['NB','MM'], '13:00':['SA'], '14:00':['IE'], '15:00':['IE','MM'], '16:00':['VR'], '17:00':['NB','IE'], '18:00':['MM','VR'], '19:00':['KP'] },
  'Sex':{ '08:00':['KP'], '09:00':['SA'], '10:00':['LM','MM'], '11:00':['IE'], '12:00':['DE'], '13:00':['LM'], '14:00':['DE','LM'], '15:00':['NB'], '16:00':['VR','NB'], '17:00':['NB'], '18:00':['LM'], '19:00':[] },
  'Sáb':{ '08:00':[], '09:00':['IE'], '10:00':[], '11:00':['NB'], '12:00':['IE'], '13:00':['NB'], '14:00':[], '15:00':['MM'], '16:00':[], '17:00':[], '18:00':[], '19:00':[] },
  'Dom':{ '08:00':[], '09:00':[], '10:00':[], '11:00':[], '12:00':[], '13:00':[], '14:00':[], '15:00':[], '16:00':[], '17:00':[], '18:00':[], '19:00':[] },
};

const AUDIT_LOG = [
  { usuario:'Carlos Mendes',  campo:'Etapa (AMP-2026-0015)', anterior:'Visita',   novo:'Venda',       datahora:'25/03/26 14:45' },
  { usuario:'Ana Beatriz',    campo:'Etapa (AMP-2026-0036)', anterior:'Ligação',  novo:'Agendamento', datahora:'25/03/26 11:22' },
  { usuario:'Carlos Mendes',  campo:'Tag (AMP-2026-0040)',   anterior:'—',        novo:'Quente',      datahora:'25/03/26 10:55' },
];
