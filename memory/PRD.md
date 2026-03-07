# Cupim na Telha - PRD

## Problema Original
Sistema de gerenciamento de entregas para o negócio "Cupim na Telha". Inclui controle de caixa, entregas, entregadores, pagamentos de funcionários, relatórios e exportações.

## Arquitetura
- **Frontend:** React + TailwindCSS + ShadCN UI (monolítico em `/app/frontend/src/App.js`)
- **Backend:** FastAPI + Motor (MongoDB async) (monolítico em `/app/backend/server.py`)
- **Database:** MongoDB
- **Sem autenticação**
- **Idioma:** Português (PT-BR)

## Funcionalidades Implementadas
- CRUD de entregas com sequência automática, duplo pagamento, cancelar/descancelar
- CRUD de caixa (entradas/saídas)
- CRUD de entregadores com atribuição a entregas
- CRUD de pagamentos de funcionários
- Busca multi-número com ponto-e-vírgula (ex: "27;45")
- Filtros por status (Todos, Pendentes, Em Entrega, Concluídas, Canceladas)
- Checklist persistente nos relatórios por forma de pagamento
- 7 formas de pagamento: PIX, Cartão, Dinheiro, Pago, Vem Retirar, Marcar, Pagou a Conta
- Exportações: Excel, PDF Resumo, PDF Relatórios, PDF Funcionários
- Impressão de cupom fiscal (formatado para A4)
- Backup de dados (ZIP com Excel + 4 PDFs por data)
- Pool de clientes com autocomplete
- 7 abas: Caixa, Entregas, Resumo, Relatórios, Funcionários, Entregadores, Backup

## O que foi feito nesta sessão (06/02/2026)
- Corrigido contraste de cores das abas (texto branco/80% nas abas inativas)
- Reformatado cupom fiscal para impressora térmica 80mm Bematech MP-4200 TH (fontes grandes bold, layout 72mm)
- Implementado endpoint POST /api/backup (gera ZIP com 5 arquivos)
- Implementada aba "Backup de Dados" com date picker e botão de download
- **Sincronização da 2a forma de pagamento nos relatórios**: paymentMethod2 + amount2 sincronizados em cards, modal detalhes, cupom fiscal, PDFs e backup
- **Bug fix backup vazio**: Corrigido filtro de data que misturava _id:0 (projeção) com o filtro de query MongoDB
- Testes: 100% backend (18/18), 100% frontend

## Backlog
### P2 - Refatoração
- Quebrar App.js (~2200 linhas) em componentes menores
- Organizar server.py com APIRouter separados
- Limpar arquivos Docker/instalação do diretório raiz

## Endpoints da API
- `/api/cash` - GET, POST, DELETE
- `/api/deliveries` - GET, POST, PATCH, DELETE
- `/api/deliverers` - GET, POST, DELETE
- `/api/employee-payments` - GET, POST, DELETE
- `/api/clients/pool` - GET
- `/api/export/[excel|summary-pdf|reports-pdf|employees-pdf]` - GET
- `/api/backup` - POST (body: {date: "YYYY-MM-DD"})
- `/api/data/clear` - DELETE
