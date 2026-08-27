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
