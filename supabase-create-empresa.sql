-- Tabela para cadastro da empresa
CREATE TABLE IF NOT EXISTS empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    -- Endereço
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    -- Responsável
    responsavel_nome VARCHAR(255),
    responsavel_cpf VARCHAR(14),
    responsavel_celular VARCHAR(20),
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela para anexos de documentos da empresa
CREATE TABLE IF NOT EXISTS empresa_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    url TEXT NOT NULL, -- Armazena a URL do documento no storage
    tipo VARCHAR(50), -- 'pdf', 'png', 'jpg', etc.
    tamanho INTEGER, -- em bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Políticas de RLS (Row Level Security) - Somente Admin
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_documentos ENABLE ROW LEVEL SECURITY;

-- Política para a tabela empresa
DROP POLICY IF EXISTS "Admins podem fazer tudo na tabela empresa" ON empresa;
CREATE POLICY "Admins podem fazer tudo na tabela empresa"
ON empresa
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profissionais
    WHERE profissionais.auth_user_id = auth.uid()
    AND (profissionais.role = 'admin' OR profissionais.role = 'administrador')
  )
);

-- Política para a tabela empresa_documentos
DROP POLICY IF EXISTS "Admins podem fazer tudo na tabela empresa_documentos" ON empresa_documentos;
CREATE POLICY "Admins podem fazer tudo na tabela empresa_documentos"
ON empresa_documentos
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profissionais
    WHERE profissionais.auth_user_id = auth.uid()
    AND (profissionais.role = 'admin' OR profissionais.role = 'administrador')
  )
);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_empresa_updated_at ON empresa;
CREATE TRIGGER update_empresa_updated_at
BEFORE UPDATE ON empresa
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Fim do script de criação da empresa

/*
  CONFIGURAÇÃO DO STORAGE (SUPABASE STORAGE)
  -----------------------------------------
  1. Crie um bucket chamado "documentos"
  2. Defina-o como PÚBLICO (Public)
  3. Adicione as seguintes políticas de segurança para o bucket:
*/

-- Permissão para upload (INSERT)
-- CREATE POLICY "Permitir upload para admins" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'documentos' AND
--   (EXISTS (SELECT 1 FROM public.profissionais WHERE auth_user_id = auth.uid() AND (role = 'admin' OR role = 'administrador')))
-- );

-- Permissão para leitura (SELECT)
-- CREATE POLICY "Permitir leitura para autenticados" ON storage.objects FOR SELECT USING (
--   bucket_id = 'documentos' AND auth.role() = 'authenticated'
-- );

-- Permissão para exclusão (DELETE)
-- CREATE POLICY "Permitir exclusão para admins" ON storage.objects FOR DELETE USING (
--   bucket_id = 'documentos' AND
--   (EXISTS (SELECT 1 FROM public.profissionais WHERE auth_user_id = auth.uid() AND (role = 'admin' OR role = 'administrador')))
-- );

