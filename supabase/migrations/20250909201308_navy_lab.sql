/*
  # Schema completo para o sistema de contratos fotográficos

  1. Tabelas principais
    - users: Usuários do sistema
    - photographers: Perfis de fotógrafos
    - event_types: Tipos de eventos
    - packages: Pacotes de serviços
    - payment_methods: Formas de pagamento
    - contract_templates: Modelos de contratos
    - contratos: Contratos principais
    - package_payment_methods: Relação pacotes x formas de pagamento
    - business_info: Informações do negócio
    - settings: Configurações do sistema
    - testimonials: Depoimentos
    - categories: Categorias de projetos
    - projects: Projetos/portfólio
    - project_images: Imagens dos projetos
    - blog_posts: Posts do blog
    - contact_submissions: Formulários de contato
    - session_types: Tipos de sessão
    - clients: Clientes
    - appointments: Agendamentos
    - payments: Pagamentos
    - notification_queue: Fila de notificações
    - notification_templates: Modelos de notificação
    - whatsapp_instances: Instâncias WhatsApp
    - mercadopago_settings: Configurações MercadoPago
    - galleries: Galerias
    - photos: Fotos
    - client_sessions: Sessões de clientes
    - galleries_triage: Galerias de triagem
    - photos_triage: Fotos de triagem

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas apropriadas para cada tabela

  3. Funções e triggers
    - Função para atualizar updated_at
    - Triggers automáticos
*/

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar galeria automaticamente
CREATE OR REPLACE FUNCTION create_gallery_for_confirmed_appointment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        INSERT INTO galleries_triage (
            appointment_id,
            name,
            gallery_token,
            password,
            status,
            link_expires_at
        ) VALUES (
            NEW.id,
            CONCAT('Galeria - ', (SELECT name FROM clients WHERE id = NEW.client_id)),
            encode(gen_random_bytes(16), 'hex'),
            NULL,
            'pending',
            now() + interval '30 days'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela users
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    name text,
    role text DEFAULT 'photographer',
    business_name text,
    phone text,
    created_at timestamptz DEFAULT now()
);

-- Tabela photographers
CREATE TABLE IF NOT EXISTS photographers (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name text,
    phone text,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Tabela event_types
CREATE TABLE IF NOT EXISTS event_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela packages
CREATE TABLE IF NOT EXISTS packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL DEFAULT 0,
    features jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    discount_percentage numeric(5,2) DEFAULT 0,
    installments integer DEFAULT 1,
    payment_schedule jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela contract_templates
CREATE TABLE IF NOT EXISTS contract_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela contratos
CREATE TABLE IF NOT EXISTS contratos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo text NOT NULL,
    cpf text NOT NULL,
    endereco text NOT NULL,
    cidade text NOT NULL,
    data_nascimento date NOT NULL,
    tipo_evento text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    local_pre_wedding text,
    local_making_of text,
    local_cerimonia text,
    local_festa text NOT NULL,
    nome_noivos text,
    nome_aniversariante text,
    event_type_id uuid REFERENCES event_types(id),
    package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
    package_price numeric(10,2) DEFAULT 0,
    final_price numeric(10,2) DEFAULT 0,
    payment_method_id uuid REFERENCES payment_methods(id),
    preferred_payment_day integer CHECK (preferred_payment_day >= 1 AND preferred_payment_day <= 28),
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    whatsapp text NOT NULL CHECK (whatsapp ~ '^[0-9]{10,11}$'),
    data_evento date,
    horario_evento time,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
    adjusted_price numeric(10,2) DEFAULT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    custom_notes text
);

-- Tabela package_payment_methods
CREATE TABLE IF NOT EXISTS package_payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    payment_method_id uuid NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    final_price numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(package_id, payment_method_id)
);

-- Tabela business_info
CREATE TABLE IF NOT EXISTS business_info (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text,
    whatsapp text,
    email text,
    city text,
    state text,
    instagram text,
    document text,
    zip_code text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    logo_url_drive text,
    logo_url_triagem text,
    logo_url_formatura text,
    logo_url_contrato text,
    logo_url_site text
);

-- Tabela settings
CREATE TABLE IF NOT EXISTS settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    price_commercial_hour numeric(10,2) DEFAULT 30.00,
    price_after_hours numeric(10,2) DEFAULT 40.00,
    minimum_photos integer DEFAULT 5,
    delivery_days integer DEFAULT 7,
    link_validity_days integer DEFAULT 30,
    cleanup_days integer DEFAULT 30,
    commercial_hours jsonb DEFAULT '{"friday": {"end": "18:00", "start": "09:00", "enabled": true}, "monday": {"end": "18:00", "start": "09:00", "enabled": true}, "sunday": {"end": "16:00", "start": "09:00", "enabled": false}, "tuesday": {"end": "18:00", "start": "09:00", "enabled": true}, "saturday": {"end": "16:00", "start": "09:00", "enabled": true}, "thursday": {"end": "18:00", "start": "09:00", "enabled": true}, "wednesday": {"end": "18:00", "start": "09:00", "enabled": true}}',
    terms_conditions text DEFAULT '📸 Edição: Ajustes básicos de cor, enquadramento e pequenos retoques
🖼 Entrega: Até 7 dias após a seleção das fotos
➕ Foto extra: R$30,00 cada
📆 Cancelamento: Até 48h antes, com perda de 30% do valor pago
📩 Entrega: via link com validade de 30 dias
🕒 Seleção: O cliente tem 7 dias para escolher as fotos. Se não o fizer, o fotógrafo fará a seleção
📢 As fotos podem ser usadas no portfólio e redes sociais do fotógrafo, salvo aviso prévio do cliente',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    studio_phone text,
    studio_address text DEFAULT 'Rua das Flores, 123 - Centro, São Paulo - SP, 01234-567',
    studio_maps_url text DEFAULT 'https://maps.google.com/?q=Rua+das+Flores+123+Centro+São+Paulo+SP',
    studio_name text DEFAULT '',
    studio_logo_url text,
    watermark_enabled boolean DEFAULT true,
    watermark_text text DEFAULT 'Preview',
    watermark_opacity numeric(3,2) DEFAULT 0.70,
    watermark_position text DEFAULT 'center',
    watermark_size text DEFAULT 'medium',
    watermark_image_url text,
    google_places_api_key text,
    google_place_id text,
    google_reviews_enabled boolean DEFAULT false,
    site_title text DEFAULT 'Valdigley Fotografia',
    site_description text DEFAULT 'Fotógrafo especializado em casamentos e pré-weddings em Jericoacoara, Sobral e Fortaleza',
    contact_email text DEFAULT 'contato@valdigley.com',
    instagram_url text DEFAULT 'https://instagram.com/valdigleyfoto',
    seo_keywords text DEFAULT 'fotografia casamento, Jericoacoara, Sobral, Fortaleza, pré wedding, ensaio casal',
    hero_images jsonb DEFAULT '["https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg", "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg", "https://images.pexels.com/photos/265885/pexels-photo-265885.jpeg"]'
);

-- Tabela testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name text NOT NULL,
    content text NOT NULL,
    rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    google_review_id text UNIQUE,
    google_data jsonb DEFAULT '{}'
);

-- Tabela categories
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Tabela projects
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    client_names text NOT NULL,
    location text,
    event_date date,
    description text,
    cover_image text NOT NULL,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela project_images
CREATE TABLE IF NOT EXISTS project_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    alt_text text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Tabela blog_posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text NOT NULL,
    excerpt text,
    featured_image text,
    is_published boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela contact_submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    event_type text,
    event_date date,
    location text,
    message text,
    status text DEFAULT 'new',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela session_types
CREATE TABLE IF NOT EXISTS session_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    icon text DEFAULT '📸',
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela clients
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    total_spent numeric(10,2) DEFAULT 0.00,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela appointments
CREATE TABLE IF NOT EXISTS appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    session_type text NOT NULL,
    session_details jsonb DEFAULT '{}',
    scheduled_date timestamptz NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    minimum_photos integer DEFAULT 5,
    status text DEFAULT 'pending',
    payment_id text,
    payment_status text DEFAULT 'pending',
    terms_accepted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela payments
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
    mercadopago_id text,
    amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending',
    payment_type text DEFAULT 'initial',
    webhook_data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela notification_queue
CREATE TABLE IF NOT EXISTS notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
    template_type text NOT NULL,
    recipient_phone text NOT NULL,
    recipient_name text NOT NULL,
    message text NOT NULL,
    scheduled_for timestamptz NOT NULL,
    sent_at timestamptz,
    status text DEFAULT 'pending',
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Tabela notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL UNIQUE,
    name text NOT NULL,
    message_template text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela whatsapp_instances
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'created',
    instance_data jsonb DEFAULT '{}',
    last_updated timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela mercadopago_settings
CREATE TABLE IF NOT EXISTS mercadopago_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token text,
    public_key text,
    webhook_url text,
    environment text DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela galleries
CREATE TABLE IF NOT EXISTS galleries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    client_name text NOT NULL,
    description text,
    cover_photo_id text,
    created_date timestamptz DEFAULT now(),
    expiration_date timestamptz,
    password text,
    access_count integer DEFAULT 0,
    download_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{"watermark": true, "allowComments": false, "allowDownload": true, "downloadQuality": "print"}',
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela photos
CREATE TABLE IF NOT EXISTS photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
    url text NOT NULL,
    thumbnail text NOT NULL,
    filename text NOT NULL,
    size bigint NOT NULL,
    upload_date timestamptz DEFAULT now(),
    r2_key text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Tabela client_sessions
CREATE TABLE IF NOT EXISTS client_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    accessed_at timestamptz DEFAULT now(),
    favorites text[] DEFAULT '{}',
    selected_photos text[] DEFAULT '{}',
    downloads integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela galleries_triage
CREATE TABLE IF NOT EXISTS galleries_triage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
    name text NOT NULL,
    gallery_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    password text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed')),
    photos_uploaded integer DEFAULT 0,
    photos_selected text[] DEFAULT '{}',
    selection_completed boolean DEFAULT false,
    selection_submitted_at timestamptz,
    link_expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
    watermark_settings jsonb DEFAULT '{"text": "Preview", "enabled": true, "opacity": 0.7, "position": "center"}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela photos_triage
CREATE TABLE IF NOT EXISTS photos_triage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id uuid REFERENCES galleries_triage(id) ON DELETE CASCADE,
    filename text NOT NULL,
    url text NOT NULL,
    thumbnail text NOT NULL,
    size bigint NOT NULL,
    is_selected boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    upload_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Tabela jeri_agency_tours
CREATE TABLE IF NOT EXISTS jeri_agency_tours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    vehicle_type text NOT NULL,
    price_min numeric(10,2) NOT NULL,
    price_max numeric(10,2),
    capacity integer NOT NULL,
    duration text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela jeri_agency_helicopter_tours
CREATE TABLE IF NOT EXISTS jeri_agency_helicopter_tours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    duration text NOT NULL,
    normal_price numeric(10,2) NOT NULL,
    voucher_price numeric(10,2) NOT NULL,
    discount_percentage integer DEFAULT 5,
    max_passengers integer DEFAULT 3,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_cpf ON contratos(cpf);
CREATE INDEX IF NOT EXISTS idx_contratos_email ON contratos(email);
CREATE INDEX IF NOT EXISTS idx_contratos_whatsapp ON contratos(whatsapp);
CREATE INDEX IF NOT EXISTS idx_contratos_created_at ON contratos(created_at);
CREATE INDEX IF NOT EXISTS idx_contratos_data_evento ON contratos(data_evento);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_tipo_evento ON contratos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_contratos_event_type_id ON contratos(event_type_id);
CREATE INDEX IF NOT EXISTS idx_contratos_package_id ON contratos(package_id);
CREATE INDEX IF NOT EXISTS idx_contratos_payment_method_id ON contratos(payment_method_id);

CREATE INDEX IF NOT EXISTS idx_packages_event_type_id ON packages(event_type_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

CREATE INDEX IF NOT EXISTS idx_contract_templates_event_type_id ON contract_templates(event_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_event_types_active ON event_types(is_active);

-- Criar triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_types_updated_at BEFORE UPDATE ON event_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_info_updated_at BEFORE UPDATE ON business_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_types_updated_at BEFORE UPDATE ON session_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mercadopago_settings_updated_at BEFORE UPDATE ON mercadopago_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_galleries_updated_at BEFORE UPDATE ON galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_sessions_updated_at BEFORE UPDATE ON client_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_galleries_triage_updated_at BEFORE UPDATE ON galleries_triage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jeri_agency_tours_updated_at BEFORE UPDATE ON jeri_agency_tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jeri_agency_helicopter_tours_updated_at BEFORE UPDATE ON jeri_agency_helicopter_tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger especial para criar galeria automaticamente
CREATE TRIGGER auto_create_gallery_on_confirmation AFTER UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION create_gallery_for_confirmed_appointment();

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE jeri_agency_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE jeri_agency_helicopter_tours ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON users FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow user creation during signup" ON users FOR INSERT TO anon WITH CHECK (true);

-- Políticas RLS para photographers
CREATE POLICY "Enable read access for all users" ON photographers FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users" ON photographers FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for authenticated users" ON photographers FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for authenticated users" ON photographers FOR DELETE TO public USING (auth.uid() = user_id);

-- Políticas RLS para event_types
CREATE POLICY "event_types_select_policy" ON event_types FOR SELECT TO public USING (true);
CREATE POLICY "event_types_insert_policy" ON event_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "event_types_update_policy" ON event_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "event_types_delete_policy" ON event_types FOR DELETE TO authenticated USING (true);

-- Políticas RLS para packages
CREATE POLICY "Public can read active packages" ON packages FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated users can manage packages" ON packages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para payment_methods
CREATE POLICY "Public can read active payment methods" ON payment_methods FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated users can manage payment methods" ON payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para contract_templates
CREATE POLICY "Public can read active contract templates" ON contract_templates FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Authenticated users can manage contract templates" ON contract_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para contratos
CREATE POLICY "Allow anon read contracts" ON contratos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert contracts" ON contratos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update contracts" ON contratos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete contracts" ON contratos FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated full access to contracts" ON contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para package_payment_methods
CREATE POLICY "Allow public read access to package payment methods" ON package_payment_methods FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated users to insert package payment methods" ON package_payment_methods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update package payment methods" ON package_payment_methods FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete package payment methods" ON package_payment_methods FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow anonymous users to insert package payment methods" ON package_payment_methods FOR INSERT TO anon WITH CHECK (true);

-- Políticas RLS para business_info
CREATE POLICY "public read" ON business_info FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read business info" ON business_info FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage business info" ON business_info FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para settings
CREATE POLICY "public read" ON settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read settings" ON settings FOR SELECT TO anon USING (true);
CREATE POLICY "Admin can manage settings" ON settings FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para testimonials
CREATE POLICY "public read featured" ON testimonials FOR SELECT TO anon USING (COALESCE(is_featured, true) = true);
CREATE POLICY "Public can read featured testimonials" ON testimonials FOR SELECT TO authenticated USING (is_featured = true);
CREATE POLICY "Authenticated users can manage testimonials" ON testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para categories
CREATE POLICY "public read" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para projects
CREATE POLICY "public read published" ON projects FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "Public can read published projects" ON projects FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Authenticated users can manage projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para project_images
CREATE POLICY "public read via project" ON project_images FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_images.project_id AND p.is_published = true));
CREATE POLICY "Public can read project images" ON project_images FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_images.project_id AND projects.is_published = true));
CREATE POLICY "Authenticated users can manage project images" ON project_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para blog_posts
CREATE POLICY "Public can read published blog posts" ON blog_posts FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Authenticated users can manage blog posts" ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para contact_submissions
CREATE POLICY "Public can create contact submissions" ON contact_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin can manage contact submissions" ON contact_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para session_types
CREATE POLICY "Public can read active session types" ON session_types FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin can manage session types" ON session_types FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para clients
CREATE POLICY "Admin can manage clients" ON clients FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para appointments
CREATE POLICY "Public can create appointments" ON appointments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can read appointment availability" ON appointments FOR SELECT TO anon USING (true);
CREATE POLICY "Admin can manage appointments" ON appointments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para payments
CREATE POLICY "Admin can manage payments" ON payments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para notification_queue
CREATE POLICY "Admin can manage notification queue" ON notification_queue FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para notification_templates
CREATE POLICY "Public can read active templates" ON notification_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin can manage notification templates" ON notification_templates FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para whatsapp_instances
CREATE POLICY "Admin can manage WhatsApp instances" ON whatsapp_instances FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para mercadopago_settings
CREATE POLICY "Admin can manage MercadoPago settings" ON mercadopago_settings FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para galleries
CREATE POLICY "Public can view galleries" ON galleries FOR SELECT TO anon USING (true);
CREATE POLICY "Users can manage their own galleries" ON galleries FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para photos
CREATE POLICY "Public can view photos" ON photos FOR SELECT TO anon USING (true);
CREATE POLICY "Users can manage photos in their galleries" ON photos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = photos.gallery_id AND galleries.user_id = auth.uid()));

-- Políticas RLS para client_sessions
CREATE POLICY "Anyone can manage client sessions" ON client_sessions FOR ALL TO authenticated USING (true);

-- Políticas RLS para galleries_triage
CREATE POLICY "Public can view galleries_triage by token" ON galleries_triage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage galleries_triage" ON galleries_triage FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para photos_triage
CREATE POLICY "Public can view photos_triage" ON photos_triage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage photos_triage" ON photos_triage FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas RLS para jeri_agency_tours
CREATE POLICY "Permitir leitura pública de passeios" ON jeri_agency_tours FOR SELECT TO public USING (active = true);
CREATE POLICY "Permitir inserção para usuários autenticados - passeios" ON jeri_agency_tours FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização para usuários autenticados - passeios" ON jeri_agency_tours FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Políticas RLS para jeri_agency_helicopter_tours
CREATE POLICY "Permitir leitura pública de voos de helicóptero" ON jeri_agency_helicopter_tours FOR SELECT TO public USING (active = true);
CREATE POLICY "Permitir inserção para usuários autenticados - helicóptero" ON jeri_agency_helicopter_tours FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização para usuários autenticados - helicópte" ON jeri_agency_helicopter_tours FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Inserir dados iniciais
INSERT INTO event_types (name) VALUES 
('Casamento'),
('Aniversário'),
('Ensaio Fotográfico'),
('Formatura')
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (name, description, discount_percentage, installments) VALUES 
('À Vista', 'Pagamento à vista com desconto', 10.00, 1),
('Cartão de Crédito', 'Parcelamento no cartão', 0.00, 12),
('PIX', 'Pagamento via PIX', 5.00, 1),
('Boleto', 'Pagamento via boleto bancário', 0.00, 1)
ON CONFLICT DO NOTHING;

-- Inserir configurações padrão
INSERT INTO settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;