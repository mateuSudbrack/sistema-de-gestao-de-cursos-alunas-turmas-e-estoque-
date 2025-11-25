# Estética Pro Manager - Guia de Deploy

## 1. Banco de Dados (PostgreSQL)

Acesse seu servidor (`168.138.249.20`) e execute o seguinte SQL para criar as tabelas necessárias. Este schema é compatível com os recursos de Arrays e JSONB do Postgres.

```sql
-- 1. Tabela de Alunos e Leads
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    photo TEXT,
    type VARCHAR(20) DEFAULT 'lead', -- 'lead' ou 'student'
    status VARCHAR(50) DEFAULT 'Interessado',
    "pipelineId" VARCHAR(100) DEFAULT 'default-system-pipeline',
    "stageId" VARCHAR(100),
    "interestedIn" TEXT[], -- Array de strings (IDs de cursos)
    history JSONB DEFAULT '[]',
    "lastContact" DATE,
    "nextFollowUp" DATE,
    "lastPurchase" DATE,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Configurações Globais (Cursos, Estoque, Vendas, Pipelines, Configs)
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
```

---

## 2. Backend (Node.js API)

Este serviço conecta o Frontend ao Banco de Dados e recebe os Webhooks do WhatsApp.

1.  Faça upload da pasta `backend` para seu servidor.
2.  Instale as dependências: 
    ```bash
    cd backend
    npm install
    ```
3.  Crie um arquivo `.env` na pasta `backend`:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=postgres
    DB_PASSWORD=sua_senha_se_tiver
    DB_NAME=postgres
    # Configuração Evolution API (Opcional, preenchida via Frontend também)
    EVOLUTION_API_URL=https://api.seusite.com
    EVOLUTION_API_KEY=sua-api-key-global
    INSTANCE_NAME=NomeDaInstancia
    ```
4.  Rode o servidor (use PM2 para produção):
    ```bash
    pm2 start server.js --name estetica-api
    ```

---

## 3. Frontend

1.  No arquivo `App.tsx`, a variável `API_BASE_URL` aponta para `http://localhost:3000` por padrão.
2.  Para produção, configure a variável de ambiente no seu build (Vercel/Netlify/Vite):
    *   `VITE_API_URL`: `http://168.138.249.20:3000` (ou seu domínio HTTPS).
