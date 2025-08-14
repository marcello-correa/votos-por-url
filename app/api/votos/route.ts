import { NextRequest } from "next/server";

const API = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  // Se não for OK, vamos incluir status e um trecho do corpo para debug
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} @ ${url} :: ${text.slice(0,180)}`);
  }
  return await res.json();
}

// Busca paginada; trata 404 como "sem votos nominais"
async function fetchAllPagesVotos(baseUrl: string) {
  let url = baseUrl;
  const all: any[] = [];
  for (let i = 0; i < 50; i++) {
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) {
      // 404 costuma indicar que a votação não tem votos nominais (simbólica)
      if (res.status === 404) return { rows: [], status: 404 };
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} @ ${url} :: ${text.slice(0,180)}`);
    }
    const json = await res.json();
    const dados = Array.isArray(json?.dados) ? json.dados : [];
    all.push(...dados);
    const next = (json?.links || []).find((l: any) => l?.rel === "next")?.href;
    if (!next) break;
    url = next;
  }
  return { rows: all, status: 200 };
}

export async function POST(req: NextRequest) {
  try {
    const { url, votoIdOverride } = await req.json();

    // 1) Resolver idVotacao usando nossa própria rota /api/resolve
    const res = await fetch(`${new URL(req.url).origin}/api/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, votoIdOverride })
    });
    const resolved = await res.json();
    if (!res.ok) return new Response(JSON.stringify(resolved), { status: res.status });

    if (resolved?.needChoice) {
      // Front exibirá seletor
      return new Response(JSON.stringify(resolved), { status: 200 });
    }

    const idVotacaoRaw = String(resolved?.idVotacao ?? "");
    if (!idVotacaoRaw) {
      return new Response(JSON.stringify({ message: "Não foi possível identificar a votação." }), { status: 400 });
    }

    // 2) (opcional) pegar descrição/título da votação
    let titulo: string | null = null;
    try {
      const det = await fetchJSON(`${API}/votacoes/${encodeURIComponent(idVotacaoRaw)}`);
      // vários formatos possíveis; tentamos campos comuns
      titulo = String(det?.dados?.descricao ?? det?.dados?.[0]?.descricao ?? "") || null;
    } catch {
      // se falhar, seguimos sem título
    }

    // 3) Trazer votos nominais; remover ordenarPor (algumas rotas não aceitam)
    const base = `${API}/votacoes/${encodeURIComponent(idVotacaoRaw)}/votos`;
    const { rows: votos, status } = await fetchAllPagesVotos(base);

    if (!votos.length) {
      // Sem votos nominalmente registrados (provável votação simbólica)
      return new Response(JSON.stringify({
        idVotacao: idVotacaoRaw,
        titulo,
        rows: [],
        nota: status === 404 ? "Sem votos nominais (votação provavelmente simbólica)." : "Nenhum voto nominal encontrado."
      }), { status: 200 });
    }

    const rows = votos.map((v: any) => {
      const dep = v?.deputado_ || v?.deputado || {};
      return {
        nome: dep?.nome ?? "",
        tipoVoto: v?.tipoVoto ?? v?.voto ?? "",
        partido: dep?.siglaPartido ?? dep?.sigla ?? "",
        uf: dep?.siglaUf ?? dep?.uf ?? "",
      };
    });

    return new Response(JSON.stringify({
      idVotacao: idVotacaoRaw,
      titulo,
      rows
    }), { status: 200 });

  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message ?? "Falha inesperada." }), { status: 500 });
  }
}
