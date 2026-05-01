# MORIA — Setup para Demonstração

Existem dois fluxos: **local** (Supabase CLI, tudo automático) e **nuvem** (Supabase hosted, manual).

---

## Opção A — Local com Supabase CLI (recomendado para dev)

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Node.js 18+

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o banco local

```bash
npm run db:start
```

Isso inicia o Postgres, Auth, Storage e Studio localmente via Docker.
Na primeira vez demora ~2 min para baixar as imagens.

### 3. Configurar variáveis de ambiente automaticamente

```bash
npm run setup
```

O script lê a saída do `supabase status` e escreve o `.env.local` automaticamente.

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

**Ferramentas locais:**
- Studio (admin do banco): http://127.0.0.1:54323
- Inbucket (emails de teste): http://127.0.0.1:54324

### Comandos úteis

```bash
npm run db:reset      # Reaplica todas as migrations + seed (limpa o banco)
npm run db:types      # Regenera types/supabase.ts a partir do schema local
npm run db:stop       # Para o Docker do Supabase
```

---

## Opção B — Nuvem Supabase (para demo em produção)

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Anote: **Project URL** e **anon key** (Settings → API)
3. Anote também a **service_role key** (manter em segredo)

### 2. Aplicar schema e dados

```bash
# Vincular ao projeto remoto (roda uma vez)
npm run db:link
# → informe o Project ID quando solicitado (encontrado em Settings → General)

# Enviar todas as migrations para o banco remoto
npm run db:push

# Executar seed manualmente no SQL Editor do Supabase:
# Cole o conteúdo de supabase/seed.sql
```

### 3. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rodar o projeto

```bash
npm install
npm run dev
```

---

## Criar usuário Admin (para demo)

Após criar uma conta normal no app, execute no **SQL Editor** do Supabase (local: Studio em http://127.0.0.1:54323):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'SEU-USER-ID-AQUI';
```

O User ID aparece em **Authentication → Users** no Supabase.

Depois acesse: http://localhost:3000/admin

---

## Fluxo de demonstração sugerido

### Como cliente
1. `/` — Landing page
2. `/register` → criar conta
3. `/dashboard` → ver início
4. `/plans` → escolher plano
5. `/wallet` → ver carteira com QR Code
6. `/appointments/new` → agendar (com prioridade pois é assinante)

### Como admin
1. `/admin/dashboard` → métricas
2. `/admin/clients` → lista de clientes
3. `/admin/barbers` → equipe
4. `/admin/plans` → gerenciar planos e serviços
5. `/admin/reports` → relatórios

### Demonstrar regra de 48h
- Logar com uma conta **sem** assinatura
- Tentar agendar para daqui a 3+ dias → bloqueado com mensagem clara
- Assinar um plano → agendamento liberado para qualquer data

---

## Estrutura do banco

As migrations ficam em `supabase/migrations/` e são aplicadas em ordem:

| Arquivo | Conteúdo |
|---------|----------|
| `20240101000001_initial_schema.sql` | Tabelas, enums, triggers, índices |
| `20240101000002_rls_policies.sql` | RLS, helper functions, Realtime |

Os dados iniciais (planos + serviços) ficam em `supabase/seed.sql` e são carregados automaticamente no `db:reset`.
