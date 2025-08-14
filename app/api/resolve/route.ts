import { NextRequest } from "next/server";

const API = "https://dadosabertos.camara.leg.br/api/v2";

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { url, votoIdOverride } = await req.json();
    if (votoIdOverride) {
      return new Response(JSON.stringify({ idVotacao: String(votoIdOverride), titulo: null }), { status: 200 });
    }
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ message: "Informe a URL da votação." }), { status: 400 });
    }
    let u: URL;
    try { u = new URL(url); } catch {
      return new Response(JSON.stringify({ message: "URL inválida." }), { status: 400 });
    }

    const reuniao = u.searchParams.get("reuniao");
    const itemVotacao = u.searchParams.get("itemVotacao");
    if (!reuniao) {
      return new Response(JSON.stringify({ message: "A URL não contém o parâmetro 'reuniao'." }), { status: 400 });
    }

    // 1) Tentativa direta: itemVotacao como idVotacao
    if (itemVotacao) {
      const test = await fetchJSON(`${API}/votacoes/${itemVotacao}`);
      const dados = test?.dados;
      if (dados && (Array.isArray(dados) ? dados.length > 0 : Object.keys(dados).length > 0)) {
        const titulo = (dados?.descricao || dados?.[0]?.descricao || null) ?? null;
        return new Response(JSON.stringify({ idVotacao: String(itemVotacao), titulo }), { status: 200 });
      }
    }

    // 2) Listar votações do evento
    const list = await fetchJSON(`${API}/eventos/${reuniao}/votacoes`);
    const items: any[] = Array.isArray(list?.dados) ? list.dados : [];

    if (!items.length) {
      return new Response(JSON.stringify({ message: "Não localizamos votações para este evento (reunião)." }), { status: 404 });
    }

    // Heurísticas para casar itemVotacao com algum campo comum
    function normalizeId(v: any) { return v == null ? null : String(v); }
    let chosen: any | null = null;
    if (itemVotacao) {
      const target = String(itemVotacao);
      const keys = ["id", "idVotacao", "id_item", "idItemVotacao", "ordem", "sequencial", "numero", "item"];
      chosen = items.find(it => keys.some(k => normalizeId((it as any)[k]) === target)) || null;
    }

    if (!chosen) {
      // Preferir votação nominal, quando houver só uma
      const nominais = items.filter(it => /nominal/i.test(String(it?.descricao ?? "")));
      if (nominais.length === 1) chosen = nominais[0];
    }

    if (!chosen) {
      // Retornar opções para o cliente escolher
      const options = items.map(it => ({ id: String((it as any).id ?? (it as any).idVotacao ?? ""), descricao: (it as any).descricao }))
        .filter(o => o.id);
      return new Response(JSON.stringify({ needChoice: true, options }), { status: 200 });
    }

    const idVotacao = String((chosen as any).id ?? (chosen as any).idVotacao);
    const titulo = String((chosen as any).descricao ?? "");
    return new Response(JSON.stringify({ idVotacao, titulo }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message ?? "Falha inesperada." }), { status: 500 });
  }
}