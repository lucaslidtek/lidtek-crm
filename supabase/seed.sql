-- ============================================
-- SEED DATA — Lidtek CRM & Gestão de Projetos
-- Converte mock data (mockUsers, mockLeads, mockProjects, mockTasks) para SQL
-- ============================================

-- ============================================
-- UUID MAPPING
-- ============================================
-- Users:  user-1 → 00000000-0000-4000-a000-000000000001 ... user-7 → ...000007
-- Leads:  lead-1 → 10000000-0000-4000-a000-000000000001 ... lead-12, lead-won-1..6
-- Projects: proj-1 → 20000000-0000-4000-a000-000000000001 ... proj-8
-- Sprints: spr-XX → 30000000-0000-4000-a000-0000000000XX
-- Tasks: task-pN → 40000000-0000-4000-a000-0000000000p1..p8, task-sN → ...s1..s6, task-aN → ...a1..a6
-- Interactions: int-N → 50000000-0000-4000-a000-00000000000N

-- ============================================
-- 1. PROFILES (sem FK para auth.users — dados de demo)
-- ============================================
-- Nota: Estes profiles NÃO têm um auth.users correspondente.
-- Para funcionar sem a FK, inserimos diretamente.
-- Com RLS desabilitado e sem enforce de FK para demo data,
-- precisamos temporariamente dropar a FK, inserir, e re-adicionar.

-- Temporariamente desabilitar a FK de profiles → auth.users
alter table profiles drop constraint if exists profiles_id_fkey;

insert into profiles (id, name, email, role, initials, phone, position, status) values
  ('00000000-0000-4000-a000-000000000001', 'Lucas Ribeiro',    'lucas@lidtek.com',   'admin',        'LR', '(11) 99999-1234', 'CEO & Fundador',            'active'),
  ('00000000-0000-4000-a000-000000000002', 'Ana Torres',       'ana@lidtek.com',     'manager',      'AT', '(11) 98765-4321', 'Gerente de Projetos',       'active'),
  ('00000000-0000-4000-a000-000000000003', 'Rafael Mendes',    'rafael@lidtek.com',  'manager',      'RM', '(11) 91234-5678', 'Gestor Comercial',          'active'),
  ('00000000-0000-4000-a000-000000000004', 'Marina Costa',     'marina@lidtek.com',  'collaborator', 'MC', '(11) 97654-3210', 'Desenvolvedora Full Stack', 'active'),
  ('00000000-0000-4000-a000-000000000005', 'Pedro Alves',      'pedro@lidtek.com',   'collaborator', 'PA', null,              'Desenvolvedor Front-end',   'active'),
  ('00000000-0000-4000-a000-000000000006', 'Camila Santos',    'camila@lidtek.com',  'collaborator', 'CS', '(11) 94567-8901', 'Designer UI/UX',            'active'),
  ('00000000-0000-4000-a000-000000000007', 'Thiago Ferreira',  'thiago@lidtek.com',  'readonly',     'TF', null,              'Consultor Externo',         'inactive')
on conflict (id) do nothing;

-- ============================================
-- 2. LEADS
-- ============================================
insert into leads (id, name, contact, phone, origin, owner_id, notes, stage, next_contact_date, estimated_value, billing_type, billing_cycle, solution_type, loss_reason, created_at, updated_at) values
  -- Prospecção (3)
  ('10000000-0000-4000-a000-000000000001', 'Grupo Vértice',           'carlos@grupovertice.com.br',          null, 'LinkedIn',  '00000000-0000-4000-a000-000000000002', 'Empresa de logística, 200 funcionários. Precisa de sistema de gestão de frotas.', 'prospecting',    now() + interval '2 days',  45000, 'recurring', 'monthly', null, null, now() - interval '5 days', now() - interval '3 days'),
  ('10000000-0000-4000-a000-000000000002', 'Clínica Saúde+',          'dra.lucia@saudemais.com.br',          null, 'Indicação', '00000000-0000-4000-a000-000000000002', 'Rede de clínicas, 3 unidades. Quer prontuário eletrônico integrado.',              'prospecting',    null,                       32000, 'one_time',  null,      null, null, now() - interval '1 day',  now() - interval '1 day'),
  ('10000000-0000-4000-a000-000000000003', 'Construtora Horizonte',   'pedro@horizonteconstrucoes.com.br',   null, 'Site',      '00000000-0000-4000-a000-000000000001', 'Veio pelo site. Precisa de app para gestão de obras.',                             'prospecting',    now() - interval '1 day',   60000, 'one_time',  null,      null, null, now() - interval '6 days', now() - interval '4 days'),
  -- 1ª Reunião (2)
  ('10000000-0000-4000-a000-000000000004', 'Farmácia Popular Rede',   'joao@farmaciapopular.com.br',         null, 'Indicação', '00000000-0000-4000-a000-000000000002', 'Rede de 12 farmácias. Quer sistema de estoque e vendas. Reunião agendada para próxima semana.', 'first_meeting', now() + interval '5 days', 55000, 'recurring', 'monthly', null, null, now() - interval '8 days', now() - interval '2 days'),
  ('10000000-0000-4000-a000-000000000005', 'Escola Novo Saber',       'diretoria@novosaber.edu.br',          null, 'Evento',    '00000000-0000-4000-a000-000000000001', 'Conheceu a Lidtek no evento de tecnologia educacional. Quer plataforma de gestão escolar.', 'first_meeting', now() + interval '1 day', 28000, 'recurring', 'semiannual', null, null, now() - interval '10 days', now() - interval '1 day'),
  -- Briefing (2)
  ('10000000-0000-4000-a000-000000000006', 'Transportadora Rápida',   'marcos@transportadorarapida.com.br',  null, 'Google',    '00000000-0000-4000-a000-000000000002', 'Transportadora regional. Precisa de TMS simplificado.',                            'briefing',       now() + interval '3 days',  38000, 'recurring', 'monthly', 'Sistema web + app mobile', null, now() - interval '15 days', now() - interval '2 days'),
  ('10000000-0000-4000-a000-000000000007', 'Indústria Paraná',        'roberto@industriaparana.com.br',       null, 'Parceiro',  '00000000-0000-4000-a000-000000000001', 'Indústria metalúrgica, 500 funcionários. Quer ERP sob medida para controle de produção.', 'briefing', now() - interval '2 days', 80000, 'one_time', null, 'ERP customizado', null, now() - interval '20 days', now() - interval '2 days'),
  -- Proposta Enviada (2)
  ('10000000-0000-4000-a000-000000000008', 'Imobiliária Progresso',   'fernanda@imobprogresso.com.br',       null, 'Site',      '00000000-0000-4000-a000-000000000002', 'Imobiliária com 50 corretores. Quer CRM imobiliário + site de imóveis.',            'proposal_sent',  now() + interval '4 days',  42000, 'recurring', 'monthly', 'CRM + Website', null, now() - interval '25 days', now() - interval '3 days'),
  ('10000000-0000-4000-a000-000000000009', 'Restaurante Sabor & Arte','chef.maria@saborarte.com.br',         null, 'Indicação', '00000000-0000-4000-a000-000000000001', 'Rede de restaurantes, 5 unidades. Quer sistema de pedidos e delivery.',             'proposal_sent',  null,                       25000, 'one_time',  null,      'App delivery + painel admin', null, now() - interval '18 days', now() - interval '1 day'),
  -- Negociação (1)
  ('10000000-0000-4000-a000-000000000010', 'Agro Solutions',          'fernando@agrosolutions.com.br',       null, 'LinkedIn',  '00000000-0000-4000-a000-000000000002', 'Empresa de consultoria agrícola. Quer dashboard de monitoramento de safras.',       'negotiation',    now() + interval '1 day',   35000, 'recurring', 'annual',  'Dashboard web + integração IoT', null, now() - interval '30 days', now() - interval '1 day'),
  -- Contrato Enviado (1)
  ('10000000-0000-4000-a000-000000000011', 'Academia FitPro',         'paulo@fitpro.com.br',                 null, 'Google',    '00000000-0000-4000-a000-000000000001', 'Rede de academias, 8 unidades. Sistema de gestão de alunos e financeiro.',         'contract_sent',  now() + interval '2 days',  48000, 'recurring', 'monthly', 'SaaS gestão de academias', null, now() - interval '35 days', now() - interval '2 days'),
  -- Perdido (1)
  ('10000000-0000-4000-a000-000000000012', 'Editora Página Nova',     'julia@paginanova.com.br',             null, 'Evento',    '00000000-0000-4000-a000-000000000002', 'Editora independente. Queria plataforma de e-books.',                              'lost',           null,                       15000, null,        null,      null, 'Orçamento fora da realidade do cliente — optou por solução pronta mais barata.', now() - interval '40 days', now() - interval '5 days'),
  -- Contrato Assinado (6 — convertidos em projetos)
  ('10000000-0000-4000-a000-100000000001', 'Supermercado Central',           'gerencia@supcentral.com.br',          null, 'Indicação', '00000000-0000-4000-a000-000000000003', 'Sistema de gestão de estoque e PDV. Contrato recorrente assinado.',        'contract_signed', null, 36000, 'recurring', 'monthly', 'Sistema web PDV + Estoque', null, now() - interval '120 days', now() - interval '90 days'),
  ('10000000-0000-4000-a000-100000000002', 'Escritório Advocacia Silva & Prado','dr.silva@silvaprado.adv.br',      null, 'LinkedIn',  '00000000-0000-4000-a000-000000000003', 'Sistema de gestão processual e controle de prazos. Contrato recorrente.', 'contract_signed', null, 42000, 'recurring', 'monthly', 'Sistema jurídico web', null, now() - interval '70 days', now() - interval '50 days'),
  ('10000000-0000-4000-a000-100000000003', 'Hotel Vista Mar',                'reservas@vistamar.com.br',            null, 'Google',    '00000000-0000-4000-a000-000000000003', 'Sistema de reservas e check-in online. Projeto único.',                   'contract_signed', null, 55000, 'one_time',  null,      'App mobile + painel web', null, now() - interval '45 days', now() - interval '30 days'),
  ('10000000-0000-4000-a000-100000000004', 'Colégio Futuro Brilhante',       'direcao@futurobrilhante.edu.br',      null, 'Evento',    '00000000-0000-4000-a000-000000000004', 'Plataforma de gestão escolar completa. Projeto único.',                   'contract_signed', null, 48000, 'one_time',  null,      'Plataforma educacional web', null, now() - interval '80 days', now() - interval '60 days'),
  ('10000000-0000-4000-a000-100000000005', 'ONG Raízes do Bem',              'contato@raizesdobem.org.br',           null, 'Indicação', '00000000-0000-4000-a000-000000000004', 'Site institucional + sistema de doações. Projeto único.',                 'contract_signed', null, 22000, 'one_time',  null,      'Site + sistema de doações', null, now() - interval '35 days', now() - interval '25 days'),
  ('10000000-0000-4000-a000-100000000006', 'Cervejaria Artesanal Hop',       'contato@cervejariahop.com.br',        null, 'Site',      '00000000-0000-4000-a000-000000000003', 'E-commerce de cervejas artesanais. Projeto concluído.',                   'contract_signed', null, 30000, 'one_time',  null,      'E-commerce', null, now() - interval '130 days', now() - interval '20 days')
on conflict (id) do nothing;

-- ============================================
-- 3. INTERACTIONS
-- ============================================
insert into interactions (id, lead_id, type, content, date, user_id) values
  ('50000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'note',    'Primeiro contato via LinkedIn. Demonstrou interesse em automação.', now() - interval '3 days', '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000003', 'email',   'Enviado e-mail de apresentação da Lidtek.',                         now() - interval '4 days', '00000000-0000-4000-a000-000000000001'),
  ('50000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000004', 'call',    'Ligação de 20 min. Muito interessado, agendou reunião presencial.', now() - interval '2 days', '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000005', 'meeting', 'Primeira reunião realizada. Entendemos as dores: controle de notas, frequência e comunicação com pais.', now() - interval '1 day', '00000000-0000-4000-a000-000000000001'),
  ('50000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000006', 'meeting', 'Segunda reunião: levantamento detalhado de requisitos. Mapeamos 15 funcionalidades.', now() - interval '2 days', '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000006', 'note',    'Cliente prioriza rastreamento em tempo real.',                      now() - interval '2 days', '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000007', '10000000-0000-4000-a000-000000000007', 'meeting', 'Reunião de briefing. Escopo grande — produção, estoque, qualidade, RH.', now() - interval '5 days', '00000000-0000-4000-a000-000000000001'),
  ('50000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000007', 'email',   'Enviado questionário detalhado para mapeamento de processos.',      now() - interval '4 days', '00000000-0000-4000-a000-000000000001'),
  ('50000000-0000-4000-a000-000000000009', '10000000-0000-4000-a000-000000000008', 'email',   'Proposta comercial enviada. R$ 42.000 — 4 meses de desenvolvimento.', now() - interval '3 days', '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000010', '10000000-0000-4000-a000-000000000009', 'meeting', 'Apresentação da proposta. Cliente gostou, pediu ajuste no prazo.',   now() - interval '1 day',  '00000000-0000-4000-a000-000000000001'),
  ('50000000-0000-4000-a000-000000000011', '10000000-0000-4000-a000-000000000010', 'meeting', 'Negociação de valores. Cliente quer reduzir de R$35k para R$28k.',   now() - interval '1 day',  '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000012', '10000000-0000-4000-a000-000000000010', 'note',    'Possível ajuste: remover módulo IoT da fase 1 e reduzir para R$30k.', now() - interval '1 day', '00000000-0000-4000-a000-000000000002'),
  ('50000000-0000-4000-a000-000000000013', '10000000-0000-4000-a000-000000000011', 'email',   'Contrato enviado para assinatura. Prazo: 5 meses.',                 now() - interval '2 days', '00000000-0000-4000-a000-000000000001'),
  ('50000000-0000-4000-a000-000000000014', '10000000-0000-4000-a000-000000000012', 'note',    'Cliente informou que vai usar plataforma existente. Não tem budget para desenvolvimento custom.', now() - interval '5 days', '00000000-0000-4000-a000-000000000002'),
  -- Won leads interactions
  ('50000000-0000-4000-a000-000000000015', '10000000-0000-4000-a000-100000000001', 'meeting', 'Contrato assinado. Início do onboarding.', now() - interval '90 days',  '00000000-0000-4000-a000-000000000003'),
  ('50000000-0000-4000-a000-000000000016', '10000000-0000-4000-a000-100000000002', 'email',   'Contrato assinado digitalmente. Projeto iniciado.', now() - interval '50 days', '00000000-0000-4000-a000-000000000003'),
  ('50000000-0000-4000-a000-000000000017', '10000000-0000-4000-a000-100000000003', 'meeting', 'Fechamento após negociação. Projeto único com 4 meses de prazo.', now() - interval '30 days', '00000000-0000-4000-a000-000000000003'),
  ('50000000-0000-4000-a000-000000000018', '10000000-0000-4000-a000-100000000004', 'email',   'Contrato assinado. Deploy previsto para próxima semana.', now() - interval '60 days', '00000000-0000-4000-a000-000000000004'),
  ('50000000-0000-4000-a000-000000000019', '10000000-0000-4000-a000-100000000005', 'meeting', 'Contrato assinado após indicação. Desenvolvimento iniciado.', now() - interval '25 days', '00000000-0000-4000-a000-000000000004'),
  ('50000000-0000-4000-a000-000000000020', '10000000-0000-4000-a000-100000000006', 'note',    'Projeto entregue e aprovado pelo cliente.', now() - interval '20 days', '00000000-0000-4000-a000-000000000003')
on conflict (id) do nothing;

-- ============================================
-- 4. PROJECTS (sem current_sprint_id por enquanto — será atualizado após sprints)
-- ============================================
insert into projects (id, client_name, client_contact, client_phone, type, status, owner_id, next_delivery_date, lead_id, created_at, updated_at) values
  ('20000000-0000-4000-a000-000000000001', 'Supermercado Central',                  'gerencia@supcentral.com.br',     null, 'recurring', 'active',    '00000000-0000-4000-a000-000000000003', now() + interval '5 days',  '10000000-0000-4000-a000-100000000001', now() - interval '90 days',  now() - interval '1 day'),
  ('20000000-0000-4000-a000-000000000002', 'Escritório Advocacia Silva & Prado',    'dr.silva@silvaprado.adv.br',     null, 'recurring', 'active',    '00000000-0000-4000-a000-000000000003', now() + interval '3 days',  '10000000-0000-4000-a000-100000000002', now() - interval '50 days',  now() - interval '2 days'),
  ('20000000-0000-4000-a000-000000000003', 'Clínica Bem Estar',                     'admin@bemestar.med.br',          null, 'recurring', 'active',    '00000000-0000-4000-a000-000000000004', now() + interval '8 days',  null,                                   now() - interval '35 days',  now() - interval '1 day'),
  ('20000000-0000-4000-a000-000000000004', 'Distribuidora Norte',                   'compras@distnorte.com.br',       null, 'recurring', 'paused',    '00000000-0000-4000-a000-000000000003', null,                       null,                                   now() - interval '40 days',  now() - interval '15 days'),
  ('20000000-0000-4000-a000-000000000005', 'ONG Raízes do Bem',                     'contato@raizesdobem.org.br',     null, 'oneshot',   'active',    '00000000-0000-4000-a000-000000000004', now() + interval '12 days', '10000000-0000-4000-a000-100000000005', now() - interval '25 days',  now() - interval '3 days'),
  ('20000000-0000-4000-a000-000000000006', 'Hotel Vista Mar',                       'reservas@vistamar.com.br',       null, 'oneshot',   'active',    '00000000-0000-4000-a000-000000000003', now() + interval '2 days',  '10000000-0000-4000-a000-100000000003', now() - interval '30 days',  now() - interval '1 day'),
  ('20000000-0000-4000-a000-000000000007', 'Colégio Futuro Brilhante',              'direcao@futurobrilhante.edu.br', null, 'oneshot',   'active',    '00000000-0000-4000-a000-000000000004', now() + interval '1 day',   '10000000-0000-4000-a000-100000000004', now() - interval '60 days',  now() - interval '1 day'),
  ('20000000-0000-4000-a000-000000000008', 'Cervejaria Artesanal Hop',              'contato@cervejariahop.com.br',   null, 'oneshot',   'completed', '00000000-0000-4000-a000-000000000003', null,                       '10000000-0000-4000-a000-100000000006', now() - interval '120 days', now() - interval '20 days')
on conflict (id) do nothing;

-- ============================================
-- 5. SPRINTS
-- ============================================
insert into sprints (id, project_id, name, stage, start_date, end_date, status) values
  -- proj-1 sprints
  ('30000000-0000-4000-a000-00000000001a', '20000000-0000-4000-a000-000000000001', 'Onboarding — Setup inicial',       'onboarding',   now() - interval '60 days', now() - interval '50 days', 'completed'),
  ('30000000-0000-4000-a000-00000000001b', '20000000-0000-4000-a000-000000000001', 'Manutenção — Sprint 8',            'support',      now() - interval '7 days',  null,                       'active'),
  -- proj-2 sprints
  ('30000000-0000-4000-a000-00000000002a', '20000000-0000-4000-a000-000000000002', 'Onboarding — Migração de dados',   'onboarding',   now() - interval '45 days', now() - interval '38 days', 'completed'),
  ('30000000-0000-4000-a000-00000000002b', '20000000-0000-4000-a000-000000000002', 'Desenvolvimento — Sprint 1',       'development',  now() - interval '38 days', now() - interval '24 days', 'completed'),
  ('30000000-0000-4000-a000-00000000002c', '20000000-0000-4000-a000-000000000002', 'Desenvolvimento — Sprint 3',       'development',  now() - interval '10 days', null,                       'active'),
  -- proj-3 sprints
  ('30000000-0000-4000-a000-00000000003a', '20000000-0000-4000-a000-000000000003', 'Levantamento e Arquitetura',       'architecture', now() - interval '30 days', now() - interval '20 days', 'completed'),
  ('30000000-0000-4000-a000-00000000003b', '20000000-0000-4000-a000-000000000003', 'Revisão — Reunião cliente',        'review',       now() - interval '5 days',  null,                       'active'),
  -- proj-4 sprints
  ('30000000-0000-4000-a000-00000000004a', '20000000-0000-4000-a000-000000000004', 'Desenvolvimento — Sprint 2',       'development',  now() - interval '15 days', null,                       'active'),
  -- proj-5 sprints
  ('30000000-0000-4000-a000-00000000005a', '20000000-0000-4000-a000-000000000005', 'Kickoff — Definição de escopo',    'onboarding',   now() - interval '20 days', now() - interval '15 days', 'completed'),
  ('30000000-0000-4000-a000-00000000005b', '20000000-0000-4000-a000-000000000005', 'Desenvolvimento — Sprint 1',       'development',  now() - interval '14 days', null,                       'active'),
  -- proj-6 sprints
  ('30000000-0000-4000-a000-00000000006a', '20000000-0000-4000-a000-000000000006', 'Arquitetura — Definição técnica',  'architecture', now() - interval '18 days', now() - interval '12 days', 'completed'),
  ('30000000-0000-4000-a000-00000000006b', '20000000-0000-4000-a000-000000000006', 'Homologação — Testes com cliente', 'homologation', now() - interval '5 days',  null,                       'active'),
  -- proj-7 sprints
  ('30000000-0000-4000-a000-00000000007a', '20000000-0000-4000-a000-000000000007', 'Deploy — Publicação em produção',  'deploy',       now() - interval '3 days',  null,                       'active'),
  -- proj-8 sprints
  ('30000000-0000-4000-a000-00000000008a', '20000000-0000-4000-a000-000000000008', 'Projeto completo',                 'deploy',       now() - interval '90 days', now() - interval '20 days', 'completed')
on conflict (id) do nothing;

-- Update current_sprint_id on projects
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000001b' where id = '20000000-0000-4000-a000-000000000001';
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000002c' where id = '20000000-0000-4000-a000-000000000002';
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000003b' where id = '20000000-0000-4000-a000-000000000003';
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000004a' where id = '20000000-0000-4000-a000-000000000004';
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000005b' where id = '20000000-0000-4000-a000-000000000005';
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000006b' where id = '20000000-0000-4000-a000-000000000006';
update projects set current_sprint_id = '30000000-0000-4000-a000-00000000007a' where id = '20000000-0000-4000-a000-000000000007';

-- ============================================
-- 6. TASKS
-- ============================================
insert into tasks (id, title, description, type, status, priority, owner_id, due_date, tags, project_id, sprint_id, lead_id, created_at, updated_at) values
  -- Project tasks (8)
  ('40000000-0000-4000-a000-0000000000a1', 'Corrigir bug no relatório de vendas',              null,                                                        'project',    'in_progress', 'high',   '00000000-0000-4000-a000-000000000004', now() + interval '1 day',   '{"bug","urgente"}',          '20000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-00000000001b', null,                                   now() - interval '3 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000a2', 'Atualizar API de integração com estoque',          null,                                                        'project',    'todo',        'medium', '00000000-0000-4000-a000-000000000004', now() + interval '5 days',  '{"api"}',                    '20000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-00000000001b', null,                                   now() - interval '2 days', now() - interval '2 days'),
  ('40000000-0000-4000-a000-0000000000a3', 'Implementar módulo de agenda jurídica',            null,                                                        'project',    'in_progress', 'high',   '00000000-0000-4000-a000-000000000004', now() + interval '3 days',  '{"feature"}',                '20000000-0000-4000-a000-000000000002', '30000000-0000-4000-a000-00000000002c', null,                                   now() - interval '5 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000a4', 'Preparar apresentação de revisão',                 null,                                                        'project',    'todo',        'medium', '00000000-0000-4000-a000-000000000003', now(),                      '{"reunião"}',                '20000000-0000-4000-a000-000000000003', '30000000-0000-4000-a000-00000000003b', null,                                   now() - interval '2 days', now() - interval '2 days'),
  ('40000000-0000-4000-a000-0000000000a5', 'Ajustar layout do painel de consultas',            null,                                                        'project',    'done',        'low',    '00000000-0000-4000-a000-000000000004', now() - interval '1 day',   '{"ui"}',                     '20000000-0000-4000-a000-000000000003', '30000000-0000-4000-a000-00000000003b', null,                                   now() - interval '5 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000a6', 'Desenvolver tela de doações online',               null,                                                        'project',    'in_progress', 'high',   '00000000-0000-4000-a000-000000000004', now() + interval '7 days',  '{"feature","frontend"}',     '20000000-0000-4000-a000-000000000005', '30000000-0000-4000-a000-00000000005b', null,                                   now() - interval '10 days', now() - interval '2 days'),
  ('40000000-0000-4000-a000-0000000000a7', 'Testes de homologação com equipe do hotel',        'Aguardando acesso ao ambiente de staging do cliente.',       'project',    'blocked',     'high',   '00000000-0000-4000-a000-000000000003', now() - interval '1 day',   '{"teste","bloqueado"}',      '20000000-0000-4000-a000-000000000006', '30000000-0000-4000-a000-00000000006b', null,                                   now() - interval '5 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000a8', 'Deploy final — configurar DNS e SSL',              null,                                                        'project',    'todo',        'high',   '00000000-0000-4000-a000-000000000004', now() + interval '1 day',   '{"deploy","infra"}',         '20000000-0000-4000-a000-000000000007', '30000000-0000-4000-a000-00000000007a', null,                                   now() - interval '3 days', now() - interval '1 day'),
  -- Sales tasks (6)
  ('40000000-0000-4000-a000-0000000000b1', 'Ligar para Grupo Vértice — primeiro follow-up',    null,                                                        'sales',      'todo',        'medium', '00000000-0000-4000-a000-000000000002', now() + interval '2 days',  '{"follow-up"}',              null,                                   null,                                   '10000000-0000-4000-a000-000000000001', now() - interval '3 days', now() - interval '3 days'),
  ('40000000-0000-4000-a000-0000000000b2', 'Reenviar e-mail para Construtora Horizonte',       null,                                                        'sales',      'todo',        'high',   '00000000-0000-4000-a000-000000000001', now() - interval '1 day',   '{"follow-up","atrasada"}',   null,                                   null,                                   '10000000-0000-4000-a000-000000000003', now() - interval '4 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000b3', 'Preparar proposta técnica — Transportadora Rápida',null,                                                        'sales',      'in_progress', 'high',   '00000000-0000-4000-a000-000000000002', now() + interval '3 days',  '{"proposta"}',               null,                                   null,                                   '10000000-0000-4000-a000-000000000006', now() - interval '2 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000b4', 'Cobrar resposta do questionário — Indústria Paraná',null,                                                       'sales',      'todo',        'medium', '00000000-0000-4000-a000-000000000001', now() - interval '2 days',  '{"follow-up","atrasada"}',   null,                                   null,                                   '10000000-0000-4000-a000-000000000007', now() - interval '4 days', now() - interval '2 days'),
  ('40000000-0000-4000-a000-0000000000b5', 'Agendar call para tirar dúvidas — Imobiliária Progresso', null,                                                  'sales',      'in_progress', 'medium', '00000000-0000-4000-a000-000000000002', now() + interval '4 days',  '{"follow-up"}',              null,                                   null,                                   '10000000-0000-4000-a000-000000000008', now() - interval '3 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000b6', 'Revisar proposta com desconto — Agro Solutions',   null,                                                        'sales',      'in_progress', 'high',   '00000000-0000-4000-a000-000000000002', now() + interval '1 day',   '{"proposta","negociação"}',  null,                                   null,                                   '10000000-0000-4000-a000-000000000010', now() - interval '1 day',  now() - interval '1 day'),
  -- Standalone tasks (6)
  ('40000000-0000-4000-a000-0000000000c1', 'Atualizar portfólio no site da Lidtek',            null,                                                        'standalone', 'todo',        'low',    '00000000-0000-4000-a000-000000000001', now() + interval '10 days', '{"marketing"}',              null, null, null, now() - interval '5 days', now() - interval '5 days'),
  ('40000000-0000-4000-a000-0000000000c2', 'Renovar certificado SSL do servidor',              null,                                                        'standalone', 'todo',        'high',   '00000000-0000-4000-a000-000000000004', now(),                      '{"infra","urgente"}',        null, null, null, now() - interval '7 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000c3', 'Confirmar presença no meetup de React',            null,                                                        'standalone', 'done',        'low',    '00000000-0000-4000-a000-000000000004', now() - interval '3 days',  '{"evento"}',                 null, null, null, now() - interval '10 days', now() - interval '3 days'),
  ('40000000-0000-4000-a000-0000000000c4', 'Preparar apresentação institucional atualizada',   null,                                                        'standalone', 'in_progress', 'medium', '00000000-0000-4000-a000-000000000001', now() + interval '2 days',  '{"marketing"}',              null, null, null, now() - interval '4 days', now() - interval '1 day'),
  ('40000000-0000-4000-a000-0000000000c5', 'Organizar documentação de processos internos',     'Esperando feedback do Lucas sobre o novo modelo de documentação.', 'standalone', 'blocked',  'medium', '00000000-0000-4000-a000-000000000003', now() + interval '7 days',  '{"processos"}',              null, null, null, now() - interval '6 days', now() - interval '2 days'),
  ('40000000-0000-4000-a000-0000000000c6', 'Backup mensal dos repositórios',                   null,                                                        'standalone', 'done',        'medium', '00000000-0000-4000-a000-000000000004', now() - interval '5 days',  '{"infra"}',                  null, null, null, now() - interval '8 days', now() - interval '5 days')
on conflict (id) do nothing;
