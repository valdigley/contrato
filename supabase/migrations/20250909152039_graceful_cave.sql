/*
  # Inserir dados padrão do sistema

  1. Tipos de eventos padrão
  2. Formas de pagamento padrão
  3. Pacotes básicos
  4. Modelos de contrato básicos
*/

-- Inserir tipos de eventos padrão
INSERT INTO event_types (name, is_active) VALUES
    ('Casamento', true),
    ('Aniversário', true),
    ('Ensaio Fotográfico', true),
    ('Formatura', true),
    ('Evento Corporativo', true),
    ('Batizado', true),
    ('Festa Infantil', true)
ON CONFLICT DO NOTHING;

-- Inserir formas de pagamento padrão
INSERT INTO payment_methods (name, description, discount_percentage, installments, is_active) VALUES
    ('À Vista', 'Pagamento à vista com desconto', 10.00, 1, true),
    ('Parcelado 2x', 'Parcelamento em 2 vezes sem juros', 0.00, 2, true),
    ('Parcelado 3x', 'Parcelamento em 3 vezes sem juros', 0.00, 3, true),
    ('Parcelado 4x', 'Parcelamento em 4 vezes com juros', 5.00, 4, true),
    ('PIX', 'Pagamento via PIX com desconto', 5.00, 1, true),
    ('Cartão de Crédito', 'Pagamento no cartão de crédito', 0.00, 1, true)
ON CONFLICT DO NOTHING;

-- Inserir pacotes básicos para cada tipo de evento
DO $$
DECLARE
    casamento_id uuid;
    aniversario_id uuid;
    ensaio_id uuid;
    formatura_id uuid;
BEGIN
    -- Obter IDs dos tipos de eventos
    SELECT id INTO casamento_id FROM event_types WHERE name = 'Casamento' LIMIT 1;
    SELECT id INTO aniversario_id FROM event_types WHERE name = 'Aniversário' LIMIT 1;
    SELECT id INTO ensaio_id FROM event_types WHERE name = 'Ensaio Fotográfico' LIMIT 1;
    SELECT id INTO formatura_id FROM event_types WHERE name = 'Formatura' LIMIT 1;

    -- Pacotes para Casamento
    IF casamento_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
            (casamento_id, 'Pacote Básico Casamento', 'Cobertura básica do casamento', 2500.00, 
             '["Cobertura de 6 horas", "200 fotos editadas", "Álbum digital", "Cerimônia e festa"]', true),
            (casamento_id, 'Pacote Premium Casamento', 'Cobertura completa do casamento', 4500.00,
             '["Cobertura de 10 horas", "500 fotos editadas", "Álbum físico + digital", "Pré-wedding", "Making of", "Cerimônia e festa"]', true),
            (casamento_id, 'Pacote Luxo Casamento', 'Cobertura premium com extras', 7000.00,
             '["Cobertura ilimitada", "800+ fotos editadas", "2 álbuns físicos + digital", "Pré-wedding", "Making of", "Cerimônia e festa", "Drone", "Segundo fotógrafo"]', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pacotes para Aniversário
    IF aniversario_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
            (aniversario_id, 'Pacote Básico Aniversário', 'Cobertura básica da festa', 800.00,
             '["Cobertura de 3 horas", "100 fotos editadas", "Álbum digital"]', true),
            (aniversario_id, 'Pacote Premium Aniversário', 'Cobertura completa da festa', 1500.00,
             '["Cobertura de 5 horas", "200 fotos editadas", "Álbum físico + digital", "Making of"]', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pacotes para Ensaio Fotográfico
    IF ensaio_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
            (ensaio_id, 'Ensaio Básico', 'Ensaio fotográfico simples', 400.00,
             '["1 hora de sessão", "30 fotos editadas", "Álbum digital"]', true),
            (ensaio_id, 'Ensaio Premium', 'Ensaio fotográfico completo', 700.00,
             '["2 horas de sessão", "60 fotos editadas", "Álbum físico + digital", "2 looks"]', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pacotes para Formatura
    IF formatura_id IS NOT NULL THEN
        INSERT INTO packages (event_type_id, name, description, price, features, is_active) VALUES
            (formatura_id, 'Pacote Individual', 'Sessão individual de formatura', 300.00,
             '["30 minutos de sessão", "20 fotos editadas", "Álbum digital"]', true),
            (formatura_id, 'Pacote Turma', 'Cobertura da formatura da turma', 1200.00,
             '["Cobertura de 4 horas", "150 fotos editadas", "Álbum digital da turma"]', true)
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
    -- Obter IDs dos tipos de eventos
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
Data: {{data_evento}} às {{horario_evento}}
Local da Cerimônia: {{local_cerimonia}}
Local da Festa: {{local_festa}}
Local do Pré-Wedding: {{local_pre_wedding}}
Local do Making Of: {{local_making_of}}

PACOTE CONTRATADO:
{{package_name}}
Valor: {{package_price}}

RECURSOS INCLUSOS:
{{package_features}}

OBSERVAÇÕES:
{{custom_notes}}

TERMOS E CONDIÇÕES:
1. O presente contrato tem por objeto a prestação de serviços fotográficos para o evento acima especificado.
2. O pagamento deverá ser efetuado conforme acordado entre as partes.
3. As fotos serão entregues em formato digital em até 30 dias após o evento.
4. O contratado se compromete a comparecer no local e horário especificados.
5. Em caso de cancelamento pelo contratante, será cobrada multa de 50% do valor total.

Data: ___/___/______

_________________________                    _________________________
    Contratante                                  Contratado', true)
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

EVENTO:
Tipo: {{tipo_evento}}
Aniversariante: {{nome_aniversariante}}
Data: {{data_evento}} às {{horario_evento}}
Local: {{local_festa}}

PACOTE CONTRATADO:
{{package_name}}
Valor: {{package_price}}

RECURSOS INCLUSOS:
{{package_features}}

OBSERVAÇÕES:
{{custom_notes}}

TERMOS E CONDIÇÕES:
1. O presente contrato tem por objeto a prestação de serviços fotográficos para o evento acima especificado.
2. O pagamento deverá ser efetuado conforme acordado entre as partes.
3. As fotos serão entregues em formato digital em até 15 dias após o evento.
4. O contratado se compromete a comparecer no local e horário especificados.

Data: ___/___/______

_________________________                    _________________________
    Contratante                                  Contratado', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Modelo de contrato para Ensaio
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

ENSAIO:
Tipo: {{tipo_evento}}
Data: {{data_evento}} às {{horario_evento}}
Local: {{local_festa}}

PACOTE CONTRATADO:
{{package_name}}
Valor: {{package_price}}

RECURSOS INCLUSOS:
{{package_features}}

OBSERVAÇÕES:
{{custom_notes}}

TERMOS E CONDIÇÕES:
1. O presente contrato tem por objeto a prestação de serviços fotográficos para ensaio.
2. O pagamento deverá ser efetuado conforme acordado entre as partes.
3. As fotos serão entregues em formato digital em até 7 dias após a sessão.
4. O contratado se compromete a comparecer no local e horário especificados.

Data: ___/___/______

_________________________                    _________________________
    Contratante                                  Contratado', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;