# FELCONT — Apresentação Gerencial (.pptx)

## Problema
Gerar PowerPoint editável (16:9, pt-BR, 9 slides) de Análise Gerencial da DRE para o cliente
Ronaldo Donadon, período Jan–Jul/2026, com identidade FELCONT (azul #00A3E0, apoio laranja/verde).
Todos os números vêm exclusivamente do DRE/Balancete do briefing — nada inventado.

## Entregável
- `/app/FELCONT_Analise_Gerencial.pptx` — gerado por `/app/felcont_deck.py` (python-pptx).

## Dados validados (fonte: briefing)
- Receita Bruta 366.795,54 | Deduções 27.061,34 | Receita Líquida 339.734,20
- Custos 301.937,44 | Lucro Bruto 37.796,76 | Despesas Op. 394.936,02
- Resultado: PREJUÍZO 357.139,26
- Conta 140 Clientes (grupo, sintética) invertida: 1.123.648,52
- Conta 1494 Fornecedores (grupo, sintética) invertida: 441.904,06

## Implementado (27/08)
- 9 slides: Capa, Visão Geral (7 cards + destaque prejuízo), Cascata (waterfall nativo editável),
  Receita x Custos/Despesas (barras nativas), Alerta Saldos Invertidos, Interpretação Compra/Venda,
  Pontos de Atenção, Plano de Ação (timeline 8 etapas), Conclusão (fluxo Conciliar→Corrigir→Validar→Analisar).
- Formatação monetária BR (R$ 1.000,00); gráficos nativos editáveis; linguagem de indício (não acusação).
- Logo textual estilizado (substituível pelo oficial).
- Verificado visualmente via render PDF/PNG dos 9 slides.

## Backlog / Próximos
- Substituir logo textual pelo arquivo oficial (PNG/SVG) quando enviado.
- Ajustar códigos de cor exatos se cliente enviar guia de marca.

---

# PROJETO 2 — FELCONT REPORTS AI  (iniciado em 01/09)

## Objetivo
Sistema web que recebe documentos contábeis (PDF/XLSX/XLS/CSV), reconhece e extrai dados via IA,
valida, calcula indicadores, gera diagnóstico gerencial e produz Relatório em PPTX EDITÁVEL + PDF no
padrão FELCONT (índigo #322F6A / turquesa #04B7AF). Regra crítica: NUNCA inventar dados
(ausência => "Dados insuficientes").

## Decisões do usuário
- IA: GPT-5.4 (OpenAI) via chave universal Emergent.  - Banco: MongoDB.  - Sem login.
- MVP ponta-a-ponta confirmado. Projeto anterior (deck DRE) mantido em /apresentacao-dre.

## Arquitetura
- Backend: FastAPI + MongoDB. Pacote /app/backend/felcont_reports/ (parsing, ai, indicators, reportgen, routes).
  Endpoints /api/reports/* : clients, analyses, documents(upload+extração IA), diagnose, slides(PUT), generate, download/{pptx,pdf}, dashboard.
  Uploads processados em arquivos temporários (apagados após o parse — nada persiste no pod). PPTX via python-pptx; PDF via LibreOffice.
- Frontend: React + react-router. /app/frontend/src/reports/ (Layout, Dashboard, Clientes, NovaAnalise, Analise[6 abas], Configuracoes, DeckViewer, api). Gráficos com recharts.

## Implementado (MVP — testado backend 100% + frontend 100%)
- Nova Análise (cadastro cliente) -> upload múltiplo -> reconhecimento + extração por IA (rastreável).
- Validação (Ativo = Passivo + PL; Receita Líq.; Lucro Bruto). Painel de KPIs + "Ver origem" (fórmula + documento).
- Indicadores: liquidez (corrente/seca/imediata/geral), margens, EBITDA, disponibilidade etc.
- DRE e Balanço redesenhados (nomenclatura original preservada). Diagnóstico + Recomendações via IA.
- Editor de slides (editar título/observações, ocultar, duplicar, reordenar, excluir) -> Gerar PPTX editável + PDF.
- Dashboard geral, Clientes/histórico, Configurações (identidade visual).
- Regra "não inventar" validada: com só o Balanço, campos de DRE aparecem como "Dados insuficientes".

## Backlog / Próximas ondas (P1/P2)
- Comparação entre períodos (2024/2025/2026) com aviso de períodos não equivalentes.
- Análise de Folha detalhada (composição/evolução mensal) e DFC.
- Upload de novo logo pela tela de Configurações (salvar no backend/object storage).
- Slide de DRE em cascata (waterfall) e slide comparativo dinâmicos.
- DELETE de análises/clientes; skeleton loading; toast de sucesso ao salvar.

## Onda 3 (04/09) — Portal do Cliente + extras
- **Portal do Cliente** (camada segura, admin intacto): botão "Compartilhar com Cliente" na análise gera link /portal/{token} (token secrets.token_urlsafe(32), guarda sha256 no banco em `client_portals`). Copiar/Abrir/Revogar/Novo link + status/criado/último acesso/nº acessos.
- Rotas públicas /api/portal/{token}[/company|/analyses|/analysis/{id}|/panel|/dre|/balance|/diagnostic] — empresa determinada pelo TOKEN. Isolamento total: análise/empresa de terceiros => HTTP 403 "Acesso não autorizado para esta empresa."; token inválido/revogado => 404; rate limit 429. Link permanente (dados atuais), seletor de período só da empresa.
- Página /portal/:token reaproveita Painel/DRE/Balanço/**Folha**/Diagnóstico (sem menu admin, sem Validação/Editor). Cabeçalho FELCONT + empresa + período + última atualização.
- **Excluir cliente**: DELETE /api/reports/clients/{id} (cascata: análises + portais) + botão na lista de Clientes (com confirmação).
- **DRE em Cascata (waterfall)**, **Análise de Folha** (composição + evolução mensal), **Comparativos** entre períodos (com aviso de durações diferentes) e **Configurações** (upload de logo + cores aplicados na geração) — todos entregues e testados.
- Testes: iteration_3 (waterfall/folha/compare/config) e iteration_4 (portal) — 100%.

## Onda 4 (04/09) — Autenticação administrativa
- Login obrigatório no sistema admin (JWT em cookie HTTPOnly `felcont_admin`, bcrypt). Usuário seed: admin/admin (env ADMIN_EMAIL/ADMIN_PASSWORD). Coleção `admin_users`.
- Guarda central: '/' e todas as rotas admin exigem sessão → sem login redireciona para /login. Todas as APIs /api/reports/* exigem cookie (401 sem sessão). Portal (/api/portal/*, /portal/:token), deck (/api/deck/*, /apresentacao-dre) e /login permanecem PÚBLICOS. Docs da API desabilitados.
- Frontend: AuthContext + Protected (guard) + tela /login (identidade FELCONT) + botão Sair no menu. Corrigido o bug de apagar /portal/TOKEN cair no dashboard.
- Testes iteration_5: backend 15/15 + frontend 8/8 (100%). Nada existente quebrou.
