# Diagnóstico de Migração — Cupim na Telha
### Da hospedagem Emergent para sistema local/desktop Windows

> Documento gerado por análise **somente leitura** do repositório na branch `CUPIM-NA-TELHA-SISTEMA` (checkout atual), comparando com `main` e `remotes/origin/conflict_090926_1622`. Nenhum arquivo do projeto foi alterado durante esta análise.

---

## Sumário Executivo

O **Cupim na Telha** é um sistema web de gestão de entregas (delivery), 100% em português, sem autenticação, com **arquitetura containerizada em Docker** (React + FastAPI + MongoDB + Nginx) já preparada para rodar **localmente em Windows via Docker Desktop**, com sincronização em tempo real via WebSocket entre múltiplos dispositivos na mesma rede local. A branch `CUPIM-NA-TELHA-SISTEMA` é, comprovadamente, a mais completa e atual das três branches do repositório, e **já contém toda a documentação e os scripts necessários para instalação local** — a dependência da Emergent está restrita à pasta `.emergent/` (infraestrutura da ferramenta de desenvolvimento) e não ao runtime da aplicação.

---

## 1. Qual é a arquitetura atual do sistema?

Arquitetura de 3 camadas, totalmente containerizada via **Docker Compose** (`docker-compose.yml`):

```
[Navegador] → :3000 → [Nginx + build React estático] → proxy /api → :8001 → [FastAPI] → :27017 → [MongoDB]
```

- **`frontend`** (container Nginx alpine): serve o build estático do React e faz proxy reverso de `/api` para o backend (`nginx.conf`, linhas 7-18).
- **`backend`** (container Python 3.11-slim): API FastAPI + WebSocket, na porta `8001`.
- **`mongodb`** (container oficial `mongo:7.0`): banco de dados, porta `27017`, com volume nomeado `mongodb_data` para persistência.
- Rede interna dedicada `cupim-network` (bridge) conecta os 3 containers; só as portas `3000` (frontend) e `8001`/`27017` são publicadas no host.

Isso já é, em essência, uma arquitetura "local-first": tudo roda em containers na própria máquina, sem nenhum serviço externo obrigatório.

---

## 2. Como é o frontend?

- **Framework:** React 19 + `react-scripts` 5.0.1 via **CRACO** (`craco start`/`craco build`), JavaScript puro (não TypeScript).
- **UI:** shadcn/ui ("new-york" style, `components.json`) sobre Tailwind CSS + Radix UI, ícones `lucide-react`, toasts via `sonner`.
- **Arquivo principal:** `frontend/src/App.js`, com **2680 linhas** — componente único monolítico contendo todo o estado, chamadas de API e JSX das 6 (na prática, 8 implementadas) telas.
- **Comunicação com backend:** `axios`, usando `BACKEND_URL = process.env.REACT_APP_BACKEND_URL` (variável de ambiente injetada em tempo de build, pois é Create React App/CRACO).
- **Sem roteamento** (`react-router-dom` está nas dependências mas não é usado em `App.js` — navegação é 100% por abas `Tabs` internas, sem URLs distintas).
- **Sem persistência client-side**: nenhum uso de `localStorage`/`sessionStorage`/cookies — todo estado vem do backend via `loadData()`.

---

## 3. Como é o backend?

- **Framework:** FastAPI (`fastapi==0.110.1`) + Uvicorn, arquivo único `backend/server.py` (**1110 linhas**).
- **Driver MongoDB:** `motor` (assíncrono) via `AsyncIOMotorClient`.
- **CORS:** liberado por variável de ambiente `CORS_ORIGINS` (default `*`).
- **Geração de arquivos:** `openpyxl` (Excel), `reportlab` (PDF), `zipfile`/`io` (backups em ZIP) — tudo gerado em memória (`io.BytesIO`) e devolvido como `StreamingResponse`, sem gravar em disco no servidor.
- **Sem autenticação:** apesar de `bcrypt`, `passlib`, `python-jose`, `PyJWT` estarem no `requirements.txt`, **nenhum desses pacotes é usado em `server.py`** — são dependências herdadas do template-base da Emergent (`fastapi_react_mongo_shadcn_base_image`), não utilizadas pelo código real.
- **`ROOT_DIR / '.env'`** é carregado via `python-dotenv`, mas **não existe arquivo `backend/.env` no repositório** (nem rastreado no git, nem presente no disco atual) — em Docker Compose as variáveis (`MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`) são injetadas diretamente pelo `environment:` do `docker-compose.yml`, então isso não é um problema no fluxo Docker atual, mas seria necessário criar esse `.env` para rodar o backend fora de container.

---

## 4. Onde e como fica armazenado o banco de dados?

- **MongoDB 7.0**, rodando em container Docker separado.
- **Nome do banco:** `cupim_telha` (variável `DB_NAME`, `docker-compose.yml` linha 31).
- **Persistência:** volume Docker nomeado `mongodb_data` (`docker-compose.yml` linhas 54-56), mapeado para `/data/db` dentro do container — os dados **sobrevivem** a `docker-compose down` e a reinicializações do container/computador, e só são perdidos com `docker-compose down -v` (remove volumes) ou remoção manual do volume.
- **Coleções usadas:** `deliveries`, `cash_entries`, `deliverers`, `employee_payments`, `stock_items`, `clients_pool`.
- **Sem índices, sem replicação, sem autenticação de banco configurada** (Mongo roda sem usuário/senha, aberto na rede interna do Docker) — adequado para uso local single-tenant, mas **não deve ser exposto diretamente à internet**.

---

## 5. Como funciona o WebSocket / tempo real?

- Endpoint nativo FastAPI: `@app.websocket("/api/ws")` (`server.py` linhas 79-88), gerenciado por uma classe `ConnectionManager` simples (lista de conexões ativas em memória, sem Redis/pub-sub externo).
- **Cobertura 100%**: todos os 13 endpoints de escrita (`POST`/`PATCH`/`DELETE` de cash, deliveries, deliverers, employee-payments, stock, e `data/clear`) chamam `ws_manager.broadcast(event_type, resource, resource_id)` após a operação no banco.
- **18 tipos de eventos** mapeados no frontend (`EVENT_LABELS`, `App.js` linhas 115-134), cada um disparando um toast informativo (`sonner`).
- **Padrão "invalidate-all-on-any-event"**: ao receber qualquer mensagem WS, o frontend sempre chama `loadData()` (refetch completo dos 6 endpoints GET via `Promise.all`) — simples e robusto, porém gera mais tráfego de rede do que uma atualização granular seria.
- **Reconexão automática**: se a conexão cair, o frontend tenta reconectar a cada 3 segundos (`setInterval`, `App.js` linha 174-176) até ter sucesso; também força reconexão + refetch quando a aba do navegador volta a ficar visível (`visibilitychange`).
- **Ponto de atenção para migração:** a URL do WebSocket é montada a partir de `window.location.host` (mesmo host/porta que serve o frontend), **não** usa `REACT_APP_BACKEND_URL`. Isso funciona hoje porque o Nginx faz proxy de `/api` (incluindo upgrade de conexão, `nginx.conf` linhas 10-12) para o backend na mesma origem — se essa topologia (frontend e backend sob o mesmo domínio/porta via proxy) for mantida na migração, o WebSocket continua funcionando sem alterações.

---

## 6. Como funciona a "atualização simultânea" entre usuários/dispositivos?

Não existe um mecanismo de "lock" ou controle de concorrência explícito — a sincronização simultânea é inteiramente baseada no WebSocket descrito acima:

1. Dispositivo A cria/edita/exclui um registro → requisição HTTP ao backend.
2. Backend persiste no MongoDB e imediatamente faz `broadcast()` a **todos** os clientes WebSocket conectados (incluindo o próprio dispositivo A).
3. Cada dispositivo conectado (B, C, D...) recebe o evento e recarrega automaticamente **todos** os seus dados (`loadData()`), refletindo a mudança sem precisar de F5 manual.
4. Se um dispositivo estiver momentaneamente desconectado (rede instável, aba em background), ele reconecta automaticamente e força uma sincronização completa ao reconectar ou ao voltar à aba.

Não há resolução de conflito otimista/pessimista (last-write-wins implícito no MongoDB) — para o caso de uso (equipe pequena, delivery), isso é aceitável, mas é bom deixar claro que **duas edições simultâneas no mesmo registro** resultam na última escrita vencendo, sem aviso de conflito.

---

## 7. O que depende hoje da plataforma Emergent?

Levantamento exaustivo de tudo que referencia Emergent no repositório:

| Item | Dependência real da Emergent? | Detalhe |
|---|---|---|
| `.emergent/emergent.yml` | Apenas metadado | `env_image_name: "fastapi_react_mongo_shadcn_base_image_cloud_arm:release-17122025-2"` — identifica a imagem-base cloud usada para criar o ambiente de desenvolvimento na Emergent. Não é lido pelo `server.py`/`App.js`. |
| `.emergent/system_deps.txt` | Apenas metadado | Lista `cron=3.0pl1-162` instalado no pod cloud. |
| `.emergent/cron/*.sh` (3 scripts) | **Sim, infraestrutura da plataforma** | `dispatch_webhook.sh`, `watch_crons.sh`, `webhook_crond.sh` chamam a API interna da Emergent (`$CRON_API_URL/internal/crons/reconcile`), leem `WEBHOOK_CRON_SECRET`, e gerenciam `crond` dentro do **pod de preview da Emergent**. Não são chamados por nenhum script `.bat`/`.sh` do projeto nem pelo `docker-compose.yml`. |
| `.emergent/markers/.bootstrap-complete` / `.restore-complete` | Apenas metadado | Arquivos vazios (flags internas de estado do ambiente Emergent). |
| `.gitconfig` (raiz) | Apenas metadado | `user.email = github@emergent.sh`, `user.name = emergent-agent-e1` — identidade de commit do agente automatizado, não afeta runtime. |
| `backend/requirements.txt` | **Herança, não uso ativo** | Pacotes como `boto3`, `s3transfer`, `s5cmd` (AWS S3), `bcrypt`/`passlib`/`python-jose`/`PyJWT` (auth) vêm do template-base da Emergent, mas **não são importados em `server.py`** — são "peso morto" que pode ser removido com segurança. |
| `docker-compose.yml`, `Dockerfile.*`, `nginx.conf`, scripts `.bat/.sh` | **Nenhuma dependência** | Não referenciam Emergent em nenhuma linha; usam apenas Docker Hub (`mongo:7.0`, `python:3.11-slim`, `node:18-alpine`, `nginx:alpine`) — imagens públicas padrão, não específicas da Emergent. |
| `backend/server.py`, `frontend/src/App.js` | **Nenhuma dependência** | Nenhuma menção, import ou chamada a domínios/SDKs da Emergent em todo o código de negócio. |

**Conclusão:** a aplicação em si (código de negócio) **não tem nenhuma dependência funcional da Emergent**. A única dependência real está isolada na pasta `.emergent/` (cron/webhooks do ambiente de desenvolvimento cloud), que **pode ser removida ou ignorada com segurança** na migração — ela não é acionada pelo Docker Compose nem pelos scripts de start/stop/empacotamento.

---

## 8. Quais alterações são necessárias para o sistema funcionar 100% local, sem a Emergent?

Curto prazo (para rodar hoje mesmo em um PC local):
1. **Nenhuma alteração de código é estritamente necessária** — a arquitetura Docker já é local-first.
2. Criar `backend/.env` (opcional se usar Docker Compose, pois as env vars já vêm do `docker-compose.yml`) ou confirmar que as variáveis `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` continuam sendo passadas via `environment:`.
3. Confirmar `frontend` build-time: `REACT_APP_BACKEND_URL` precisa estar definido corretamente para o ambiente local (hoje o Nginx faz proxy de `/api`, então o valor esperado é algo como vazio/relativo ou `http://localhost:3000`, dependendo de como o build foi gerado — **isso precisa ser validado/testado no host Windows de destino**, pois é uma variável embutida em tempo de build do React, não de runtime).

Médio prazo (limpeza recomendada, não bloqueante):
4. Remover a pasta `.emergent/` do pacote de distribuição final (os scripts `empacotar.bat`/`.sh` já não a incluem — confirmar).
5. Remover do `backend/requirements.txt` os pacotes não utilizados (`boto3`, `s3transfer`, `s5cmd`, `bcrypt`, `passlib`, `python-jose`, `PyJWT`, `oauthlib`, `requests-oauthlib`) para reduzir tamanho da imagem Docker e superfície de dependências.
6. Corrigir a inconsistência de UI: as abas "Funcionários" (`employees`) e "Backup" (`backup`) existem no código (`App.js`) mas **não têm botão de acesso no `TabsList`** (que só lista 6 das 8 abas implementadas) — isso deve ser corrigido antes de entregar ao cliente final, pois são funcionalidades completas e prontas, apenas inacessíveis pela interface.

---

## 9. Como fica a arquitetura de "2 notebooks"?

**Hoje não existe uma arquitetura formal de 2 notebooks documentada ou implementada.** O que existe, no `README-INSTALACAO.md`, é uma seção opcional "Acessando de Outros Dispositivos": qualquer dispositivo na mesma rede local (Wi-Fi/cabo) pode acessar `http://IP-DO-COMPUTADOR:3000`, onde `IP-DO-COMPUTADOR` é o IP local (`ipconfig`) da máquina que está rodando os containers Docker.

Isso significa que, na prática, **um modelo simples de "servidor + cliente" já é possível hoje sem nenhuma alteração de código**:
- **Notebook A ("servidor")**: roda `docker-compose up -d` (todos os 3 containers: Mongo, backend, frontend/Nginx).
- **Notebook B ("cliente")**: apenas abre o navegador em `http://IP-DO-NOTEBOOK-A:3000` — não precisa Docker instalado nele.
- A sincronização em tempo real (WebSocket) funciona normalmente entre os dois, pois ambos acessam o mesmo backend/Mongo do Notebook A.

**Limitações desse modelo simples:**
- O Notebook A precisa estar sempre ligado e com os containers rodando para o Notebook B funcionar (não há replicação entre bancos, é um único ponto de banco de dados).
- O IP local pode mudar (DHCP) a cada reinicialização do roteador — não há DNS local ou IP fixo configurado nos guias atuais.
- Não há um segundo MongoDB no Notebook B; é sempre acesso remoto ao banco do Notebook A pela rede local.

Se o requisito real for **dois bancos de dados independentes com sincronização/replicação** (cada notebook funcionando standalone e depois sincronizando), isso **não existe hoje** e exigiria desenvolvimento adicional (ex.: MongoDB replica set, ou uma camada de sync). Recomenda-se esclarecer com o cliente qual dos dois modelos ("um servidor + um cliente fino" vs. "dois bancos independentes sincronizados") é o desejado antes de planejar essa parte.

---

## 10. Onde fica o banco de dados fisicamente?

No **volume Docker `mongodb_data`**, gerenciado pelo próprio Docker Desktop no sistema de arquivos do Windows (tipicamente dentro da VM do WSL2 usada pelo Docker Desktop, não em um caminho comum do Windows como `C:\Cupim\...`). Para acessar/copiar os arquivos de banco diretamente seria necessário usar comandos Docker (ex.: `docker-compose exec mongodb mongodump`, já documentado no `README-INSTALACAO.md`) — não é um arquivo único e portátil como um `.mdb`/`.sqlite`, é gerenciado internamente pelo MongoDB dentro do volume.

---

## 11. Como funciona a sincronização em tempo real hoje (resumo funcional)?

(Detalhado nas perguntas 5 e 6.) Em resumo: **push via WebSocket + refetch total no cliente**. Todo cliente conectado ao mesmo backend recebe notificação instantânea de qualquer mudança e recarrega os dados automaticamente — não depende de polling, nem de F5 manual, nem de reload de página.

---

## 12. Como funciona o backup hoje?

Dois mecanismos, ambos implementados 100% no backend e disparados pelo frontend:

1. **Backup por data** (`POST /api/backup`, aba "Backup" — atualmente inacessível via UI, ver item 8.6): recebe uma data (`YYYY-MM-DD`), filtra entregas/caixa/pagamentos daquele dia, e gera um **ZIP com 1 Excel + 4 PDFs** (Resumo de Caixa, Relatório Geral de Entregas, Relatórios por Forma de Pagamento, Pagamentos de Funcionários) — tudo gerado em memória, baixado direto pelo navegador.
2. **Backup completo automático** (`POST /api/backup/full`): disparado **automaticamente** sempre que o usuário clica em "Limpar Tudo" (com dupla confirmação via `window.confirm`), antes de executar `DELETE /api/data/clear` — gera um ZIP com **todos os dados históricos** (Excel completo com 4 abas + PDF resumo), como proteção contra perda acidental de dados.
3. **Backup do banco em nível de infraestrutura**: documentado no `README-INSTALACAO.md` via `docker-compose exec mongodb mongodump --out /data/backup` — um backup manual completo do MongoDB, fora do fluxo da aplicação.

Não há backup automático agendado (ex.: cron diário) implementado hoje — todos os backups são acionados manualmente pelo usuário.

---

## 13. Como é a instalação no Windows hoje?

Documentada em três arquivos redundantes (`GUIA-INSTALACAO-WINDOWS.md`, `INSTALACAO-RAPIDA.txt`, `README-INSTALACAO.md`), todos convergindo para o mesmo fluxo:

1. Instalar **Docker Desktop for Windows** (requer WSL2), reiniciar o computador.
2. Descompactar o pacote ZIP do sistema em uma pasta local (ex.: `C:\Cupim`).
3. Dar duplo clique em **`start-cupim.bat`** — o script verifica se o Docker está instalado, executa `docker-compose up -d`, espera 3 segundos e abre automaticamente `http://localhost:3000` no navegador padrão.
4. Usar o sistema normalmente pelo navegador.
5. Para parar: duplo clique em **`stop-cupim.bat`** (`docker-compose down`).

Não é necessário instalar Python, Node.js ou MongoDB separadamente — tudo roda dentro dos containers Docker, orquestrados pelo `docker-compose.yml`.

---

## 14. O sistema depende de internet para funcionar no dia a dia?

**Não.** Os três guias de instalação afirmam explicitamente que o sistema "funciona 100% offline" após a instalação inicial. Internet é necessária apenas:
- Na primeira execução, para o Docker baixar as imagens base (`mongo:7.0`, `python:3.11-slim`, `node:18-alpine`, `nginx:alpine`) — cerca de 5-10 minutos conforme o guia.
- Se o usuário quiser reconstruir as imagens do zero (`docker-compose up --build`) após atualizar o código.

No uso diário (registrar entregas, caixa, backups, impressão de cupom), tudo acontece localmente entre o navegador, o Nginx, o FastAPI e o MongoDB, todos na mesma máquina (ou rede local, no caso de acesso multi-dispositivo).

---

## 15. Qual é o custo mensal de hospedagem hoje (Emergent) vs. local?

O repositório **não contém nenhuma informação de billing/custo da Emergent** (não há arquivos de configuração de plano, cobrança ou métricas de uso). Não é possível determinar o custo mensal exato apenas pela análise do código — essa informação está na conta/painel da Emergent, fora do escopo do que pode ser lido no repositório.

O que pode ser afirmado com base na arquitetura: ao migrar para **execução local em Windows via Docker Desktop**, o custo de hospedagem recorrente da Emergent deixaria de existir, restando apenas custo de energia/hardware do(s) computador(es) já possuídos pelo cliente — não há necessidade de servidor cloud, storage externo pago, ou licenças adicionais (MongoDB Community, Nginx, Python e Node são todos gratuitos/open-source nas versões usadas).

---

## 16. Como exportar/migrar os dados atuais da Emergent?

O sistema já expõe os mecanismos necessários sem precisar de acesso direto ao banco da Emergent:

1. **Opção recomendada — Backup completo pela própria aplicação:** acessar a URL atual do sistema (ainda hospedado na Emergent) e usar o endpoint `POST /api/backup/full` (ou o botão "Gerar Backup" da aba Backup, uma vez que ela seja tornada acessível — ver item 8.6) para baixar um ZIP com Excel completo (todas as entregas, caixa, funcionários, entregadores) — isso serve como export funcional dos dados de negócio, mas **não preserva os IDs internos/relacionamentos brutos do MongoDB**, apenas os dados "de leitura".
2. **Opção completa — Dump direto do MongoDB:** se houver acesso ao ambiente Emergent via terminal/SSH, executar `mongodump` no banco `cupim_telha` para obter um dump binário BSON completo (preserva 100% da estrutura, IDs e relacionamentos), depois restaurar com `mongorestore` no MongoDB local (container Docker no Windows). Este é o método que preserva integridade total dos dados.
3. Após restaurar os dados (por qualquer um dos dois métodos) no MongoDB local, o restante do sistema (backend/frontend) funciona de forma idêntica, pois a estrutura de coleções é a mesma.

---

## 17. É possível preservar todas as funcionalidades atuais?

**Sim, 100% das funcionalidades atuais podem ser preservadas na migração**, pois a arquitetura já é local-first e não depende de nenhum serviço exclusivo da Emergent. Lista completa de funcionalidades identificadas (para conferência):

**Telas/Abas:**
- Caixa (entradas/saídas)
- Entregas (cadastro, listas Ativas/Concluídas, filtros, busca multi-número)
- Resumo (tabela consolidada + export PDF)
- Relatórios (7 formas de pagamento: PIX, Cartão, Dinheiro, Pago, Vem Retirar, Marcar, Pagou a Conta — com impressão de cupom e drill-down)
- Estoque (cadastro, controle de quantidade/vendidos, alerta visual de estoque baixo/zerado)
- Entregadores (cadastro, cores automáticas, estatísticas)
- Funcionários (pagamentos — implementada mas hoje sem botão de acesso na UI)
- Backup (por data e completo — implementada mas hoje sem botão de acesso na UI)

**Cadastros (CRUD):** caixa, entregas, entregadores, pagamentos de funcionários, itens de estoque.

**Cálculos:** saldo de caixa, totais/pendências/receita do dashboard, totais por forma de pagamento (com suporte a pagamento dividido/split em 2 formas), cálculo automático de troco (1ª e 2ª forma de pagamento), estoque restante/vendido/valor.

**APIs/Endpoints (17 rotas + WebSocket):** `/api/cash`, `/api/deliveries`, `/api/deliverers`, `/api/employee-payments`, `/api/stock`, `/api/clients/pool`, `/api/export/{excel,summary-pdf,reports-pdf,employees-pdf}`, `/api/backup`, `/api/backup/full`, `/api/data/clear`, `/api/ws`.

**Outras funcionalidades:** impressão de cupom fiscal (via navegador, formatado para impressora térmica 80mm — sem SDK de impressora específico), exportação Excel/PDF, backup em ZIP, sincronização em tempo real via WebSocket entre dispositivos, autocomplete de nomes de clientes.

**Autenticação/Permissões:** **não existem hoje** (sistema de acesso livre) — se isso for um requisito novo para a versão local/desktop, seria uma funcionalidade **adicional**, não uma preservação.

---

## 18. O sistema funciona sem o Verdent (ferramenta de desenvolvimento)?

**Sim.** O Verdent (assim como a Emergent) é uma ferramenta/ambiente de desenvolvimento assistido por IA usada para editar o código-fonte — não é uma dependência de runtime da aplicação "Cupim na Telha". O sistema roda inteiramente a partir de `docker-compose up -d`, sem qualquer processo, serviço ou chamada de rede relacionada a ferramentas de desenvolvimento (Verdent, Emergent ou qualquer outra). Uma vez que o código esteja empacotado (via `empacotar.bat`/`.sh`) e instalado no computador do cliente, nenhuma dessas ferramentas precisa estar presente ou acessível.

---

## 19. Qual branch é a mais atual e completa?

# `CUPIM-NA-TELHA-SISTEMA` (branch atualmente em checkout)

Evidências concretas da comparação read-only entre as 3 branches:

| Critério | `main` | **`CUPIM-NA-TELHA-SISTEMA`** | `origin/conflict_090926_1622` |
|---|---|---|---|
| Total de commits | 51 | **75** | 8 |
| Commit mais recente | 2026-01-09 | **2026-09-10** (mais recente de todas) | 2026-09-09 |
| Infraestrutura Docker completa | ❌ Não tem | ✅ Sim (Dockerfiles, compose, nginx, scripts) | ❌ Não tem |
| WebSocket/tempo real | ❌ Não tem | ✅ Sim (cobertura 100%, testada) | N/A (projeto diferente) |
| `server.py` | 684 linhas | **1110 linhas** | N/A |
| `App.js` | 1899 linhas | **2680 linhas** | N/A |
| Documentação de instalação/PRD | ❌ Não tem | ✅ Sim (3 guias + PRD) | N/A |
| Testes automatizados dedicados | ❌ Não tem | ✅ Sim (2 arquivos, 699 linhas) | N/A (testes de outro sistema) |
| Relação com o projeto "Cupim na Telha" | Versão antiga do mesmo projeto | **Versão atual e completa** | **Projeto totalmente diferente** ("FELCONT Reports AI", sistema de relatórios contábeis) |

**Detalhamento importante:** as três branches têm históricos de commit **totalmente independentes** (sem ancestral comum — `git merge-base` falha entre todos os pares). Isso significa que não há "commits pendentes de merge" entre elas no sentido tradicional:
- `main` é um **snapshot anterior e mais simples** do mesmo projeto Cupim na Telha (sem Docker, sem WebSocket) — está desatualizada e não contém nada de valor que não exista, superado, em `CUPIM-NA-TELHA-SISTEMA`.
- `origin/conflict_090926_1622` **não é uma variante do Cupim na Telha** — é um projeto de software completamente diferente ("FELCONT Reports AI", relatórios gerenciais/contábeis para outro cliente) que compartilha o mesmo repositório remoto, provavelmente por reuso de infraestrutura de deploy da Emergent. Não deve ser considerada na decisão de migração do Cupim na Telha.

**Recomendação:** seguir com `CUPIM-NA-TELHA-SISTEMA` como base única para a migração — é a única branch funcionalmente completa, testada e documentada para este projeto.

---

## 20. Plano de migração recomendado

### Fase 1 — Preparação (sem risco, reversível)
1. Confirmar que `CUPIM-NA-TELHA-SISTEMA` é a branch de trabalho (✅ já é).
2. Extrair um backup completo dos dados atuais da instância hospedada na Emergent (via `POST /api/backup/full` ou `mongodump`, ver item 16).
3. Revisar e corrigir a inconsistência de UI das abas "Funcionários"/"Backup" (adicionar os `TabsTrigger` faltantes no `TabsList`) — pequena mudança de frontend, sem risco para dados.

### Fase 2 — Instalação local de teste (ambiente controlado)
4. Instalar Docker Desktop no computador Windows de destino (ou nos dois notebooks, se for adotado o modelo servidor+cliente do item 9).
5. Executar `start-cupim.bat` em um ambiente de teste, validar que os 3 containers sobem corretamente (`docker-compose logs`).
6. Restaurar o backup de dados extraído na Fase 1 (via `mongorestore` no container MongoDB local, ou reinserindo manualmente via importação, dependendo do método de export escolhido).
7. Testar manualmente todas as telas e fluxos críticos: cadastro de entrega, caixa, estoque, entregadores, impressão de cupom, exportações, backup, WebSocket (abrir em 2 abas/dispositivos e confirmar sincronização em tempo real).

### Fase 3 — Decisão sobre arquitetura de 2 notebooks
8. Esclarecer com o cliente qual modelo é necessário: (a) servidor único + cliente(s) fino(s) via IP de rede local (já funciona hoje, sem desenvolvimento adicional) ou (b) dois bancos independentes com sincronização/replicação (exige desenvolvimento adicional, não implementado hoje).
9. Se (a): documentar/fixar o IP local do notebook-servidor (ou configurar hostname local) para evitar que o cliente precise reconfigurar a cada mudança de IP DHCP.

### Fase 4 — Limpeza e hardening (opcional, recomendado)
10. Remover a pasta `.emergent/` do pacote final de distribuição (confirmar que `empacotar.bat`/`.sh` já não a inclui).
11. Remover dependências não usadas do `backend/requirements.txt` (pacotes de auth/AWS não referenciados no código).
12. Considerar adicionar autenticação básica (login/senha) se o ambiente de produção local for exposto além da rede local confiável, já que hoje não há nenhum controle de acesso.
13. Considerar agendamento automático de backup (hoje é 100% manual).

### Fase 5 — Corte final (go-live)
14. Instalar definitivamente no(s) computador(es) do cliente seguindo o `GUIA-INSTALACAO-WINDOWS.md`.
15. Restaurar os dados de produção (backup final, feito imediatamente antes do corte, para minimizar dados perdidos entre o backup de teste e o corte real).
16. Desativar/encerrar a instância na Emergent somente após confirmação de que o ambiente local está operando corretamente por um período de observação.

---

## Apêndice A — Inventário completo de endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| WS | `/api/ws` | Conexão WebSocket para eventos em tempo real |
| GET | `/api/` | Health check |
| POST/GET/DELETE | `/api/cash`, `/api/cash/{id}` | Movimentações de caixa |
| POST/GET/PATCH/DELETE | `/api/deliveries`, `/api/deliveries/{id}` | Entregas |
| POST/GET/DELETE | `/api/deliverers`, `/api/deliverers/{id}` | Entregadores |
| POST/GET/DELETE | `/api/employee-payments`, `/api/employee-payments/{id}` | Pagamentos de funcionários |
| POST/GET/PATCH/DELETE | `/api/stock`, `/api/stock/{id}` | Itens de estoque |
| GET | `/api/clients/pool` | Lista de nomes de clientes (autocomplete) |
| GET | `/api/export/excel` | Exportação Excel geral (4 abas) |
| GET | `/api/export/summary-pdf` | PDF resumo de entregas |
| GET | `/api/export/reports-pdf` | PDF de relatórios por forma de pagamento |
| GET | `/api/export/employees-pdf` | PDF de pagamentos de funcionários |
| POST | `/api/backup` | Backup ZIP por data (Excel + 4 PDFs) |
| POST | `/api/backup/full` | Backup ZIP completo (todos os dados históricos) |
| DELETE | `/api/data/clear` | Limpa todas as coleções (usado após backup automático) |

## Apêndice B — Variáveis de ambiente identificadas

| Variável | Onde é usada | Valor no `docker-compose.yml` | Observação |
|---|---|---|---|
| `MONGO_URL` | `backend/server.py:28` | `mongodb://mongodb:27017` | Obrigatória, sem valor default (`os.environ['MONGO_URL']` lança erro se ausente) |
| `DB_NAME` | `backend/server.py:30` | `cupim_telha` | Obrigatória, mesma observação acima |
| `CORS_ORIGINS` | `backend/server.py:38` | `*` | Opcional, default `*` |
| `REACT_APP_BACKEND_URL` | `frontend/src/App.js:18`, `backend/tests/*.py` | Não definida no `docker-compose.yml` (é variável de build-time do React, não de runtime do container Nginx) | **Ponto de atenção**: precisa ser confirmada/definida no momento do `yarn build` (Dockerfile.frontend), não pode ser alterada depois do build sem rebuildar a imagem |

Não foi encontrado nenhum arquivo `.env` real (`backend/.env` ou `frontend/.env`) no repositório nem no disco — todas as variáveis atuais vêm exclusivamente do `docker-compose.yml`.

## Apêndice C — Dependências do `requirements.txt` sem uso confirmado no código

`boto3`, `botocore`, `s3transfer`, `s5cmd` (AWS), `bcrypt`, `passlib`, `python-jose`, `PyJWT`, `oauthlib`, `requests-oauthlib` (autenticação), `black`, `flake8`, `mypy`, `isort`, `pycodestyle`, `pyflakes`, `mccabe` (ferramentas de lint/formatação, não runtime). Nenhum destes é importado em `backend/server.py`. Candidatos a remoção segura, reduzindo a imagem Docker e a superfície de dependências herdadas do template-base da Emergent.
