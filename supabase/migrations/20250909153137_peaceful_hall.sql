/*
  # Inserir dados padrão do sistema

  1. Tipos de eventos básicos
  2. Formas de pagamento padrão
  3. Pacotes básicos para cada tipo de evento
  4. Modelos de contrato básicos
*/

-- Inserir tipos de eventos
INSERT INTO event_types (name, is_active) VALUES
('Casamento', true),
('Aniversário', true),
('Ensaio Fotográfico', true),
('Formatura', true),
('Batizado', true),
('Evento Corporativo', true),
('15 Anos', true)
ON CONFLICT DO NOTHING;

-- Inserir formas de pagamento
INSERT INTO payment_methods (name, description, discount_percentage, installments, is_active) VALUES
('À Vista', 'Pagamento à vista com desconto', -10.00, 1, true),
('Parcelado em 2x', 'Parcelamento em 2 vezes sem juros', 0.00, 2, true),
('Parcelado em 3x', 'Parcelamento em 3 vezes sem juros', 0.00, 3, true),
('Parcelado em 4x', 'Parcelamento em 4 vezes com juros', 5.00, 4, true),
('PIX', 'Pagamento via PIX com desconto', -5.00, 1, true),
('Cartão de Crédito', 'Pagamento no cartão de crédito', 3.00, 1, true)
ON CONFLICT DO NOTHING;

-- Inserir pacotes básicos (usando subquery para pegar os IDs dos tipos de eventos)
DO $$
DECLARE
    casamento_id uuid;
    aniversario_id uuid;
    ensaio_id uuid;
    formatura_id uuid;
BEGIN
    -- Buscar IDs dos tipos de eventos
    SELECT id INTO casamento_id FROM event_types WHERE name = 'Casamento' LIMIT 1;
    SELECT id INTO aniversario_id FROM event_types WHERE name = 'Aniversário' LIMIT 1;
    SELECT id INTO ensaio_id FROM event_types WHERE name = 'Ensaio Fotográfico' LIMIT 1;
    SELECT id INTO formatura_id FROM event_types WHERE name = 'Formatura' LIMIT 1;

    -- Inserir pacotes para Casamento
    IF casamento_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
        (casamento_id, 'Pacote Básico Casamento', 'Cobertura básica do casamento', 2500.00, 
         '["Cobertura de 6 horas", "200 fotos editadas", "Álbum digital", "Cerimônia e festa"]', true),
        (casamento_id, 'Pacote Premium Casamento', 'Cobertura completa do casamento', 4500.00, 
         '["Cobertura de 10 horas", "400 fotos editadas", "Álbum físico + digital", "Pré-wedding", "Making of", "Cerimônia e festa"]', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Inserir pacotes para Aniversário
    IF aniversario_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
        (aniversario_id, 'Pacote Básico Aniversário', 'Cobertura básica da festa', 1200.00, 
         '["Cobertura de 4 horas", "100 fotos editadas", "Álbum digital"]', true),
        (aniversario_id, 'Pacote Premium Aniversário', 'Cobertura completa da festa', 2000.00, 
         '["Cobertura de 6 horas", "200 fotos editadas", "Álbum físico + digital", "Making of"]', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Inserir pacotes para Ensaio Fotográfico
    IF ensaio_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
        (ensaio_id, 'Ensaio Básico', 'Ensaio fotográfico básico', 800.00, 
         '["Sessão de 2 horas", "50 fotos editadas", "Álbum digital"]', true),
        (ensaio_id, 'Ensaio Premium', 'Ensaio fotográfico completo', 1500.00, 
         '["Sessão de 4 horas", "100 fotos editadas", "Álbum físico + digital", "2 looks diferentes"]', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Inserir pacotes para Formatura
    IF formatura_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
        (formatura_id, 'Pacote Básico Formatura', 'Cobertura básica da formatura', 1500.00, 
         '["Cobertura de 5 horas", "150 fotos editadas", "Álbum digital"]', true),
        (formatura_id, 'Pacote Premium Formatura', 'Cobertura completa da formatura', 2500.00, 
         '["Cobertura de 8 horas", "300 fotos editadas", "Álbum físico + digital", "Fotos individuais"]', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Inserir modelos de contrato básicos
DO $$
DECLARE
    casamento_id uuid;
    aniversario_id uuid;
    ensaio_id uuid;
BEGIN
    -- Buscar IDs dos tipos de eventos
    SELECT id INTO casamento_id FROM event_types WHERE name = 'Casamento' LIMIT 1;
    SELECT id INTO aniversario_id FROM event_types WHERE name = 'Aniversário' LIMIT 1;
    SELECT id INTO ensaio_id FROM event_types WHERE name = 'Ensaio Fotográfico' LIMIT 1;

    -- Modelo de contrato para Casamento
    IF casamento_id IS NOT NULL THEN
        INSERT INTO contract_templates (event_type_id, name, content, is_active) VALUES
        (casamento_id, 'Contrato Padrão Casamento', 
'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - CASAMENTO

CONTRATANTE:
Nome: {{nome_completo}}
CPF: {{cpf}}
E-mail: {{email}}
WhatsApp: {{whatsapp}}
Endereço: {{endereco}}, {{cidade}}
Data de Nascimento: {{data_nascimento}}

EVENTO:
Tipo: {{tipo_evento}}
Noivos: {{nome_noivos}}
Data do Evento: {{data_evento}}
Horário: {{horario_evento}}
Local da Cerimônia: {{local_cerimonia}}
Local da Festa: {{local_festa}}
Local do Pré-Wedding: {{local_pre_wedding}}
Local do Making Of: {{local_making_of}}

PACOTE CONTRATADO:
{{package_name}}
Valor: {{package_price}}

SERVIÇOS INCLUSOS:
{{package_features}}

CONDIÇÕES DE PAGAMENTO:
Valor Total: {{package_price}}
Forma de Pagamento: Conforme acordado

OBSERVAÇÕES:
{{custom_notes}}

Este contrato é válido mediante assinatura de ambas as partes.

_________________________                    _________________________
    Contratante                                  Contratado

Data: ___/___/______', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Modelo de contrato para Aniversário
    IF aniversario_id IS NOT NULL THEN
        INSERT INTO contract_templates (event_type_id, name, content, is_active) VALUES
        (aniversario_id, 'Contrato Padrão Aniversário', 
'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - ANIVERSÁRIO

CONTRATANTE:
Nome: {{nome_completo}}
CPF: {{cpf}}
E-mail: {{email}}
WhatsApp: {{whatsapp}}
Endereço: {{endereco}}, {{cidade}}
Data de Nascimento: {{data_nascimento}}

EVENTO:
Tipo: {{tipo_evento}}
Aniversariante: {{nome_aniversariante}}
Data do Evento: {{data_evento}}
Horário: {{horario_evento}}
Local da Festa: {{local_festa}}

PACOTE CONTRATADO:
{{package_name}}
Valor: {{package_price}}

SERVIÇOS INCLUSOS:
{{package_features}}

CONDIÇÕES DE PAGAMENTO:
Valor Total: {{package_price}}
Forma de Pagamento: Conforme acordado

OBSERVAÇÕES:
{{custom_notes}}

Este contrato é válido mediante assinatura de ambas as partes.

_________________________                    _________________________
    Contratante                                  Contratado

Data: ___/___/______', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Modelo de contrato para Ensaio Fotográfico
    IF ensaio_id IS NOT NULL THEN
        INSERT INTO contract_templates (event_type_id, name, content, is_active) VALUES
        (ensaio_id, 'Contrato Padrão Ensaio', 
'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - ENSAIO

CONTRATANTE:
Nome: {{nome_completo}}
CPF: {{cpf}}
E-mail: {{email}}
WhatsApp: {{whatsapp}}
Endereço: {{endereco}}, {{cidade}}
Data de Nascimento: {{data_nascimento}}

EVENTO:
Tipo: {{tipo_evento}}
Data do Ensaio: {{data_evento}}
Horário: {{horario_evento}}
Local do Ensaio: {{local_festa}}

PACOTE CONTRATADO:
{{package_name}}
Valor: {{package_price}}

SERVIÇOS INCLUSOS:
{{package_features}}

CONDIÇÕES DE PAGAMENTO:
Valor Total: {{package_price}}
Forma de Pagamento: Conforme acordado

OBSERVAÇÕES:
{{custom_notes}}

Este contrato é válido mediante assinatura de ambas as partes.

_________________________                    _________________________
    Contratante                                  Contratado

Data: ___/___/______', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;