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
