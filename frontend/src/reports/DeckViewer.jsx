import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Download, FileText, X, ChevronLeft, ChevronRight, Presentation, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO = "https://customer-assets-eiarnc6j.emergentagent.net/job_dre-ronaldo-donadon/artifacts/gc2u16q4_image.png";

export default function DeckViewer() {
  const [deck, setDeck] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => { axios.get(`${API}/deck/info`).then((r) => setDeck(r.data)).catch(() => {}); }, []);
  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(() => setActive((i) => (i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setActive((i) => (deck && i < deck.slides.length - 1 ? i + 1 : i)), [deck]);
  useEffect(() => {
    const onKey = (e) => { if (active === null) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [active, close, prev, next]);
  const fmtKB = (b) => `${Math.round((b || 0) / 1024)} KB`;

  return (
    <div className="page" data-testid="deck-page">
      <nav className="nav" data-testid="top-nav">
        <div className="nav-inner">
          <img src={LOGO} alt="FELCONT" className="nav-logo" data-testid="brand-logo" />
          <span className="nav-tag">Análise Gerencial</span>
          <Link to="/" style={{ marginLeft: "auto", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }} data-testid="back-to-reports">
            <ArrowLeft size={16} /> Reports AI
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-grid">
          <div className="hero-left">
            <span className="kicker" data-testid="hero-kicker">ANÁLISE GERENCIAL</span>
            <h1 data-testid="hero-title">Demonstração do Resultado do Exercício</h1>
            <div className="meta">
              <p><span>Cliente</span> Ronaldo Donadon</p>
              <p><span>Período</span> {deck ? deck.period : "Janeiro a Julho de 2026"}</p>
              <p><span>Formato</span> PowerPoint 16:9 · 9 slides · editável</p>
            </div>
            <div className="cta-row">
              <a className="btn btn-primary" href={`${API}/deck/download`} data-testid="download-pptx-btn">
                <Download size={18} /> Baixar PowerPoint (.pptx){deck ? <em>{fmtKB(deck.pptx_bytes)}</em> : null}
              </a>
              <a className="btn btn-ghost" href={`${API}/deck/pdf`} data-testid="download-pdf-btn"><FileText size={18} /> Baixar PDF</a>
            </div>
            <p className="slogan">“Informação contábil transformada em decisão.”</p>
          </div>
          <div className="hero-right" data-testid="hero-cover">
            {deck && (
              <button className="cover-btn" onClick={() => setActive(0)} data-testid="open-cover" aria-label="Abrir capa">
                <img src={`${API}${deck.slides[0].image.replace("/api", "")}`} alt="Capa" />
                <span className="cover-badge"><Presentation size={16} /> Ver apresentação</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="gallery-wrap">
        <div className="gallery-head">
          <h2 data-testid="gallery-title">Pré-visualização dos slides</h2>
          <p>Clique em qualquer slide para ampliar. Baixe o .pptx para editar no PowerPoint.</p>
        </div>
        <div className="gallery" data-testid="slide-gallery">
          {deck && deck.slides.map((sl, i) => (
            <button key={sl.n} className="thumb" onClick={() => setActive(i)} data-testid={`slide-thumb-${sl.n}`}>
              <span className="thumb-num">{String(sl.n).padStart(2, "0")}</span>
              <img src={`${API}${sl.image.replace("/api", "")}`} alt={sl.title} loading="lazy" />
              <span className="thumb-title">{sl.title}</span>
            </button>
          ))}
        </div>
      </main>

      <footer className="foot" data-testid="footer">
        <img src={LOGO} alt="FELCONT" className="foot-logo" />
        <p>FELCONT — Contabilidade, Finanças e Auditoria · Análise gerencial · Jan–Jul/2026</p>
      </footer>

      {active !== null && deck && (
        <div className="lightbox" data-testid="lightbox" onClick={close}>
          <button className="lb-close" onClick={close} data-testid="lightbox-close"><X size={26} /></button>
          <button className="lb-arrow lb-left" onClick={(e) => { e.stopPropagation(); prev(); }} data-testid="lightbox-prev" disabled={active === 0}><ChevronLeft size={30} /></button>
          <figure className="lb-fig" onClick={(e) => e.stopPropagation()}>
            <img src={`${API}${deck.slides[active].image.replace("/api", "")}`} alt={deck.slides[active].title} data-testid="lightbox-image" />
            <figcaption>{String(active + 1).padStart(2, "0")} / {String(deck.slides.length).padStart(2, "0")} · {deck.slides[active].title}</figcaption>
          </figure>
          <button className="lb-arrow lb-right" onClick={(e) => { e.stopPropagation(); next(); }} data-testid="lightbox-next" disabled={active === deck.slides.length - 1}><ChevronRight size={30} /></button>
        </div>
      )}
    </div>
  );
}
