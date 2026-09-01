"""Converte arquivos contábeis (PDF/XLSX/XLS/CSV/TXT) em texto para a IA."""
from pathlib import Path


def parse_pdf(path: str) -> str:
    import pdfplumber
    out = []
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            out.append(f"\n===== PÁGINA {i + 1} =====")
            txt = page.extract_text() or ""
            out.append(txt)
            for t_idx, table in enumerate(page.extract_tables() or []):
                out.append(f"\n--- TABELA {t_idx + 1} (pág {i + 1}) ---")
                for row in table:
                    cells = ["" if c is None else str(c) for c in row]
                    out.append(" | ".join(cells))
    return "\n".join(out).strip()


def parse_excel(path: str) -> str:
    from openpyxl import load_workbook
    wb = load_workbook(path, data_only=True, read_only=True)
    out = []
    for ws in wb.worksheets:
        out.append(f"\n===== PLANILHA: {ws.title} =====")
        for row in ws.iter_rows(values_only=True):
            if row is None:
                continue
            cells = ["" if c is None else str(c) for c in row]
            if any(cells):
                out.append(" | ".join(cells))
    return "\n".join(out).strip()


def parse_csv(path: str) -> str:
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return Path(path).read_text(encoding=enc).strip()
        except Exception:
            continue
    return Path(path).read_bytes().decode("latin-1", errors="ignore").strip()


def file_to_text(path: str, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return parse_pdf(path)
    if ext in (".xlsx", ".xls", ".xlsm"):
        return parse_excel(path)
    if ext in (".csv", ".txt"):
        return parse_csv(path)
    # tenta pdf como padrão
    try:
        return parse_pdf(path)
    except Exception:
        return parse_csv(path)
