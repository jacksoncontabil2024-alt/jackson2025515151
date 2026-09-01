"""Cálculo de indicadores, validações e utilidades. Nunca inventa dados."""

INSUF = "Dados insuficientes"


def num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        s = str(v).strip().replace("R$", "").replace(" ", "")
        if "," in s and "." in s:
            s = s.replace(".", "").replace(",", ".")
        elif "," in s:
            s = s.replace(",", ".")
        return float(s)
    except Exception:
        return None


def brl(v, cents=True):
    if v is None:
        return INSUF
    n = f"{abs(v):,.2f}" if cents else f"{abs(v):,.0f}"
    n = n.replace(",", "§").replace(".", ",").replace("§", ".")
    return ("-R$ " if v < 0 else "R$ ") + n


def pct(v):
    if v is None:
        return INSUF
    return f"{v:.2f}".replace(".", ",") + "%"


def ratio(v):
    if v is None:
        return INSUF
    return f"{v:.2f}".replace(".", ",")


def merge_financials(documents):
    """Consolida os documentos extraídos em um único objeto financeiro."""
    fin = {"dre": None, "balanco": None, "folha": None,
           "caixa_mensal": [], "meta": {}, "docs_by_type": {}}
    for d in documents:
        ex = d.get("extracted") or {}
        dtype = (ex.get("doc_type") or "Outro")
        fin["docs_by_type"].setdefault(dtype, d.get("filename"))
        if ex.get("dre") and not fin["dre"]:
            fin["dre"] = ex["dre"]; fin["dre_source"] = d.get("filename")
        if ex.get("balanco") and not fin["balanco"]:
            fin["balanco"] = ex["balanco"]; fin["balanco_source"] = d.get("filename")
        if ex.get("folha") and not fin["folha"]:
            fin["folha"] = ex["folha"]; fin["folha_source"] = d.get("filename")
        if ex.get("caixa_mensal"):
            fin["caixa_mensal"] = ex["caixa_mensal"]; fin["caixa_source"] = d.get("filename")
        if ex.get("client_name") and not fin["meta"].get("client_name"):
            fin["meta"]["client_name"] = ex["client_name"]
        if ex.get("cnpj") and not fin["meta"].get("cnpj"):
            fin["meta"]["cnpj"] = ex["cnpj"]
        if ex.get("period_label") and not fin["meta"].get("period_label"):
            fin["meta"]["period_label"] = ex["period_label"]
    return fin


def _ind(key, label, value, unit, formula, display, sources, interp=None):
    return {"key": key, "label": label, "value": value, "unit": unit,
            "formula": formula, "display": display, "sources": sources or [],
            "interpretation": interp}


def compute_indicators(fin):
    dre = fin.get("dre") or {}
    bal = fin.get("balanco") or {}
    ds = fin.get("dre_source")
    bs = fin.get("balanco_source")
    g = lambda d, k: num((d or {}).get(k))

    rob = g(dre, "receita_operacional_bruta")
    ded = g(dre, "deducoes")
    rol = g(dre, "receita_operacional_liquida")
    if rol is None and rob is not None and ded is not None:
        rol = rob - abs(ded)
    custos = g(dre, "custos")
    lucro_bruto = g(dre, "lucro_bruto")
    if lucro_bruto is None and rol is not None and custos is not None:
        lucro_bruto = rol - abs(custos)
    desp_op = g(dre, "despesas_operacionais")
    res_op = g(dre, "resultado_operacional")
    res_liq = g(dre, "resultado_liquido")
    dep = g(dre, "depreciacao_amortizacao")

    ac = (bal.get("ativo_circulante") or {})
    anc = (bal.get("ativo_nao_circulante") or {})
    pc = (bal.get("passivo_circulante") or {})
    pnc = (bal.get("passivo_nao_circulante") or {})
    pl = (bal.get("patrimonio_liquido") or {})
    ac_total = num(ac.get("total"))
    anc_total = num(anc.get("total"))
    pc_total = num(pc.get("total"))
    pnc_total = num(pnc.get("total"))
    pl_total = num(pl.get("total"))
    disp = num(ac.get("disponivel"))
    estoques = num(ac.get("estoques"))
    realizavel_lp = num(anc.get("realizavel_lp"))
    ativo_total = num(bal.get("total_ativo"))
    if ativo_total is None and ac_total is not None and anc_total is not None:
        ativo_total = ac_total + anc_total

    def divd(a, b):
        if a is None or b in (None, 0):
            return None
        return a / b

    cards, liquidez, margens = [], [], []

    cards.append(_ind("receita_liquida", "Receita Líquida", rol, "R$",
                      "Receita Operacional Líquida (DRE)", brl(rol),
                      [{"doc": ds, "linha": "Receita Operacional Líquida"}]))
    cards.append(_ind("resultado_liquido", "Resultado Líquido", res_liq, "R$",
                      "Resultado Líquido do período (DRE)", brl(res_liq),
                      [{"doc": ds, "linha": "Resultado Líquido"}]))
    ml = divd(res_liq, rol)
    ml = ml * 100 if ml is not None else None
    cards.append(_ind("margem_liquida", "Margem Líquida", ml, "%",
                      "Resultado Líquido ÷ Receita Líquida × 100", pct(ml),
                      [{"doc": ds, "linha": "Resultado Líquido / Receita Líquida"}]))
    ebitda = None
    if res_op is not None and dep is not None:
        ebitda = res_op + abs(dep)
    ebitda_pct = divd(ebitda, rol)
    ebitda_pct = ebitda_pct * 100 if ebitda_pct is not None else None
    cards.append(_ind("ebitda", "EBITDA", ebitda, "R$",
                      "Resultado Operacional + Depreciação/Amortização",
                      brl(ebitda) if ebitda is not None else INSUF,
                      [{"doc": ds, "linha": "Resultado Operacional + Depr."}],
                      None if ebitda is not None else "Depreciação/Amortização não identificada."))
    cards.append(_ind("ebitda_pct", "EBITDA %", ebitda_pct, "%",
                      "EBITDA ÷ Receita Líquida × 100", pct(ebitda_pct), []))
    cards.append(_ind("disponibilidade", "Disponibilidade", disp, "R$",
                      "Caixa + Bancos + Aplicações de liquidez imediata", brl(disp),
                      [{"doc": bs, "linha": "Caixa e Equivalentes"}]))
    cards.append(_ind("ativo_total", "Ativo Total", ativo_total, "R$",
                      "Ativo Circulante + Ativo Não Circulante", brl(ativo_total),
                      [{"doc": bs, "linha": "Total do Ativo"}]))
    cards.append(_ind("passivo_circulante", "Passivo Circulante", pc_total, "R$",
                      "Total do Passivo Circulante", brl(pc_total),
                      [{"doc": bs, "linha": "Passivo Circulante"}]))
    cards.append(_ind("patrimonio_liquido", "Patrimônio Líquido", pl_total, "R$",
                      "Total do Patrimônio Líquido", brl(pl_total),
                      [{"doc": bs, "linha": "Patrimônio Líquido"}]))

    # ---- margens ----
    mb = divd(lucro_bruto, rol); mb = mb * 100 if mb is not None else None
    mo = divd(res_op, rol); mo = mo * 100 if mo is not None else None
    dr = divd(abs(desp_op) if desp_op is not None else None, rol)
    dr = dr * 100 if dr is not None else None
    margens.append(_ind("margem_bruta", "Margem Bruta", mb, "%",
                        "Lucro Bruto ÷ Receita Líquida × 100", pct(mb), [{"doc": ds, "linha": "Lucro Bruto"}]))
    margens.append(_ind("margem_operacional", "Margem Operacional", mo, "%",
                        "Resultado Operacional ÷ Receita Líquida × 100", pct(mo), [{"doc": ds}]))
    margens.append(_ind("margem_liquida2", "Margem Líquida", ml, "%",
                        "Resultado Líquido ÷ Receita Líquida × 100", pct(ml), [{"doc": ds}]))
    margens.append(_ind("desp_receita", "Despesas / Receita", dr, "%",
                        "Despesas Operacionais ÷ Receita Líquida × 100", pct(dr), [{"doc": ds}]))

    # ---- liquidez ----
    lc = divd(ac_total, pc_total)
    ls = divd((ac_total - estoques) if (ac_total is not None and estoques is not None) else None, pc_total)
    li = divd(disp, pc_total)
    lg = divd((ac_total + realizavel_lp) if (ac_total is not None and realizavel_lp is not None) else ac_total,
              (pc_total + pnc_total) if (pc_total is not None and pnc_total is not None) else pc_total)
    liquidez.append(_ind("liquidez_corrente", "Liquidez Corrente", lc, "x",
                        "Ativo Circulante ÷ Passivo Circulante", ratio(lc),
                        [{"doc": bs, "linha": "AC / PC"}], _interp_liq(lc)))
    liquidez.append(_ind("liquidez_seca", "Liquidez Seca", ls, "x",
                        "(Ativo Circulante − Estoques) ÷ Passivo Circulante", ratio(ls),
                        [{"doc": bs}], _interp_liq(ls)))
    liquidez.append(_ind("liquidez_imediata", "Liquidez Imediata", li, "x",
                        "Disponibilidades ÷ Passivo Circulante", ratio(li),
                        [{"doc": bs}], _interp_liq(li)))
    liquidez.append(_ind("liquidez_geral", "Liquidez Geral", lg, "x",
                        "(AC + Realizável LP) ÷ (PC + PNC)", ratio(lg),
                        [{"doc": bs}], _interp_liq(lg)))

    computed = {
        "rob": rob, "ded": ded, "rol": rol, "custos": custos, "lucro_bruto": lucro_bruto,
        "desp_op": desp_op, "res_op": res_op, "res_liq": res_liq,
        "ativo_total": ativo_total, "ac_total": ac_total, "anc_total": anc_total,
        "pc_total": pc_total, "pnc_total": pnc_total, "pl_total": pl_total, "disp": disp,
    }
    return {"cards": cards, "margens": margens, "liquidez": liquidez, "computed": computed}


def _interp_liq(v):
    if v is None:
        return INSUF
    if v >= 1.5:
        return "Confortável: ativos de curto prazo cobrem as obrigações."
    if v >= 1.0:
        return "Adequada: cobre as obrigações de curto prazo."
    return "Atenção: abaixo de 1,0 — obrigações superam os ativos de curto prazo."


def validate(fin, computed):
    checks = []

    def chk(label, expected, found, tol=1.0):
        if expected is None or found is None:
            checks.append({"label": label, "status": "insuficiente",
                           "message": "Dados insuficientes para conferência.",
                           "expected": None, "found": None})
            return
        ok = abs(expected - found) <= max(tol, abs(expected) * 0.005)
        checks.append({
            "label": label, "status": "ok" if ok else "alerta",
            "expected": brl(expected), "found": brl(found),
            "message": "Consistente." if ok else "Possível inconsistência — revisar.",
        })

    bal = fin.get("balanco") or {}
    c = computed
    ativo = c.get("ativo_total")
    passivo_pl = None
    if c.get("pc_total") is not None or c.get("pnc_total") is not None or c.get("pl_total") is not None:
        passivo_pl = (c.get("pc_total") or 0) + (c.get("pnc_total") or 0) + (c.get("pl_total") or 0)
    tot_ppl = num(bal.get("total_passivo_pl")) or passivo_pl
    chk("Ativo = Passivo + Patrimônio Líquido", ativo, tot_ppl)

    if c.get("rob") is not None and c.get("ded") is not None:
        chk("Receita Líquida = Receita Bruta − Deduções",
            c["rob"] - abs(c["ded"]), c.get("rol"))
    if c.get("rol") is not None and c.get("custos") is not None:
        chk("Lucro Bruto = Receita Líquida − Custos",
            c["rol"] - abs(c["custos"]), c.get("lucro_bruto"))

    overall = "ok"
    if any(x["status"] == "alerta" for x in checks):
        overall = "alerta"
    elif all(x["status"] == "insuficiente" for x in checks):
        overall = "insuficiente"
    return {"overall": overall, "checks": checks}
