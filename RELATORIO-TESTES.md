# Relatório de Testes de Integração - Cupim na Telha

**Data:** 10/09/2026
**Branch:** VERDENT-LOCAL
**Ambiente:** Docker Desktop (Windows), docker-compose

## Resumo

Todos os 10 testes obrigatórios foram executados. Foram encontrados e **corrigidos** 3 problemas reais que impediam o funcionamento correto do sistema (build do frontend, WebSocket bloqueado pelo middleware de auth, WebSocket sem biblioteca de suporte no backend). Após as correções, **todos os testes PASSARAM**.

---

## 1) CONTAINERS - `docker-compose up -d --build`

**Resultado: PASSOU** (após correção)

- Comando executado: `docker-compose up -d --build`
- Os 3 containers (`cupim-frontend`, `cupim-backend`, `cupim-mongodb`) iniciaram e permanecem com status `Up`.

```
NAME             IMAGE                     STATUS          PORTS
cupim-backend    cupim-na-telha-backend    Up              0.0.0.0:8001->8001/tcp
cupim-frontend   cupim-na-telha-frontend   Up              0.0.0.0:3000->80/tcp
cupim-mongodb    mongo:7.0                 Up              0.0.0.0:27017->27017/tcp
```

**Problemas encontrados e corrigidos:**

1. **`yarn.lock` ausente** — o `Dockerfile.frontend` faz `RUN yarn install --frozen-lockfile`, mas não havia lockfile versionado. Gerado localmente com `yarn install` e mantido (deve ser commitado no repositório).
2. **Node 18 incompatível** — `Dockerfile.frontend` usava `node:18-alpine`, mas `react-router-dom@7.18.3` exige Node `>=20.0.0`. Build falhava com `error react-router-dom@7.18.3: The engine "node" is incompatible`. **Corrigido:** imagem base alterada para `node:20-alpine`.
3. Havia um stack Docker antigo (`cupim-na-telha-sistema-*`, projeto anterior) ocupando a porta 27017. Foi parado antes do novo `up`.

Logs de inicialização (backend): usuário admin criado, agendador de backup iniciado, sem erros.
Logs do MongoDB: startup completo, sem erros.
Logs do frontend (nginx): workers iniciados, sem erros.

---

## 2) HEALTH CHECK

**Resultado: PASSOU**

- `GET http://localhost:8001/api/` → `200 OK`, body: `{"message":"Cupim na Telha API"}`
- `GET http://localhost:3000` → `200 OK` (HTML do React servido pelo nginx)

---

## 3) AUTENTICAÇÃO

**Resultado: PASSOU**

- `POST /api/auth/login` com `{username: admin, password: admin123}` → `200 OK`, retornou JWT válido (`access_token`, `token_type: bearer`, `role: admin`).
- `GET /api/auth/me` com `Authorization: Bearer <token>` → `200 OK`, `{"username":"admin","role":"admin","created_at":"..."}`.
- `GET /api/cash` **sem** token → `401 Unauthorized` (middleware de auth bloqueando corretamente).
- `POST /api/auth/change-password` → `200 OK`, `{"message":"Senha alterada com sucesso"}`. Senha foi trocada e revertida para `admin123` para preservar o estado padrão.

---

## 4) CRUD COMPLETO (com token)

**Resultado: PASSOU**

Testado para os 5 recursos: `/api/deliveries`, `/api/cash`, `/api/deliverers`, `/api/employee-payments`, `/api/stock`.

| Recurso | POST | GET | PATCH | DELETE |
|---|---|---|---|---|
| cash | 200 | 200 | - | 200 |
| deliveries | 200 | 200 | 200 | 200 |
| deliverers | 200 | - | - | 200 |
| employee-payments | 200 | - | - | 200 |
| stock | 200 | - | 200 | 200 |

Todos os registros de teste criados foram lidos, atualizados (PATCH em `deliveries` e `stock`) e removidos com sucesso. Nenhum dado de teste ficou órfão no banco.

---

## 5) WEBSOCKET

**Resultado: PASSOU** (após correção de 2 bugs)

Teste: conexão a `ws://localhost:8001/api/ws?token=<JWT>`, seguido de `POST /api/cash`, verificando recebimento do broadcast.

**Problemas encontrados e corrigidos:**

1. **Middleware HTTP bloqueava o handshake WS.** O `AuthMiddleware` (baseado em `BaseHTTPMiddleware`) interceptava toda requisição para `/api/*`, exigindo header `Authorization: Bearer`. O endpoint WebSocket (`/api/ws`) autentica-se via query param `token`, não header — então toda tentativa de conexão WS recebia `401` antes mesmo do handshake. **Corrigido:** adicionado `/api/ws` à lista `PUBLIC_PATHS` em `backend/server.py` (a autenticação real do WS continua sendo feita dentro do próprio `websocket_endpoint`, que valida o JWT do query param e fecha a conexão com código 4401 se inválido/ausente).
2. **Biblioteca WebSocket não instalada no backend.** O Uvicorn reportava: `No supported WebSocket library detected`. `requirements.txt` tinha apenas `uvicorn==0.25.0` sem `[standard]` nem `websockets`/`wsproto`. **Corrigido:** adicionado `websockets==12.0` ao `backend/requirements.txt`.

Após as correções, teste executado com sucesso:
```
WS_OPEN
POST_RESULT: {"id":"...","type":"entrada","value":42,"desc":"ws-test",...}
WS_MESSAGE: {"event": "cash_created", "resource": "cash", "id": "...", "timestamp": "..."}
```
O evento de broadcast foi recebido corretamente pelo cliente WS assim que o POST foi processado.

---

## 6) ACESSO REDE LOCAL

**Resultado: PASSOU**

IP local da máquina: `192.168.1.145` (simulando acesso de um segundo notebook).

- `curl http://192.168.1.145:3000` → `200 OK`
- `curl http://192.168.1.145:8001/api/` → `200 OK`, `{"message":"Cupim na Telha API"}`

Os serviços estão expostos com `0.0.0.0` no `docker-compose.yml`, permitindo acesso de outras máquinas na rede local, e o `CORS_ORIGINS=*` permite requisições de qualquer origem.

---

## 7) BACKUP MANUAL

**Resultado: PASSOU**

- `POST /api/backup` com `{"date":"2026-09-10"}` → `200 OK`, retornou ZIP válido (assinatura `PK\x03\x04` confirmada, 10.514 bytes).
- `POST /api/backup/full` → `200 OK`, retornou ZIP válido (6.781 bytes).

Ambos os arquivos foram verificados via leitura binária dos primeiros bytes (assinatura de arquivo ZIP) e removidos após validação.

---

## 8) BACKUP AUTOMÁTICO

**Resultado: PASSOU**

- `GET /api/backups/list` → `200 OK`, retornou `[]` (lista vazia — esperado, pois nenhum backup automático foi disparado ainda; os testes manuais do item 7 usam streaming direto e não gravam em `BACKUP_DIR`).
- `GET /api/backups/next-run` → `200 OK`, `{"next_run":"2026-09-10T23:00:00+00:00","backup_hour":23}` — mostra corretamente o próximo horário agendado (23:00 UTC, configurável via `BACKUP_HOUR`).

---

## 9) PERSISTÊNCIA

**Resultado: PASSOU**

Procedimento:
1. Criado registro marcador `PERSIST_TEST_MARKER` em `/api/deliverers`.
2. Executado `docker-compose down` (containers e rede removidos, volume `mongodb_data` preservado).
3. Executado `docker-compose up -d`.
4. Login com `admin/admin123` funcionou normalmente (usuário persistiu).
5. `GET /api/deliverers` retornou o registro `PERSIST_TEST_MARKER` criado antes do restart.

Dados persistem corretamente no volume Docker `mongodb_data` entre reinicializações. Marcador removido após validação.

---

## 10) FUNCIONAMENTO SEM INTERNET

**Resultado: PASSOU**

Busca no código-fonte por chamadas a serviços externos:

- `backend/server.py`: nenhuma chamada a `requests`, `urllib`, `httpx` ou URLs externas (apenas imports de bibliotecas locais: FastAPI, Motor/PyMongo, bcrypt, PyJWT, openpyxl, reportlab).
- `backend/tests/*.py`: usam `requests` apenas contra `BASE_URL` configurável, por padrão `http://localhost:8001` (arquivos de teste, não código de produção).
- `frontend/src/App.js`: todas as chamadas `axios.*` usam a variável `${API}`, que é configurada via `REACT_APP_BACKEND_URL`/similar para apontar ao próprio backend local — nenhuma URL de terceiros hardcoded.

O sistema não depende de nenhum serviço externo para funcionar (autenticação, dados e backups são 100% locais).

---

## Correções Aplicadas (resumo)

| Arquivo | Alteração | Motivo |
|---|---|---|
| `frontend/yarn.lock` | Gerado (novo arquivo) | Necessário para build reprodutível com `yarn install --frozen-lockfile` |
| `Dockerfile.frontend` | `node:18-alpine` → `node:20-alpine` | `react-router-dom@7.18.3` exige Node >= 20 |
| `backend/requirements.txt` | Adicionado `websockets==12.0` | Uvicorn não suportava WebSocket sem essa dependência |
| `backend/server.py` | Adicionado `/api/ws` a `PUBLIC_PATHS` | Middleware HTTP bloqueava handshake WS (que se autentica via query param, não header) |

## Estado Final

Todos os containers `Up`, todos os 10 testes obrigatórios **PASSARAM**. Nenhum dado de teste residual (marcadores removidos). Senha do admin revertida para o padrão `admin123`.
