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
- Downloads em `frontend/public/downloads/`: outline PPTX (`CPC51-IFRS18-conteudo-pptx.md`) e PNGs (`pngs/slide-01..20.png`)

## Implementado (2026-09-03)
- Emblema oficial Felcont (enviado pelo usuário) integrado com fundo transparente na capa, rodapés, apresentador e PNGs — tagline "Contabilidade, Finanças e Auditoria"
- Novo slide 2 "Quatro perguntas, respostas diretas" (o que é / o que muda / vigência / chamado Questor) — deck agora com 21 slides
- Numeração de slides via SlideNumCtx (sem hardcode por slide)
- Deck de 21 slides conforme estrutura aprovada (capa → conclusão), navegação por teclado/clique/hash, barra de progresso, dock de controles, visão geral em grade (tecla O)
- Capa com reveal mascarado linha a linha, parallax de mouse, marquee editorial
- Console do apresentador com slide atual, próximo slide, notas completas, cronômetro e navegação remota sincronizada
- Modo impressão/PDF com todos os slides em páginas paisagem
- Badges das 5 categorias, selos "fictício" e "confirmar na fonte", tabelas DRE/de-para em mono
- Modelo de chamado Questor com botão copiar
- Conteúdo validado via pesquisa: IFRS 18 (abr/2024, vigência exercícios ≥ 01/01/2027, retrospectiva), CPC 51/NBC TG 51 (nov/2025), Res. CVM 237 (revoga 106/156) e Res. CVM 238 (Doc. Revisão 28)
- P1: PDF das notas do apresentador (versão handout com notas por slide)
- P1: gerar .pptx real a partir do outline (python-pptx)
- P2: tema claro opcional para projeção em ambiente claro
- P2: painel de edição de slides (FastAPI + MongoDB) se o usuário quiser editar conteúdo sem código
