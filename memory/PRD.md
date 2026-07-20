# Cupim na Telha - PRD

## Problema Original
Sistema de gerenciamento de entregas para o negócio "Cupim na Telha".

## Arquitetura
- **Frontend:** React + TailwindCSS + ShadCN UI (`/app/frontend/src/App.js`)
- **Backend:** FastAPI + Motor MongoDB (`/app/backend/server.py`)
- **Database:** MongoDB
- **Sem autenticação** | **Idioma:** Português (PT-BR)

## Funcionalidades Implementadas
- CRUD entregas (duplo pagamento, cancelar/descancelar, checklist persistente)
- CRUD caixa (entradas/saídas)
- CRUD entregadores com cores distintas
- CRUD pagamentos de funcionários
- **Controle de Estoque**: cadastro (nome, categoria, preço, qtd), vendas (entrada/vendidos/restante), filtro por categoria
- Busca multi-número (ponto-e-vírgula)
- Filtros por status e entregador
- Exportações: Excel (com aba Estoque), PDFs
- Cupom fiscal para Bematech MP-4200 TH (80mm)
- Backup por data e backup completo (com proteção antes de limpar)
- Modal edição com 2a forma de pagamento
- 6 abas: Caixa, Entregas, Resumo, Relatórios, Estoque, Entregadores

## Endpoints da API
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
- Refatoração: quebrar App.js e server.py em módulos menores
