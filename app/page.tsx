"use client";
import { useMemo, useState } from "react";

type VotoRow = { nome: string; tipoVoto: string; partido: string; uf: string };

export default function Page() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState<string | null>(null);
  const [idVotacao, setIdVotacao] = useState<string | null>(null);
  const [rows, setRows] = useState<VotoRow[]>([]);
  const [fallbackOptions, setFallbackOptions] = useState<{ id: string; descricao?: string }[]>([]);
  const [chosenId, setChosenId] = useState<string>("");

  const [q, setQ] = useState("");
  const [p, setP] = useState("");
  const [uf, setUf] = useState("");

  const partidos = useMemo(() => Array.from(new Set(rows.map(r => r.partido))).sort(), [rows]);
  const ufs = useMemo(() => Array.from(new Set(rows.map(r => r.uf))).sort(), [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r =>
      (q ? r.nome.toLowerCase().includes(q.toLowerCase()) : true) &&
      (p ? r.partido === p : true) &&
      (uf ? r.uf === uf : true)
    );
  }, [rows, q, p, uf]);

  async function listarVotos(votoIdOverride?: string) {
    setLoading(true); setError(null); setRows([]); setTitulo(null); setIdVotacao(null); setFallbackOptions([]);
    try {
      const res = await fetch("/api/votos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, votoIdOverride }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Falha ao consultar votos");
      if (data?.needChoice && Array.isArray(data?.options)) {
        setFallbackOptions(data.options);
        return; // usuário terá que escolher uma opção na UI
      }
      setTitulo(data?.titulo || null);
      setIdVotacao(data?.idVotacao || null);
      setRows(data?.rows || []);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function baixarCSV() {
    const header = ["Nome", "Tipo de voto", "Partido", "UF"];
    const lines = [header, ...filtered.map(r => [r.nome, r.tipoVoto, r.partido, r.uf])]
      .map(cols => cols.map(v => {
        const s = (v ?? "").toString();
        return s.includes(",") || s.includes("\"") ? `"${s.replaceAll("\"", "\"\"")}"` : s;
      }).join(",")).join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `votos_${idVotacao ?? "dados"}.csv`;
    a.click();
  }

  return (
    <div className="card">
      <div className="h1">Votos por URL — Câmara dos Deputados</div>
      <div className="sub">Cole a URL da votação (página pública do portal) e clique em <b>Listar votos</b>.</div>

      <div style={{ height: 12 }} />
      <div className="row">
        <input className="input" placeholder="Cole aqui a URL da votação…"
               value={url} onChange={e => setUrl(e.target.value)} />
        <button className="button" disabled={loading || !url} onClick={() => listarVotos()}> {loading ? "Consultando…" : "Listar votos"} </button>
      </div>

      {error && (<>
        <div style={{ height: 12 }} />
        <div className="badge">Erro</div>
        <div className="small">{error}</div>
      </>)}

      {fallbackOptions.length > 0 && (
        <>
          <hr />
          <div className="small">Encontramos múltiplas votações neste evento. Escolha a correta para listar os votos:</div>
          <div className="toolbar">
            <select className="select" value={chosenId} onChange={e => setChosenId(e.target.value)}>
              <option value="">Selecione…</option>
              {fallbackOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id}{opt.descricao ? ` — ${opt.descricao}` : ""}</option>
              ))}
            </select>
            <button className="button" disabled={!chosenId} onClick={() => listarVotos(chosenId)}>Confirmar</button>
          </div>
        </>
      )}

      {rows.length > 0 && (
        <>
          <hr />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="badge">{idVotacao ? `Votação ${idVotacao}` : "Votação"}</div>
            <button className="button" onClick={baixarCSV}>Baixar CSV</button>
          </div>
          {titulo && <div className="small" style={{ marginTop: 6 }}>{titulo}</div>}

          <div className="toolbar">
            <input className="search" placeholder="Filtrar por nome…" value={q} onChange={e => setQ(e.target.value)} />
            <select className="select" value={p} onChange={e => setP(e.target.value)}>
              <option value="">Partido (todos)</option>
              {partidos.map(pp => <option key={pp} value={pp}>{pp}</option>)}
            </select>
            <select className="select" value={uf} onChange={e => setUf(e.target.value)}>
              <option value="">UF (todas)</option>
              {ufs.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr><th>Nome</th><th>Tipo de voto</th><th>Partido</th><th>UF</th></tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}><td>{r.nome}</td><td>{r.tipoVoto}</td><td>{r.partido}</td><td>{r.uf}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="footer">Fonte: Dados Abertos da Câmara dos Deputados.</div>
        </>
      )}
    </div>
  );
}