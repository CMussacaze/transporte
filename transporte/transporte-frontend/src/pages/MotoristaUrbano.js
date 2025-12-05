// src/pages/MotoristaUrbano.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const MotoristaUrbano = () => {
  const [motorista, setMotorista] = useState(null);
  const [rotaInfo, setRotaInfo] = useState(null);
  const [rotaId, setRotaId] = useState(null);
  const [bilhetesRows, setBilhetesRows] = useState([]);
  const [codigoBilhete, setCodigoBilhete] = useState("");
  const [mensagem, setMensagem] = useState("");

  // 📅 Data do dia — sempre baseada no dispositivo
  const dataHoje = new Date().toISOString().split("T")[0];

  // 🔹 Ler motorista logado
  useEffect(() => {
    const dados = localStorage.getItem("motoristaLogado");
    if (dados) {
      try {
        setMotorista(JSON.parse(dados));
      } catch {
        setMotorista(null);
      }
    }
  }, []);

  // 🔹 Buscar rota do motorista (urbana)
  useEffect(() => {
    if (!motorista?.id) return;
    axios
      .get("http://127.0.0.1:8000/api/rotas/", {
        params: { motorista: motorista.id, tipo_rota: "urbana" },
      })
      .then((res) => {
        if (res.data.length > 0) {
          const rota = res.data[0];
          setRotaInfo(rota);
          setRotaId(rota.id);
        } else {
          setMensagem("⚠️ Nenhuma rota urbana associada a este motorista.");
        }
      })
      .catch(() => setMensagem("Erro ao buscar rota do motorista."));
  }, [motorista]);

  // 🔹 Carregar bilhetes (apenas do dia)
  const carregarBilhetes = useCallback(() => {
    if (!rotaId) return;

    axios
      .get("http://127.0.0.1:8000/api/reservas/", {
        params: { rota: rotaId, tipo_rota: "urbana" },
      })
      .then((res) => {
        const lista = res.data.filter((r) => r.rota === rotaId);

        const rows = lista.flatMap((r) =>
          (r.bilhetes || [])
            .filter((b) => b.data_viagem === dataHoje) // ✔ FILTRAR PELO DIA
            .map((b) => ({
              bilheteCodigo: b.codigo,
              usado: b.usado,
              data_viagem: b.data_viagem,
              paragem: r.paragem_embarque_nome || "—",
            }))
        );

        setBilhetesRows(rows);
      })
      .catch(() => setMensagem("Erro ao carregar bilhetes."));
  }, [rotaId, dataHoje]);

  // 🔹 Atualização periódica
  useEffect(() => {
    if (!rotaId) return;
    carregarBilhetes();
    const t = setInterval(carregarBilhetes, 8000);
    return () => clearInterval(t);
  }, [rotaId, carregarBilhetes]);

  // 🔹 Conferir bilhete
  const handleVerificar = () => {
    if (!codigoBilhete.trim()) {
      setMensagem("⚠️ Insira o número do bilhete.");
      return;
    }

    axios
      .post("http://127.0.0.1:8000/api/conferir-bilhete/", {
        codigo_bilhete: codigoBilhete,
      })
      .then((res) => {
        const data = res.data;
        const dataBilhete = data.data_viagem; // ✔ VEM DO BACKEND

        // 🚫 Bilhete não é de hoje
        if (dataBilhete !== dataHoje) {
          setMensagem(`❌ Bilhete de ${dataBilhete} não é válido para hoje (${dataHoje}).`);
          return;
        }

        // 🚫 Bilhete não pertence a esta rota
        if (data.rota_id !== rotaId) {
          setMensagem("❌ Bilhete inválido para esta rota.");
          return;
        }

        // ✔ Bilhete válido
        setMensagem("✅ Bilhete aprovado.");
        carregarBilhetes();
      })
      .catch((err) => {
        setMensagem("❌ Erro ao verificar bilhete.");
      });

    setCodigoBilhete("");
  };

  // 🔹 Totais
  const total = bilhetesRows.length;
  const embarcados = bilhetesRows.filter((b) => b.usado).length;
  const faltam = total - embarcados;

  const handleLogout = () => {
    localStorage.removeItem("motoristaLogado");
    window.location.href = "/motorista/login";
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2>🚌 Painel do Motorista Urbano</h2>

      {motorista && (
        <div style={{ background: "#f8f8f8", padding: 10, borderRadius: 8, marginBottom: 10 }}>
          <p><strong>Motorista:</strong> {motorista.nome}</p>
          <p><strong>Telefone:</strong> {motorista.telefone}</p>
        </div>
      )}

      {rotaInfo && (
        <div style={{ marginBottom: 15, background: "#eef", padding: 10, borderRadius: 8 }}>
          <p><strong>Rota:</strong> {rotaInfo.nome}</p>
          <p><strong>Horário:</strong> {rotaInfo.horario}</p>
          <p><strong>📅 Data (hoje):</strong> {dataHoje}</p>
        </div>
      )}

      <button
        onClick={handleLogout}
        style={{ marginBottom: 15, backgroundColor: "#c33", color: "white", padding: "8px 12px", borderRadius: 6 }}
      >
        🔒 Terminar Sessão
      </button>

      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          value={codigoBilhete}
          onChange={(e) => setCodigoBilhete(e.target.value)}
          placeholder="Ex: FABA-123456"
        />
        <button onClick={handleVerificar}>Verificar</button>
      </div>

      {mensagem && <p><strong>{mensagem}</strong></p>}

      <h4>📊 Resumo</h4>
      <p><strong>Total Bilhetes:</strong> {total}</p>
      <p><strong>Embarcados:</strong> {embarcados}</p>
      <p><strong>Faltam:</strong> {faltam}</p>

      <h4>🧍‍♂️ Passageiros por Paragem</h4>

      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Paragem</th>
            <th>Restantes</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            bilhetesRows.reduce((acc, b) => {
              const nome = b.paragem;
              acc[nome] = (acc[nome] || 0) + (b.usado ? 0 : 1);
              return acc;
            }, {})
          ).map(([paragem, qtd]) => (
            <tr key={paragem}>
              <td>{paragem}</td>
              <td>{qtd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MotoristaUrbano;
