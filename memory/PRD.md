# Cupim na Telha - PRD

## Problema Original
Sistema de gerenciamento de entregas para o negócio "Cupim na Telha".

## Arquitetura
- **Frontend:** React + TailwindCSS + ShadCN UI (`/app/frontend/src/App.js`)
- **Backend:** FastAPI + Motor MongoDB + WebSocket (`/app/backend/server.py`)
- **Database:** MongoDB
- **Tempo Real:** WebSocket nativo do FastAPI em `/api/ws`
- **Sem autenticação** | **Idioma:** Português (PT-BR)

## Funcionalidades Implementadas
- CRUD entregas (duplo pagamento com troco2, cancelar/descancelar, checklist)
- CRUD caixa (entradas/saídas)
- CRUD entregadores com cores distintas
- CRUD pagamentos de funcionários
- Controle de Estoque (entrada/vendidos/restante, categoria, preço)
- Busca multi-número, filtros por status/entregador
- Exportações: Excel (com estoque + troco2), PDFs
- Cupom fiscal para Bematech MP-4200 TH (80mm)
- Backup por data e completo (com proteção antes de limpar)
- Modal edição com 2a forma de pagamento + troco2
- **WebSocket tempo real**: sincronização automática entre dispositivos sem F5
  - 100% cobertura: todos os 13 endpoints POST/PATCH/DELETE com broadcast
  - 18 tipos de eventos com notificações toast
  - Reconexão automática a cada 3s + sync ao voltar à aba
- Limpar Tudo agora inclui estoque (stock_items)
- Backend recalcula troco2 automaticamente no PATCH

## Endpoints da API
- `/api/ws` - WebSocket (tempo real)
- `/api/cash` - GET, POST, DELETE
- `/api/deliveries` - GET, POST, PATCH, DELETE
- `/api/deliverers` - GET, POST, DELETE
- `/api/employee-payments` - GET, POST, DELETE
- `/api/stock` - GET, POST, PATCH, DELETE
- `/api/clients/pool` - GET
- `/api/export/[excel|summary-pdf|reports-pdf|employees-pdf]` - GET
- `/api/backup` - POST (por data)
- `/api/backup/full` - POST (completo)
- `/api/data/clear` - DELETE

## Backlog
- Refatoração: quebrar App.js (~2680 linhas) e server.py (~1100 linhas) em módulos menores
