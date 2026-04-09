-- ==========================================
-- SCRIPT DE LIMPEZA E MIGRAÇÃO DOS DADOS REAIS
-- Executar no SQL Editor do Supabase
-- ==========================================

DO $$ 
DECLARE
  v_owner_id uuid;
  v_lead_laterza uuid;
  v_lead_casa_decor uuid;
  v_lead_v5 uuid;
  v_lead_clikey uuid;
  v_lead_grupo_gqb uuid;
  v_lead_fazenda_sao_bento uuid;
  v_lead_sao_bento_locacoes uuid;
  v_lead_manuprev uuid;
  v_lead_nobrega uuid;
  v_lead_ago uuid;
  v_lead_site_porsche uuid;
  v_lead_iogar uuid;
  v_lead_aluga_aqui uuid;
  v_lead_skep uuid;
BEGIN
  -- 1. Obter o ID do usuário Lucas
  SELECT id INTO v_owner_id FROM public.profiles WHERE email = 'lucas@lidtek.com.br' LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Usuário lucas@lidtek.com.br não encontrado. Faça login pelo app antes de rodar o script.';
  END IF;

  -- 2. Limpeza total de dados (A ordem importa por conta das chaves estrangeiras)
  DELETE FROM public.tasks;
  DELETE FROM public.sprints;
  DELETE FROM public.projects;
  DELETE FROM public.interactions;
  DELETE FROM public.leads;
  
  -- Excluir todos os perfis, exceto o do Lucas
  DELETE FROM public.profiles WHERE email != 'lucas@lidtek.com.br';

  -- 3. Inserir todos os Clientes como Leads
  
  -- Laterza (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Construtora Laterza', 'Juliana Cobo / Caio Barbosa', null, 'Indicação', v_owner_id, 'CNPJ: 05.776.652/0001-36 | Emails: juliana.cobo@construtoralaterza.com.br, caio.barbosa@construtoralaterza.com.br', 'contract_signed') 
  RETURNING id INTO v_lead_laterza;

  -- Casa Decor (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Casa Decor', 'Mariana / Kalil / Karinne', null, 'Indicação', v_owner_id, 'CNPJ: 30.365.256/0001-63 | Emails: mariana@casadecor.net.br, kalil@casadecor.net.br, karinne@casadecor.net.br', 'contract_signed') 
  RETURNING id INTO v_lead_casa_decor;

  -- V5 (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('V5', 'Fernando Seixlack Silva', null, 'Indicação', v_owner_id, 'CNPJ: 61.560.263/0001-40 | Email: fernandoseixlacksilva@gmail.com', 'contract_signed') 
  RETURNING id INTO v_lead_v5;

  -- Clikey (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Clikey', 'Leandro Maia', null, 'Indicação', v_owner_id, 'CPF: 089.314.646-30 | Email: leandroVmaia@hotmail.com', 'contract_signed') 
  RETURNING id INTO v_lead_clikey;

  -- Grupo GQB (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Grupo GQB', 'Responsável', null, 'Indicação', v_owner_id, '', 'contract_signed') 
  RETURNING id INTO v_lead_grupo_gqb;

  -- Fazenda São Bento (Apenas prospect / CRM)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Fazenda São Bento', 'Responsável', null, 'Indicação', v_owner_id, 'CPF: 055.104.896-42 | Email: saobentoagronegocios@outlook.com', 'negotiation') 
  RETURNING id INTO v_lead_fazenda_sao_bento;

  -- São Bento Locações (Apenas prospect / CRM)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('São Bento Locações', 'Responsável', null, 'Indicação', v_owner_id, 'CNPJ: 44.459.342/0001-40 | Email: saobentoagronegocios@outlook.com', 'negotiation') 
  RETURNING id INTO v_lead_sao_bento_locacoes;

  -- Manuprev Gabriel (Apenas prospect / CRM)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Manuprev Gabriel', 'Gabriel', null, 'Indicação', v_owner_id, '', 'negotiation') 
  RETURNING id INTO v_lead_manuprev;

  -- Nóbrega (Apenas prospect / CRM)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Nóbrega', 'Responsável', null, 'Indicação', v_owner_id, '', 'negotiation') 
  RETURNING id INTO v_lead_nobrega;

  -- Ago Concessionária (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Ago Concessionária (AGO COMERCIO DE VEICULOS LTDA)', 'Rodrigo', null, 'Indicação', v_owner_id, 'CNPJ: 07.493.290/0001-00 | Endereço: Av. Das Américas 645 - Barra da Tijuca - CEP: 22640-100 | Email: rodrigo@ago.com.br', 'contract_signed') 
  RETURNING id INTO v_lead_ago;

  -- Site Porsche (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Site Porsche (Lia e Annette Industria e Comercio Ltda)', 'Eytan', null, 'Indicação', v_owner_id, 'CNPJ: 32.092.462/0002-53 | Endereço: Estrada do Joá 102 - CEP: 22610-142 | Email: eytan@multiturbo.com.br', 'contract_signed') 
  RETURNING id INTO v_lead_site_porsche;

  -- Gestor de Produção IOGAR (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Gestor de Produção IOGAR', 'Leandro Cantini Lopes', null, 'Indicação', v_owner_id, 'CPF: 058.323.597-20 | Endereço: Rua Barata Ribeiro, 686, Apto 302- Copacabana, Rio de Janeiro – CEP: 22051-002 | Email: leandro@iogar.com.br', 'contract_signed') 
  RETURNING id INTO v_lead_iogar;

  -- Aluga Aqui (Projeto fechado)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('Aluga Aqui', 'Yara Alves de Morais', null, 'Indicação', v_owner_id, 'CNPJ: 40.481.378/0001-79 | Endereço: Rua Benedito Serafim Bueno, 25 Jardim Thelma São Bernardo do Campo – CEP: 09850-780 | Email: yaramorais01@hotmail.com', 'contract_signed') 
  RETURNING id INTO v_lead_aluga_aqui;
  
  -- SKEP.app (Adicionado como lead fechado já que virou projeto)
  INSERT INTO public.leads (name, contact, phone, origin, owner_id, notes, stage) 
  VALUES ('SKEP.app', 'Responsável', null, 'Indicação', v_owner_id, '', 'contract_signed') 
  RETURNING id INTO v_lead_skep;

  -- 4. Inserir os Projetos baseados nos Leads (contract_signed)
  INSERT INTO public.projects (client_name, client_contact, client_phone, type, status, owner_id, lead_id) VALUES
    ('Laterza', 'Juliana / Caio', null, 'recurring', 'active', v_owner_id, v_lead_laterza),
    ('Casa Decor', 'Mariana / Kalil / Karinne', null, 'recurring', 'active', v_owner_id, v_lead_casa_decor),
    ('V5', 'Fernando Seixlack Silva', null, 'recurring', 'active', v_owner_id, v_lead_v5),
    ('Clikey', 'Leandro Maia', null, 'recurring', 'active', v_owner_id, v_lead_clikey),
    ('Grupo GQB', 'Responsável', null, 'recurring', 'active', v_owner_id, v_lead_grupo_gqb),
    ('SKEP.app', 'Responsável', null, 'recurring', 'active', v_owner_id, v_lead_skep),
    ('Site Porsche', 'Eytan', null, 'oneshot', 'active', v_owner_id, v_lead_site_porsche),
    ('Ago Concessionária', 'Rodrigo', null, 'recurring', 'active', v_owner_id, v_lead_ago),
    ('Gestor de Produção IOGAR', 'Leandro Cantini Lopes', null, 'oneshot', 'active', v_owner_id, v_lead_iogar),
    ('Aluga Aqui', 'Yara Alves de Morais', null, 'recurring', 'active', v_owner_id, v_lead_aluga_aqui);

END $$;
