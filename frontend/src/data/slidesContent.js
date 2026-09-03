// Conteúdo validado em fontes oficiais: IASB (IFRS 18, abr/2024), CFC (NBC TG 51, 13/11/2025),
// CVM (Resolução CVM nº 237/2025). Valores monetários são fictícios e didáticos.

export const TOTAL_SLIDES = 20;

export const SLIDE_TITLES = [
  "Capa — CPC 51 | IFRS 18",
  "Introdução: o que é IFRS 18 / CPC 51",
  "O que muda na prática",
  "Nova estrutura da DRE — 5 categorias",
  "Subtotal: lucro/prejuízo operacional",
  "Subtotal: lucro antes de financiamento e tributos",
  "Exemplo de DRE (fictícia)",
  "MPMs / MPDAs",
  "Agregação e desagregação",
  "Natureza × função × combinação",
  "Impactos na DFC",
  "Brasil — CPC 51 / NBC TG 51 / CVM 237",
  "Vigência e transição",
  "Questor — precisamos mudar o plano de contas?",
  "Tabela de mapeamento (exemplo)",
  "Perguntas ao suporte Questor",
  "Modelo de chamado ao Questor",
  "Plano de ação Felcont 2026 — 10 passos",
  "Riscos de deixar para a última hora",
  "Conclusão e próximos passos",
];

export const NOTES = [
  // 1 — Capa
  `Abertura: "Bom dia a todos. Hoje vamos falar da maior mudança na apresentação das demonstrações contábeis dos últimos anos: a IFRS 18, que no Brasil virou o CPC 51. A promessa desta reunião é simples: sair daqui sabendo o que muda, quando muda e o que a Felcont vai fazer em 2026 para ninguém ser pego de surpresa em 2027."
Exemplo prático: comece perguntando à plateia quem já explicou um EBITDA para cliente — esse é exatamente o tipo de número que a norma passa a disciplinar.`,
  // 2 — Introdução
  `Explique que a IFRS 18 foi emitida pelo IASB em abril de 2024 e substitui a IAS 1 na parte de apresentação e divulgação. No Brasil, o CPC emitiu o CPC 51, o CFC aprovou a NBC TG 51 e a CVM a Resolução nº 237 — ou seja, não é "norma de fora", já é norma brasileira. O objetivo do IASB foi acabar com a bagunça: cada empresa apresentava o resultado de um jeito, e comparar concorrentes era quase impossível.
Exemplo prático: duas indústrias do mesmo setor, uma colocava juros de arrendamento no meio das despesas operacionais e outra no financeiro — o "lucro operacional" das duas não era comparável. Com o CPC 51, passa a ser.`,
  // 3 — O que muda
  `Faça um sobrevoo: "Não entrem em pânico com a quantidade de itens — tudo gira em torno de três eixos: classificar, apresentar e divulgar." Classificar receitas e despesas em 5 categorias; apresentar 2 novos subtotais obrigatórios; divulgar MPMs e desagregações. Os efeitos colaterais caem em cima de plano de contas, sistemas (Questor), DFC, notas e indicadores/covenants.
Exemplo prático: covenant de dívida atrelado a "lucro operacional" precisa ser relido, porque esse número vai mudar de valor sem a operação ter mudado nada.`,
  // 4 — 5 categorias
  `Regra de ouro para fixar: NÃO se classifica pelo nome da conta, e sim pela natureza da transação. A categoria operacional é residual — tudo que não for investimento, financiamento, imposto de renda ou operação descontinuada cai nela. E existe exceção importante: entidades cuja atividade principal é financiar clientes ou investir em ativos (bancos, seguradoras, holdings de investimento) classificam no operacional o que para outras empresas seria investimento/financiamento.
Exemplo prático: rendimento de aplicação financeira de uma indústria vai para "Investimento"; para um banco, é receita operacional.`,
  // 5 — Lucro operacional
  `Este é o subtotal que o mercado inteiro vai olhar primeiro. Ele junta TODAS as receitas e despesas da categoria operacional — sem exceções, sem "não recorrente" tirado na mão. A grande vitória é a comparabilidade: o lucro operacional deixa de depender do critério de cada empresa.
Exemplo prático: antes, uma empresa excluía depreciação de um ativo específico dizendo que era "não recorrente"; agora, se é operacional, está dentro do subtotal — acabou a maquiagem.`,
  // 6 — Lucro antes de financiamento e tributos
  `Segundo subtotal obrigatório: lucro operacional + resultado da categoria de investimento. Ele mostra o desempenho antes das decisões de estrutura de capital (como a empresa se financia) e antes dos tributos sobre a renda. É o número mais próximo do "EBIT" que muitos analistas calculavam por conta própria.
Exemplo prático: duas empresas idênticas, uma alavancada e outra sem dívida — esse subtotal permite comparar a operação sem o ruído do financiamento.`,
  // 7 — DRE fictícia
  `Caminhe pela tabela de cima para baixo, apontando os badges coloridos de cada categoria. Reforce: "estes valores são fictícios, montados só para visualizarmos a anatomia da nova DRE." Destaque os dois subtotais em destaque (lucro operacional e lucro antes de financiamento e tributos) e como juros de empréstimo e de arrendamento (CPC 06/IFRS 16) foram parar DEPOIS do operacional.
Exemplo prático: peça para a equipe localizar onde entraria uma receita de aluguel de um imóvel que a empresa não usa — resposta: Investimento, porque gera retorno independente da operação.`,
  // 8 — MPMs
  `MPM (em inglês) ou MPDA — medida de desempenho definida pela administração: subtotais de receitas e despesas que a empresa usa em comunicação pública FORA das demonstrações (release, apresentação de resultados) e que traduzem a visão da gestão. Exemplos clássicos: EBITDA ajustado, lucro recorrente. A norma não proíbe — mas obriga uma nota explicativa única com reconciliação ao subtotal IFRS/CPC mais próximo, efeito tributário e efeito sobre participações não controladoras.
Exemplo prático: o "EBITDA ajustado" do release de resultados do cliente terá de ser reconciliado linha a linha até o lucro operacional, dentro das notas auditadas.`,
  // 9 — Agregação/desagregação
  `A norma ataca diretamente a famosa linha "Outras despesas". Princípio: agregar só itens com características semelhantes e desagregar quando a informação for relevante; "outros" vira residual e precisa ser explicado. No exemplo, R$ 2,8 mi escondidos em "Outras despesas" viram quatro linhas transparentes e um residual pequeno e justificado.
Exemplo prático: pergunte à equipe qual cliente tem hoje uma linha de "outras despesas" gorda na DRE — esse será um dos primeiros ajustes do mapeamento.`,
  // 10 — Natureza × função
  `A apresentação das despesas na categoria operacional pode ser por natureza (matéria-prima, pessoal, depreciação), por função (CPV, vendas, administrativas) ou mista — o que for mais útil. Mas quem escolher por função ganha um dever extra: divulgar em nota os totais de depreciação, amortização, benefícios a empregados, perdas por impairment e baixas de estoque.
Exemplo prático: indústria que apresenta por função terá de abrir em nota quanto de depreciação está dentro do CPV — o sistema precisa saber separar isso.`,
  // 11 — DFC
  `A DFC pelo método indireto muda o ponto de partida: sai o "lucro antes dos tributos" e entra o LUCRO OPERACIONAL como base — eliminando ajustes que hoje misturam tudo. E acaba a discricionariedade de classificação de juros e dividendos para a maioria das empresas: juros e dividendos recebidos → atividades de investimento; juros pagos → financiamento; dividendos pagos → financiamento. Entidades com atividade principal financeira seguem regra própria.
Exemplo prático: cliente que hoje coloca juros recebidos no operacional da DFC terá a linha reparametrizada — confira se o Questor fará isso automaticamente.`,
  // 12 — Brasil
  `Aterrisse a norma no Brasil: o CPC 51 substitui o CPC 26 (R1); o CFC publicou a NBC TG 51 em novembro de 2025; a CVM aprovou a Resolução nº 237 (que revoga as Resoluções 106 e 156) e a Resolução nº 238 atualizou diversos outros pronunciamentos (CPC 03, 06, 15, entre outros) para manter a coerência. A DVA continua exigida pela Lei 6.404/76 para companhias abertas. O alcance da obrigatoriedade varia por tipo de entidade (companhia aberta, instituição autorizada pelo Bacen, entidade que adota CPCs integrais) — por isso o selo "confirmar na fonte" para cada cliente.
Exemplo prático: uma Ltda. que segue apenas o regime tributário simplificado pode não estar no alcance pleno — valide cliente a cliente antes de prometer adequação.`,
  // 13 — Vigência
  `Mensagem central: "2027 parece longe, mas o comparativo de 2027 é 2026." A norma vale para exercícios iniciados em ou após 1º de janeiro de 2027, com aplicação antecipada permitida e aplicação RETROSPECTIVA integral — ou seja, a DRE de 2026 publicada como comparativo já terá de estar no novo formato. Quem esperar janeiro de 2027 vai reconstruir 2026 às pressas.
Exemplo prático: para entregar o comparativo reexpresso em março de 2027, o plano de contas e o de-para precisam estar rodando desde janeiro de 2026.`,
  // 14 — Questor
  `Pergunta que todo cliente fará: "preciso mudar meu plano de contas?" Resposta ponderada: NÃO automaticamente. O que o CPC 51 exige é classificação e apresentação — muitas vezes resolvida com tabela de de-para entre contas existentes e as 5 categorias, sem quebrar histórico. Mas pode haver necessidade de desdobrar contas (ex.: "outras despesas" genéricas). Tudo depende do roadmap do Questor — por isso o selo de confirmar com o fornecedor.
Exemplo prático: antes de criar 200 contas novas, abra o chamado do slide 17 e pergunte ao suporte como o sistema vai parametrizar as categorias.`,
  // 15 — Mapeamento
  `Mostre a tabela como um recorte do que cada cliente vai precisar: conta, descrição, categoria CPC 51, relatório afetado e ação. Reforce que é um EXEMPLO fictício — o de-para real sai do plano de contas de cada cliente. Note que contas de rendimento financeiro, equivalência e juros mudam de categoria mesmo sem mudar de número.
Exemplo prático: a conta de rendimentos de aplicações continua a mesma no plano, mas deixa de aparecer "antes" do operacional e passa à categoria Investimento.`,
  // 16 — Perguntas ao Questor
  `Estas perguntas foram desenhadas para arrancar respostas objetivas do suporte: roadmap, parametrização por conta ou centro de resultado, subtotais, MPMs, DFC e comparativos. Sugestão: envie por escrito (chamado), não por telefone — resposta escrita vira evidência de planejamento.
Exemplo prático: se o suporte disser que ainda não há previsão para a DFC reparametrizada, isso vira item de risco no plano de ação do cliente.`,
  // 17 — Modelo de chamado
  `O texto está pronto para copiar (botão no canto). Basta trocar os colchetes pelos dados do cliente. Reforce a prática: um chamado por cliente ou um chamado-mãe da Felcont cobrindo a base — decidir internamente.
Exemplo prático: copie o texto agora, abra o chamado de teste com o CNPJ de um cliente piloto e guarde o protocolo.`,
  // 18 — Plano de ação
  `Percorra o fluxograma na ordem: governança primeiro (comitê e treinamento), diagnóstico depois (clientes impactados, mapeamento), validação com o fornecedor, piloto com 2–3 clientes no comparativo de 2026 e go-live em 2027. Cada passo tem dono e prazo sugeridos — adaptem à realidade da carteira.
Exemplo prático: escolha como piloto um cliente de porte médio com DRE simples e outro com arrendamentos e aplicações — os dois cenários cobrem 90% dos casos.`,
  // 19 — Riscos
  `Tom de alerta honesto: o maior risco não é a norma ser difícil — é o tempo. Comparativo 2026 não reexpresso, dependência do fornecedor sem SLA e equipe não treinada são os riscos altos. Classificação incorreta gera subtotais errados e questionamento de auditoria; "outras despesas" genéricas e MPMs sem reconciliação geram não conformidade de divulgação.
Exemplo prático: uma glosa de auditoria em março de 2027 custa muito mais caro (retrabalho + prazo regulatório) do que as horas de mapeamento em 2026.`,
  // 20 — Conclusão
  `Fechamento em três frases: 1) A norma já existe e tem data — 2027 com comparativo 2026 reexpresso. 2) A resposta não é pânico nem plano de contas novo às cegas — é mapeamento, validação com o Questor e piloto. 3) A Felcont sai na frente se transformar a exigência em serviço consultivo para os clientes. Próximos passos na tela: Questor → orientação técnica → mapeamento → testes → implementação.
Exemplo prático: termine definindo ali mesmo o responsável pelo passo 1 (comitê interno) e a data da primeira reunião de mapeamento.`,
];

export const DRE_ROWS = [
  { label: "Receita líquida de vendas e serviços", valor: 12500000, cat: "operacional" },
  { label: "Custo dos produtos e serviços (CPV/CSP)", valor: -7800000, cat: "operacional" },
  { label: "Despesas com vendas", valor: -950000, cat: "operacional" },
  { label: "Despesas administrativas", valor: -1400000, cat: "operacional" },
  { label: "Outras receitas operacionais", valor: 180000, cat: "operacional" },
  { label: "LUCRO OPERACIONAL", valor: 2530000, subtotal: true, cat: "operacional" },
  { label: "Rendimentos de aplicações financeiras", valor: 220000, cat: "investimento" },
  { label: "Resultado de equivalência patrimonial", valor: 90000, cat: "investimento" },
  { label: "LUCRO ANTES DE FINANCIAMENTO E TRIBUTOS", valor: 2840000, subtotal: true },
  { label: "Despesas financeiras — empréstimos", valor: -610000, cat: "financiamento" },
  { label: "Juros sobre arrendamentos (CPC 06 / IFRS 16)", valor: -130000, cat: "financiamento" },
  { label: "LUCRO ANTES DOS TRIBUTOS SOBRE A RENDA", valor: 2100000, subtotal: true },
  { label: "IRPJ e CSLL (correntes e diferidos)", valor: -714000, cat: "impostos" },
  { label: "LUCRO DAS OPERAÇÕES CONTINUADAS", valor: 1386000, subtotal: true },
  { label: "Resultado de operações descontinuadas (CPC 31)", valor: 74000, cat: "descontinuadas" },
  { label: "LUCRO LÍQUIDO DO EXERCÍCIO", valor: 1460000, subtotal: true, final: true },
];

export const DESAGREGACAO = {
  antes: { label: "Outras despesas", valor: 2800000 },
  depois: [
    { label: "Manutenção e reparos", valor: 900000 },
    { label: "Serviços terceirizados", valor: 750000 },
    { label: "Seguros", valor: 420000 },
    { label: "Perdas estimadas com créditos (PCLD)", valor: 380000 },
    { label: "Demais itens não materiais (justificados)", valor: 350000 },
  ],
};

export const MAP_ROWS = [
  { conta: "3.01.001", desc: "Receita de prestação de serviços", cat: "operacional", relatorio: "DRE", acao: "Manter" },
  { conta: "4.01.002", desc: "Custo dos serviços prestados", cat: "operacional", relatorio: "DRE", acao: "Manter" },
  { conta: "3.02.001", desc: "Rendimentos de aplicações financeiras", cat: "investimento", relatorio: "DRE", acao: "Reclassificar p/ Investimento" },
  { conta: "3.03.001", desc: "Equivalência patrimonial", cat: "investimento", relatorio: "DRE", acao: "Reclassificar p/ Investimento" },
  { conta: "4.02.003", desc: "Juros passivos — empréstimos", cat: "financiamento", relatorio: "DRE", acao: "Reclassificar p/ Financiamento" },
  { conta: "4.02.007", desc: "Juros de arrendamento (CPC 06)", cat: "financiamento", relatorio: "DRE", acao: "Reclassificar p/ Financiamento" },
  { conta: "4.04.001", desc: "IRPJ / CSLL correntes e diferidos", cat: "impostos", relatorio: "DRE", acao: "Manter · nova categoria" },
  { conta: "3.05.002", desc: "Resultado de unidade encerrada", cat: "descontinuadas", relatorio: "DRE", acao: "Avaliar enquadramento CPC 31" },
];

export const QUESTOR_QUESTIONS = [
  "O Questor terá parametrização nativa das 5 categorias do CPC 51 (operacional, investimento, financiamento, impostos, descontinuadas)? Qual o roadmap e o prazo de entrega?",
  "A classificação será por conta contábil, por centro de resultado/custo ou por lançamento?",
  "A DRE do sistema passará a exibir automaticamente os subtotais obrigatórios: lucro operacional e lucro antes de financiamento e tributos?",
  "Como o sistema tratará as MPMs/MPDAs — haverá campos para reconciliação e divulgação em nota explicativa?",
  "A DFC pelo método indireto passará a partir do lucro operacional, com juros/dividendos recebidos em investimento e juros/dividendos pagos em financiamento?",
  "Haverá rotina para gerar os comparativos de 2026 reexpressos no novo formato em 2027?",
  "É possível exportar a tabela de de-para (conta × categoria CPC 51) para conferência e documentação de auditoria?",
];

export const TICKET_TEXTO = `Assunto: CPC 51 / IFRS 18 — Roadmap de adequação da DRE, DFC e parametrização de categorias

Prezada equipe de suporte Questor,

Somos responsáveis pela contabilidade da empresa [RAZÃO SOCIAL], CNPJ [00.000.000/0000-00], e estamos planejando a adequação ao CPC 51 / NBC TG 51 (IFRS 18), obrigatório para exercícios iniciados a partir de 01/01/2027, com comparativos de 2026 reexpressos.

Solicitamos, por escrito, as seguintes informações:

1. Roadmap e prazo para parametrização das 5 categorias da DRE (operacional, investimento, financiamento, impostos sobre a renda e operações descontinuadas);
2. Forma de classificação prevista: por conta contábil, centro de resultado ou lançamento;
3. Previsão de geração automática dos subtotais obrigatórios (lucro operacional; lucro antes de financiamento e tributos);
4. Tratamento das MPMs/MPDAs e respectivas reconciliações em nota explicativa;
5. Adequação da DFC (método indireto a partir do lucro operacional; juros e dividendos recebidos em investimento; juros e dividendos pagos em financiamento);
6. Rotina para geração dos comparativos de 2026 reexpressos;
7. Exportação da tabela de de-para (conta × categoria) para documentação e auditoria.

Ficamos à disposição para reunião técnica e solicitamos o número de protocolo deste chamado.

Atenciosamente,
[NOME] — Felcont Consultoria Contábil
[E-MAIL] · [TELEFONE]`;

export const STEPS = [
  { n: "01", t: "Comitê interno CPC 51", d: "Nomear responsável técnico e sponsor na Felcont." },
  { n: "02", t: "Treinar a equipe", d: "Esta apresentação + texto oficial do CPC 51/NBC TG 51." },
  { n: "03", t: "Mapear clientes impactados", d: "Classificar a carteira por alcance e obrigatoriedade." },
  { n: "04", t: "De-para do plano de contas", d: "Conta × categoria CPC 51, cliente a cliente." },
  { n: "05", t: "Validar com o Questor", d: "Chamado formal + roadmap por escrito do fornecedor." },
  { n: "06", t: "Definir MPMs", d: "Listar medidas usadas e preparar reconciliações." },
  { n: "07", t: "Revisar a DFC", d: "Novo ponto de partida e classificação de juros/dividendos." },
  { n: "08", t: "Piloto com 2–3 clientes", d: "Rodar o comparativo de 2026 reexpresso." },
  { n: "09", t: "Notas e templates", d: "Ajustar notas explicativas e modelos de publicação." },
  { n: "10", t: "Go-live 2027", d: "Implantação plena + revisão pós-adoção." },
];

export const RISKS = [
  { t: "Comparativo 2026 não reexpresso", d: "Reconstruir um ano inteiro de classificação às pressas, no prazo de publicação.", nivel: "Alto" },
  { t: "Dependência do fornecedor sem SLA", d: "Roadmap do Questor sem data vira gargalo fora do nosso controle.", nivel: "Alto" },
  { t: "Classificação incorreta nas categorias", d: "Subtotais errados e questionamento direto da auditoria independente.", nivel: "Alto" },
  { t: "Equipe não treinada", d: "Erros de lançamento replicados em massa por toda a carteira de clientes.", nivel: "Alto" },
  { t: "“Outras despesas” genéricas", d: "Não conformidade com os princípios de agregação e desagregação.", nivel: "Médio" },
  { t: "MPMs sem reconciliação", d: "EBITDA ajustado e afins divulgados sem a nota obrigatória de reconciliação.", nivel: "Médio" },
];

export const fmtBRL = (v) =>
  (v < 0 ? "(" : "") +
  Math.abs(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
  (v < 0 ? ")" : "");
