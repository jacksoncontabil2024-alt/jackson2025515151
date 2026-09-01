"""Camada de IA (GPT-5.4 via chave universal Emergent) para extração e diagnóstico.
Regra crítica: NUNCA inventar valores. Ausência de dado => null."""
import os
import json
import uuid
import re

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MODEL = ("openai", "gpt-5.4")

EXTRACT_SYSTEM = (
    "Você é um extrator contábil sênior da FELCONT. Recebe o texto bruto de UM documento "
    "contábil brasileiro e devolve APENAS um JSON válido, sem comentários. "
    "REGRA ABSOLUTA: nunca invente valores. Se um campo não existir no documento, use null. "
    "Números em ponto decimal (ex: 1234567.89), sem separador de milhar, sem 'R$'. "
    "Valores negativos com sinal negativo. Preserve a nomenclatura original das contas."
)

EXTRACT_SCHEMA = """Devolva exatamente esta estrutura (use null quando não houver dado):
{
 "doc_type": "DRE|Balanco Patrimonial|Balancete|DFC|Folha de Pagamento|Razao|Outro",
 "client_name": string|null,
 "cnpj": string|null,
 "period_label": string|null,
 "periods_monthly": [string],
 "dre": {
   "receita_operacional_bruta": number|null,
   "deducoes": number|null,
   "receita_operacional_liquida": number|null,
   "custos": number|null,
   "lucro_bruto": number|null,
   "despesas_operacionais": number|null,
   "despesas_vendas": number|null,
   "despesas_administrativas": number|null,
   "despesas_financeiras": number|null,
   "despesas_tributarias": number|null,
   "receitas_financeiras": number|null,
   "resultado_operacional": number|null,
   "resultado_antes_tributos": number|null,
   "resultado_liquido": number|null,
   "depreciacao_amortizacao": number|null
 } | null,
 "balanco": {
   "ativo_circulante": {"contas":[{"descricao":string,"valor":number}], "disponivel": number|null, "estoques": number|null, "total": number|null},
   "ativo_nao_circulante": {"contas":[{"descricao":string,"valor":number}], "realizavel_lp": number|null, "total": number|null},
   "passivo_circulante": {"contas":[{"descricao":string,"valor":number}], "total": number|null},
   "passivo_nao_circulante": {"contas":[{"descricao":string,"valor":number}], "total": number|null},
   "patrimonio_liquido": {"contas":[{"descricao":string,"valor":number}], "total": number|null},
   "total_ativo": number|null,
   "total_passivo_pl": number|null
 } | null,
 "folha": {"custo_total":number|null,"proventos":number|null,"encargos":number|null,"beneficios":number|null,"provisoes":number|null,"num_colaboradores":number|null,
   "mensal":[{"mes":string,"proventos":number|null,"encargos":number|null,"beneficios":number|null,"provisoes":number|null}]} | null,
 "caixa_mensal": [{"mes":string,"caixa":number}],
 "line_items": [{"descricao":string,"valor":number,"secao":string}]
}
Preencha "line_items" com as principais linhas do documento (máx 40) para rastreabilidade."""

DIAG_SYSTEM = (
    "Você é um consultor gerencial da FELCONT. Analisa indicadores contábeis JÁ CALCULADOS "
    "(não recalcule) e produz diagnóstico e recomendações objetivas em português do Brasil. "
    "Baseie TODA conclusão nos números fornecidos. Não use frases genéricas de preenchimento. "
    "Trate saldos invertidos e prejuízos como pontos de atenção que exigem conciliação, nunca como acusação. "
    "Responda APENAS com JSON válido."
)

DIAG_SCHEMA = """Estrutura de resposta:
{
 "resumo_executivo": string,
 "diagnostico": [{"tipo":"Ponto Positivo|Ponto de Atenção|Risco|Oportunidade|Tendência","titulo":string,"texto":string}],
 "recomendacoes": [{"titulo":string,"texto":string}]
}"""


def _strip_json(txt: str) -> str:
    txt = txt.strip()
    if txt.startswith("```"):
        txt = re.sub(r"^```[a-zA-Z]*\n?", "", txt)
        txt = re.sub(r"\n?```$", "", txt).strip()
    # pega do primeiro { ao último }
    a, b = txt.find("{"), txt.rfind("}")
    if a != -1 and b != -1:
        txt = txt[a:b + 1]
    return txt


async def _complete(system: str, prompt: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system,
    ).with_model(*MODEL)
    resp = await chat.send_message(UserMessage(text=prompt))
    return resp if isinstance(resp, str) else str(resp)


async def extract_document(text: str, filename: str) -> dict:
    snippet = text[:24000]
    prompt = (
        f"Nome do arquivo: {filename}\n\n{EXTRACT_SCHEMA}\n\n"
        f"=== TEXTO DO DOCUMENTO ===\n{snippet}"
    )
    raw = await _complete(EXTRACT_SYSTEM, prompt)
    try:
        return json.loads(_strip_json(raw))
    except Exception as e:
        return {"doc_type": "Outro", "error": f"Falha ao interpretar IA: {e}", "raw": raw[:800]}


async def diagnose(context: dict) -> dict:
    prompt = (
        f"{DIAG_SCHEMA}\n\n=== DADOS DA ANÁLISE (JSON) ===\n"
        f"{json.dumps(context, ensure_ascii=False, default=str)[:16000]}"
    )
    raw = await _complete(DIAG_SYSTEM, prompt)
    try:
        return json.loads(_strip_json(raw))
    except Exception as e:
        return {"resumo_executivo": "", "diagnostico": [], "recomendacoes": [],
                "error": f"Falha no diagnóstico: {e}"}
