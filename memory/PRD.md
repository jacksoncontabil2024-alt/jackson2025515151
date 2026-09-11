# PRD — CPC 51 | IFRS 18 · Apresentação Web Felcont

## Problema original (resumo)
Apresentação de slides navegável no navegador (React), identidade visual Felcont (azul-marinho + turquesa, textos brancos, estilo consultoria), notas do apresentador embutidas, modo apresentador em tela separada e exportação/impressão em PDF. Conteúdo pt-BR validado em fontes oficiais (IASB, CFC, CVM). Valores didáticos marcados como fictícios; pontos dependentes de fornecedor com selo "Confirmar na fonte / com o fornecedor". Entrega em três formatos: app React + conteúdo PPTX-ready + PNGs.

## Personas
- Equipe interna Felcont (contadores, auditores, analistas) apresentando em reunião
- Clientes do escritório sem conhecimento prévio de IFRS 18 / CPC 51

## Arquitetura
- Frontend-only: React 19 + Tailwind + Framer Motion + Lenis (sem backend/DB)
- Rotas: `/` deck 16:9 (canvas 1280×720 escalonado) · `/apresentador` console (BroadcastChannel sync) · `/imprimir` exportação PDF (print CSS, 320mm×180mm paisagem)
- Conteúdo centralizado em `src/data/slidesContent.js` (notas, DRE, de-para, chamado Questor, plano, riscos)
- Downloads em `frontend/public/downloads/`: outline PPTX (`CPC51-IFRS18-conteudo-pptx.md`), PPTX real (`CPC51-IFRS18-Felcont.pptx`, gerado por `scripts/build_pptx.py`, 21 slides com notas) e PNGs (`pngs/slide-01..21.png`)

## Implementado (2026-09-03)
- Base documental oficial do usuário analisada e integrada (6 PDFs IASB/PwC + manual Questor): novo slide 13 "Tesouraria — juros, câmbio e hedge" (regras de caixa/aplicações, variações cambiais pelo item de origem, hedge/grossing-up, serviços financeiros); exemplo real IASB de reconciliação MPM (45.844→45.588); matriz natureza×função da nota oficial IASB; reconciliação IAS 1→CPC 51 do comparativo e datas de interinas (mar/2027) na vigência
- Slide Questor enriquecido com fatos do manual oficial: rotina "Optante pelo IFRS" (Operações › Contabilidade › Contabilidade Geral), modelos Normal/PME/ITG, "Controla Atividades" (DRE por atividade), data de adoção irreversível; perguntas e modelo de chamado atualizados com a rotina real
- Emblema oficial Felcont (enviado pelo usuário) integrado com fundo transparente na capa, rodapés, apresentador e PNGs — tagline "Contabilidade, Finanças e Auditoria"
- Novo slide 2 "Quatro perguntas, respostas diretas" (o que é / o que muda / vigência / chamado Questor) — deck com 22 slides
- Numeração de slides via SlideNumCtx (sem hardcode por slide)
- Deck de 22 slides, navegação por teclado/clique/hash, barra de progresso, dock de controles, visão geral em grade (tecla O)
- Capa com reveal mascarado linha a linha, parallax de mouse, marquee editorial
- Console do apresentador com slide atual, próximo slide, notas completas, cronômetro e navegação remota sincronizada
- Modo impressão/PDF com todos os slides em páginas paisagem
- Badges das 5 categorias, selos "fictício" e "confirmar na fonte", tabelas DRE/de-para em mono
- Modelo de chamado Questor com botão copiar
- PPTX real gerado por /app/scripts/build_pptx.py (22 slides + notas); PNGs por /app/scripts/export_pngs.py (browser persiste em /app/.pw-browsers)
- Conteúdo validado: IFRS 18 (abr/2024, vigência ≥ 01/01/2027, retrospectiva), CPC 51/NBC TG 51 (nov/2025), Res. CVM 237 (revoga 106/156), Res. CVM 238 (Doc. Revisão 28), exemplos ilustrativos IASB e manual Questor
- P1: PDF das notas do apresentador (versão handout com notas por slide)
- P1: PDF das notas do apresentador (versão handout com notas por slide)
- P2: tema claro opcional para projeção em ambiente claro
- P2: painel de edição de slides (FastAPI + MongoDB) se o usuário quiser editar conteúdo sem código
