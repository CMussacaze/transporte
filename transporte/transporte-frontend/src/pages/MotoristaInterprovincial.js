// src/pages/MotoristaInterprovincial.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import EncomendasForm from "../components/EncomendasForm";

const MotoristaInterprovincial = () => {
  const [motorista, setMotorista] = useState(null);
  const [rotaInfo, setRotaInfo] = useState(null);
  const [rotaId, setRotaId] = useState(null);
  const [dataViagem, setDataViagem] = useState(""); // 🔹 Data da agenda
  // eslint-disable-next-line no-unused-vars
  const [reservas, setReservas] = useState([]);
  const [bilhetesRows, setBilhetesRows] = useState([]);
  const [codigoBilhete, setCodigoBilhete] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Ler motorista logado
  useEffect(() => {
    const dados = localStorage.getItem("motoristaLogado");
    if (dados) setMotorista(JSON.parse(dados));
  }, []);

  // Buscar rota interprovincial e data atual de agenda
  useEffect(() => {
    if (!motorista?.id) return;

    axios
      .get("http://127.0.0.1:8000/api/rotas/", {
        params: { motorista: motorista.id, tipo_rota: "interprovincial" },
      })
      .then(async (res) => {
        if (res.data.length > 0) {
          const rota = res.data[0];
          setRotaInfo(rota);
          setRotaId(rota.id);

          // 🔹 Buscar data ativa da agenda
          const agendaRes = await axios.get(
            `http://127.0.0.1:8000/api/agenda-viagem/?rota=${rota.id}&ativo=true`
          );

          if (agendaRes.data.length > 0) {
            setDataViagem(agendaRes.data[0].data); // Define data da viagem
          } else {
            setMensagem("⚠️ Nenhuma agenda ativa encontrada para esta rota.");
          }
        } else {
          setMensagem("⚠️ Nenhuma rota interprovincial associada a este motorista.");
        }
      })
      .catch(() => setMensagem("Erro ao buscar rota e agenda."));
  }, [motorista]);

  // Carregar reservas filtradas pela data da viagem
  const carregarReservas = useCallback(async () => {
    if (!rotaId || !dataViagem) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/reservas/", {
        params: { rota: rotaId, tipo_rota: "interprovincial" },
      });

      // 🔹 Filtra reservas da data da agenda
      const reservasFiltradas = res.data.filter(
        (r) => r.rota === rotaId && r.data_viagem === dataViagem
      );
      setReservas(reservasFiltradas);

      // 🔹 Achata reservas → bilhetes
      const rows = reservasFiltradas.flatMap((r) =>
        (r.bilhetes || []).map((b) => ({
          bilheteId: b.id,
          bilheteCodigo: b.codigo,
          nomePassageiro: b.nome_passageiro,
          telefonePassageiro: b.telefone_passageiro,
          usado: b.usado,
          embarcado: b.embarcado,
          bagagem_kg: b.bagagem_kg,
          reservaId: r.id,
          paragem: r.paragem_embarque_nome || "—",
          data_viagem: r.data_viagem,
          rotaNome: r.rota_nome || "",
        }))
      );

      setBilhetesRows(rows);
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
      setMensagem("Erro ao carregar reservas.");
    }
  }, [rotaId, dataViagem]);

  useEffect(() => {
    carregarReservas();
    const timer = setInterval(carregarReservas, 15000);
    return () => clearInterval(timer);
  }, [rotaId, dataViagem, carregarReservas]);

  // Conferir bilhete
  const handleVerificar = () => {
    if (!codigoBilhete.trim()) {
      setMensagem("⚠️ Insira o número do bilhete.");
      return;
    }

    axios
      .post("http://127.0.0.1:8000/api/conferir-bilhete/", {
        codigo_bilhete: codigoBilhete,
        motorista_id: motorista?.id,
      })
      .then((res) => {
        const data = res.data;

        // 🚫 Bloquear bilhetes de outras datas
        if (data.data_viagem && data.data_viagem !== dataViagem) {
          setMensagem(
            `❌ Bilhete inválido para esta data.\nBilhete: ${data.data_viagem} • Viagem: ${dataViagem}`
          );
          return;
        }

        if (data.valido && data.rota_id === rotaId) {
          setMensagem(`✅ Bilhete aprovado para ${data.rota_nome}.`);
          carregarReservas();
        } else if (data.status === "já usado") {
          setMensagem("⚠️ Este bilhete já foi utilizado.");
        } else if (data.status === "inexistente") {
          setMensagem("❌ Bilhete não encontrado.");
        } else {
          setMensagem("❌ Bilhete não pertence à sua rota.");
        }
      })
      .catch(() => setMensagem("❌ Erro ao verificar bilhete."));

    setCodigoBilhete("");
  };

  // Impressão da etiqueta (mantém o peso)
  const salvarEImprimir = (row) => {
    axios
      .patch(`http://127.0.0.1:8000/api/bilhetes/${row.bilheteId}/`, {
        bagagem_kg: row.bagagem_kg,
      })
      .then(() => {
        const janela = window.open("", "_blank");
        janela.document.write(`
          <html>
            <head>
              <title>Etiqueta de Bagagem</title>
              <style>
                body { font-family: sans-serif; padding: 10px; }
                .label { border: 1px dashed #333; padding: 10px; width: 260px; }
              </style>
            </head>
            <body>
              <div class="label">
                <h3>Bagagem</h3>
                <p><strong>Bilhete:</strong> ${row.bilheteCodigo}</p>
                <p><strong>Passageiro:</strong> ${row.nomePassageiro}</p>
                <p><strong>Rota:</strong> ${row.rotaNome}</p>
                <p><strong>Paragem:</strong> ${row.paragem}</p>
                <p><strong>Data:</strong> ${row.data_viagem || "—"}</p>
                <p><strong>Peso:</strong> ${row.bagagem_kg || "—"} KG</p>
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        janela.document.close();
      })
      .catch(() => alert("Erro ao salvar peso da bagagem."));
  };

  const handleLogout = () => {
    localStorage.removeItem("motoristaLogado");
    window.location.href = "/motorista/login";
  };

  // Contagem
  const totalBilhetes = bilhetesRows.length;
  const embarcados = bilhetesRows.filter((b) => b.usado).length;
  const faltam = totalBilhetes - embarcados;

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: 20 }}>
      <h2>🚌 Painel do Motorista Interprovincial</h2>

      {motorista && (
        <div
          style={{
            background: "#f8f8f8",
            padding: 10,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <p><strong>Motorista:</strong> {motorista.nome}</p>
          <p><strong>Telefone:</strong> {motorista.telefone}</p>
        </div>
      )}

      {rotaInfo && (
        <div
          style={{
            marginBottom: "1rem",
            background: "#eef",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <p><strong>Rota:</strong> {rotaInfo.nome}</p>
          <p><strong>Horário:</strong> {rotaInfo.horario}</p>
          <p><strong>📅 Data da Viagem:</strong> {dataViagem || "—"}</p>
        </div>
      )}

      <button
        onClick={handleLogout}
        style={{
          marginBottom: "15px",
          backgroundColor: "#c33",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: "6px",
        }}
      >
        🔒 Terminar Sessão
      </button>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={codigoBilhete}
          onChange={(e) => setCodigoBilhete(e.target.value)}
          placeholder="Ex: MATE-123456"
        />
        <button onClick={handleVerificar}>Verificar</button>
      </div>

      {mensagem && <p><strong>{mensagem}</strong></p>}

      <h4>📊 Resumo</h4>
      <p><strong>Total de Passageiros:</strong> {totalBilhetes}</p>
      <p><strong>Embarcados:</strong> {embarcados}</p>
      <p><strong>Em Falta:</strong> {faltam}</p>

      <h4>🧍‍♂️ Passageiros</h4>
      <table
        border="1"
        cellPadding="6"
        style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}
      >
        <thead>
          <tr>
            <th>Embarcado</th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Paragem</th>
            <th>Peso (KG)</th>
            <th>Nº Bilhete</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {bilhetesRows.map((row) => (
            <tr key={row.bilheteId}>
              <td>
                <input type="checkbox" checked={!!row.usado} readOnly />
              </td>
              <td>{row.nomePassageiro}</td>
              <td>{row.telefonePassageiro}</td>
              <td>{row.paragem}</td>
              <td>
                <input
                  type="number"
                  value={row.bagagem_kg || ""}
                  onChange={(e) => {
                    const novoKg = e.target.value;
                    setBilhetesRows((prev) =>
                      prev.map((r) =>
                        r.bilheteId === row.bilheteId
                          ? { ...r, bagagem_kg: novoKg }
                          : r
                      )
                    );
                  }}
                />
              </td>
              <td>{row.usado ? row.bilheteCodigo : "—"}</td>
              <td>
                <button disabled={!row.usado} onClick={() => salvarEImprimir(row)}>
                  Etiqueta
                </button>
              </td>
            </tr>
          ))}
          {bilhetesRows.length === 0 && (
            <tr>
              <td colSpan={7}>Sem passageiros para esta data.</td>
            </tr>
          )}
        </tbody>
      </table>

      {rotaId && <EncomendasForm rotaId={rotaId} />}
    </div>
  );
};

export default MotoristaInterprovincial;
