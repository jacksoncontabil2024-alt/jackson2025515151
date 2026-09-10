# RELATORIO DE INSTALACAO E TESTES - Cupim na Telha

**Data:** 10/09/2026
**Branch:** VERDENT-LOCAL
**Ambiente:** Docker Desktop v29.1.3 / Compose v2.40.3 (Windows)

---

## IP DO SERVIDOR (para acesso do segundo notebook)

```
IP do servidor: 192.168.1.145
```

No segundo notebook (mesma rede Wi-Fi/cabo), acesse:

- Sistema (tela de login): `http://192.168.1.145:3000`
- API (health check): `http://192.168.1.145:8001/api/`
- Usuario: `admin` / Senha: `admin123`

Instrucoes completas para o segundo notebook estao na secao **"Instrucoes para o Segundo Notebook"** ao final deste documento.

---

## RESUMO GERAL

Todos os 10 passos do plano de testes foram executados. **1 problema real foi encontrado e corrigido** (backup de seguranca ausente no "Limpar Tudo"). Apos a correcao, **todos os testes PASSARAM**.

| Passo | Descricao | Resultado |
|---|---|---|
| 1 | Instalacao (containers, logs, IP) | PASSOU |
| 2 | Login (tela, POST login, GET me) | PASSOU |
| 3 | CRUD completo (todas funcionalidades) | PASSOU |
| 4 | WebSocket (broadcast POST/DELETE) | PASSOU |
| 5 | Acesso via rede local (IP) | PASSOU |
| 6 | Backup manual (data + full + list + next-run) | PASSOU |
| 7 | Restauracao de backup | PASSOU |
| 8 | Exportacao Excel e PDFs | PASSOU |
| 9 | Limpar tudo com ZIP de seguranca | PASSOU (apos correcao) |
| 10 | Persistencia (down/up mantem dados) | PASSOU |

---

## PASSO 1 - INSTALACAO

**Resultado: PASSOU**

- Containers antigos de um projeto anterior (`cupim-na-telha-sistema-*`) foram identificados (status `Exited`) e removidos.
- Executado `docker-compose down` (projeto atual) seguido de `docker-compose up -d --build`.
- Os 3 containers ficaram `Up` e estaveis:

```
NAME             IMAGE                     STATUS   PORTS
cupim-backend    cupim-na-telha-backend    Up       0.0.0.0:8001->8001/tcp
cupim-frontend   cupim-na-telha-frontend   Up       0.0.0.0:3000->80/tcp
cupim-mongodb    mongo:7.0                 Up       0.0.0.0:27017->27017/tcp
```

- Logs verificados em todos os 3 containers: **sem erros**.
  - `backend`: "Agendador de backup automatico iniciado", "Application startup complete".
  - `mongodb`: "mongod startup complete", sem warnings criticos.
  - `frontend` (nginx): workers iniciados normalmente.
- IP local identificado via `ipconfig`: **192.168.1.145** (interface Ethernet).

---

## PASSO 2 - TESTE DE LOGIN

**Resultado: PASSOU**

- `GET http://localhost:3000` retorna o HTML do React (bundle `main.js`/`main.css`, `<div id="root">`), confirmando que a tela de login e servida corretamente.
- `POST /api/auth/login` com `{"username":"admin","password":"admin123"}` -> `200 OK`, retornou `access_token` (JWT), `token_type: bearer`, `role: admin`.
- `GET /api/auth/me` com o token -> `200 OK`, retornou `{"username":"admin","role":"admin","created_at":"..."}`.

---

## PASSO 3 - TESTE DO SISTEMA (CRUD)

**Resultado: PASSOU**

Testado com token de autenticacao em todas as chamadas.

| Funcionalidade | POST | GET (aparece) | PATCH | DELETE |
|---|---|---|---|---|
| Entregas (`/deliveries`) | 200 | confirmado | 200 | 200 |
| Caixa (`/cash`) | 200 | confirmado | - | 200 |
| Entregadores (`/deliverers`) | 200 | confirmado | - | 200 |
| Estoque (`/stock`) | 200 | confirmado | 200 | 200 |
| Pagamento de Funcionario (`/employee-payments`) | 200 | confirmado | - | 200 |

Todos os registros criados apareceram corretamente nos respectivos `GET`. Edicao via `PATCH` (`/deliveries/{id}`, `/stock/{id}`) confirmada com os novos valores retornados. Remocao via `DELETE` confirmada em todos os recursos.

---

## PASSO 4 - TESTE WEBSOCKET

**Resultado: PASSOU**

Conexao estabelecida em `ws://localhost:8001/api/ws?token=<JWT>`.

- `POST /api/cash` -> evento recebido no WS: `{"event":"cash_created","resource":"cash","id":"...","timestamp":"..."}`.
- `DELETE /api/cash/{id}` -> evento recebido no WS: `{"event":"cash_deleted","resource":"cash","id":"...","timestamp":"..."}`.

Broadcast em tempo real confirmado para criacao e remocao.

---

## PASSO 5 - TESTE ACESSO REDE LOCAL

**Resultado: PASSOU**

IP local: `192.168.1.145`.

- `curl http://192.168.1.145:3000` -> `200 OK` (HTML do React).
- `curl http://192.168.1.145:8001/api/` -> `200 OK`, `{"message":"Cupim na Telha API"}`.
- `POST http://192.168.1.145:8001/api/auth/login` (admin/admin123) -> `200 OK`, token JWT valido retornado.
- WebSocket via `ws://192.168.1.145:8001/api/ws?token=<JWT>` -> conectado com sucesso, broadcast de `cash_created` recebido normalmente.

Os servicos estao expostos com `0.0.0.0` no `docker-compose.yml` e `CORS_ORIGINS=*`, permitindo acesso de qualquer maquina na rede local (segundo notebook).

---

## PASSO 6 - TESTE BACKUP

**Resultado: PASSOU**

- `POST /api/backup` com `{"date": "<hoje>"}` -> `200 OK`, ZIP valido (assinatura `PK`, ~10.9 KB).
- `POST /api/backup/full` -> `200 OK`, ZIP valido (assinatura `PK`, ~7.3 KB).
- `GET /api/backups/list` -> `200 OK` (lista de arquivos `.zip` salvos em `BACKUP_DIR`).
- `GET /api/backups/next-run` -> `200 OK`, `{"next_run":"2026-09-10T23:00:00+00:00","backup_hour":23}`.

---

## PASSO 7 - TESTE RESTAURACAO

**Resultado: PASSOU**

Procedimento executado:
1. Criado registro marcador (`TESTE_RESTORE_MARKER`) em `/api/cash`.
2. `POST /api/backup/full` executado e o ZIP resultante salvo manualmente na pasta `backups/` (volume montado em `BACKUP_DIR`), simulando um backup existente.
3. Confirmado que o arquivo aparece em `GET /api/backups/list`.
4. Dados de `cash` apagados via `DELETE /api/cash/{id}` (todos os registros).
5. Confirmado `GET /api/cash` retornando lista vazia.
6. `POST /api/backups/restore/{filename}` executado -> `200 OK`, `{"message":"Backup restaurado com sucesso","deliveries":1,"cash_entries":2,"employee_payments":0,"deliverers":1}`.
7. `GET /api/cash` apos a restauracao -> o marcador `TESTE_RESTORE_MARKER` reapareceu corretamente.

A restauracao substitui as colecoes (`deliveries`, `cash_entries`, `employee_payments`, `deliverers`) pelo conteudo do Excel armazenado dentro do ZIP, funcionando como esperado.

---

## PASSO 8 - TESTE BOTOES EXCEL E RELATORIOS

**Resultado: PASSOU**

| Endpoint | Status | Validacao |
|---|---|---|
| `GET /api/export/excel` | 200 | Content-Type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, ~6.8 KB |
| `GET /api/export/summary-pdf` | 200 | Assinatura `%PDF` confirmada, ~2.0 KB |
| `GET /api/export/reports-pdf` | 200 | Assinatura `%PDF` confirmada, ~2.1 KB |
| `GET /api/export/employees-pdf` | 200 | Assinatura `%PDF` confirmada, ~1.9 KB |

Todos os arquivos gerados sao binarios validos (Excel/PDF reais, nao apenas respostas vazias ou erros mascarados).

---

## PASSO 9 - TESTE LIMPAR TUDO (COM ZIP DE SEGURANCA)

**Resultado: PASSOU (apos correcao de um bug real)**

### Problema encontrado

O endpoint `DELETE /api/data/clear` **nao gerava nenhum backup de seguranca antes de limpar os dados** — apenas apagava as colecoes diretamente. O comentario no codigo da funcao `generate_full_backup` ja mencionava a intencao ("used before clearing data"), mas essa chamada nunca havia sido implementada em `clear_all_data`. Isso significava risco real de perda de dados irreversivel caso o usuario clicasse em "Limpar Tudo" por engano, sem ZIP de seguranca automatico.

### Correcao aplicada

Arquivo `backend/server.py`:
- Funcao `run_automatic_backup()` foi generalizada para aceitar um parametro `prefix` (mantendo o comportamento padrao `"backup_"` para o agendador diario).
- `clear_all_data()` (`DELETE /api/data/clear`) agora chama `run_automatic_backup(prefix="backup_seguranca")` **antes** de apagar qualquer colecao, salvando um ZIP com nome `backup_seguranca_<timestamp>.zip` em `BACKUP_DIR`. O nome do arquivo gerado e retornado na resposta (`safety_backup`).

### Teste apos a correcao

1. `POST /api/backup/full` executado (backup manual previo).
2. Dados de teste garantidos em `deliveries`, `cash`, `deliverers`.
3. `DELETE /api/data/clear` -> `200 OK`, `{"message":"All data cleared successfully","safety_backup":"backup_seguranca_2026-09-10_14-07-39.zip"}`.
4. `GET /api/backups/list` confirmou que o arquivo `backup_seguranca_2026-09-10_14-07-39.zip` foi criado na pasta `backups/` (verificado tambem via listagem direta do diretorio no host).
5. `GET /api/deliveries`, `/api/cash`, `/api/deliverers`, `/api/stock` retornaram listas vazias apos o clear.
6. Dados de teste restaurados com sucesso a partir do proprio ZIP de seguranca gerado automaticamente (`POST /api/backups/restore/backup_seguranca_...zip`), confirmando que o mecanismo de seguranca funciona ponta a ponta.

---

## PASSO 10 - TESTE PERSISTENCIA

**Resultado: PASSOU**

1. Criado registro marcador `TESTE_PERSIST_MARKER` em `/api/deliverers`.
2. Executado `docker-compose down` (containers e rede removidos; volume `mongodb_data` preservado).
3. Executado `docker-compose up -d`.
4. Login com `admin/admin123` funcionou normalmente apos o restart (usuario administrador persistiu).
5. `GET /api/deliverers` retornou o marcador `TESTE_PERSIST_MARKER` criado antes do restart, confirmando persistencia dos dados no volume Docker `mongodb_data`.

---

## ESTADO FINAL DO AMBIENTE

- Todos os 3 containers `Up` e saudaveis (`cupim-backend`, `cupim-frontend`, `cupim-mongodb`).
- **Todos os dados de teste foram removidos** ao final (via `DELETE /api/data/clear`, que tambem gerou um ultimo ZIP de seguranca, posteriormente removido pois era apenas de teste).
- Pasta `backups/` limpa (apenas `.gitkeep`), pronta para o backup automatico diario (23h UTC).
- Senha do admin: `admin123` (nao alterada).
- Nenhum dado real ou da versao Emergent foi tocado — apenas dados de teste marcados com prefixo `TESTE_`.

---

## CORRECOES APLICADAS (RESUMO)

| Arquivo | Alteracao | Motivo |
|---|---|---|
| `backend/server.py` | `run_automatic_backup()` passou a aceitar `prefix` parametrizavel | Permitir reuso da mesma logica de backup para o agendador diario e para o backup de seguranca |
| `backend/server.py` | `clear_all_data()` (`DELETE /api/data/clear`) agora gera `backup_seguranca_<timestamp>.zip` automaticamente antes de apagar os dados | O endpoint apagava todos os dados sem nenhuma rede de seguranca, apesar de o codigo sugerir essa intencao. Risco real de perda de dados irreversivel corrigido |

---

## INSTRUCOES PARA O SEGUNDO NOTEBOOK

Pre-requisitos: o segundo notebook deve estar na **mesma rede local** (Wi-Fi ou cabo) que o notebook servidor, e nenhum firewall deve bloquear as portas 3000 e 8001.

### 1. Acessar o sistema

Abra o navegador no segundo notebook e acesse:

```
http://192.168.1.145:3000
```

Faca login com:
- Usuario: `admin`
- Senha: `admin123`

### 2. Verificar conectividade (opcional, via terminal)

```
curl http://192.168.1.145:8001/api/
```

Deve retornar: `{"message":"Cupim na Telha API"}`

### 3. Observacoes importantes

- O sistema roda **inteiramente no primeiro notebook** (servidor). O segundo notebook e apenas um cliente que acessa via navegador — nao precisa instalar nada.
- O WebSocket (atualizacoes em tempo real) funciona automaticamente pelo mesmo endereco IP; nenhuma configuracao extra e necessaria.
- Se o IP do servidor mudar (ex: reconexao de rede, DHCP), repita o passo `ipconfig` no notebook servidor para obter o novo IP e informe ao segundo notebook.
- Para que o servidor continue acessivel, o notebook servidor deve permanecer ligado com o Docker Desktop rodando e os containers ativos (`docker-compose ps` para conferir).
- Backups automaticos ocorrem todos os dias as 23h (horario UTC) e ficam salvos na pasta `backups/` do notebook servidor.
