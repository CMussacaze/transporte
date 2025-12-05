// src/pages/PassageiroInterprovincial.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../components/ReservaUrbano.css";

const PassageiroInterprovincial = () => {
  const [rotas, setRotas] = useState([]);
  const [rotaSelecionada, setRotaSelecionada] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [bilhete, setBilhete] = useState(null);
  const [paragens, setParagens] = useState([]);
  const [paragemSelecionada, setParagemSelecionada] = useState("");
  const [datasAgenda, setDatasAgenda] = useState([]);
  const [dataViagem, setDataViagem] = useState("");

  // Lista de passageiros dinâmica
  const [passageiros, setPassageiros] = useState([{ nome: "", telefone: "" }]);

  // Contacto de emergência
  const [contactoEmergenciaNome, setContactoEmergenciaNome] = useState("");
  const [contactoEmergenciaTelefone, setContactoEmergenciaTelefone] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/rotas/", {
        params: { tipo_rota: "interprovincial" },
      })
      .then((res) => setRotas(res.data))
      .catch((err) => console.error("Erro ao carregar rotas:", err));
  }, []);

  useEffect(() => {
    if (rotaSelecionada) {
      axios
        .get("http://127.0.0.1:8000/api/agenda-viagem/", {
          params: { rota: rotaSelecionada },
        })
        .then((res) => {
          const datasDisponiveis = res.data.map((item) => item.data);
          setDatasAgenda(datasDisponiveis);
        })
        .catch((err) => console.error("Erro ao buscar datas da agenda:", err));
    } else {
      setDatasAgenda([]);
      setDataViagem("");
    }
  }, [rotaSelecionada]);

  useEffect(() => {
    if (rotaSelecionada) {
      axios
        .get(`http://127.0.0.1:8000/api/paragens/?rota=${rotaSelecionada}`)
        .then((response) => {
          setParagens(response.data);
          if (response.data.length > 0) {
            setParagemSelecionada(String(response.data[0].id));
          }
        })
        .catch((error) => console.error("Erro ao carregar paragens:", error));
    } else {
      setParagens([]);
      setParagemSelecionada("");
    }
  }, [rotaSelecionada]);

  // Atualiza número de formulários quando quantidade mudar
  useEffect(() => {
    setPassageiros((prev) =>
      Array.from({ length: Math.max(1, quantidade) }, (_, i) => prev[i] || { nome: "", telefone: "" })
    );
  }, [quantidade]);

  const handlePassageiroChange = (index, field, value) => {
    setPassageiros((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleReserva = () => {
    if (passageiros.some((p) => !p.nome || !p.telefone)) {
      return alert("Preencha o nome e telefone de todos os passageiros.");
    }
    if (!contactoEmergenciaNome || !contactoEmergenciaTelefone)
      return alert("Preencha os dados de contacto de emergência.");
    if (!dataViagem) return alert("Selecione a data da viagem.");
    if (!rotaSelecionada) return alert("Selecione a rota.");

    axios
      .post("http://127.0.0.1:8000/api/reservas/", {
        rota: rotaSelecionada,
        quantidade, // o backend sobrescreve com passageiros.length
        tipo_transporte: "terrestre",
        data_viagem: dataViagem,
        passageiros, // lista de passageiros
        contacto_emergencia_nome: contactoEmergenciaNome,
        contacto_emergencia_telefone: contactoEmergenciaTelefone,
        paragem_embarque: paragemSelecionada || null,
      })
      .then((res) => {
        const rotaInfo = rotas.find((r) => String(r.id) === String(rotaSelecionada));
        setBilhete({
          rota: rotaInfo?.nome || "",
          quantidade: passageiros.length,
          valor: rotaInfo?.valor_passagem || 0,
          codigos: res.data.codigos_bilhetes || [],
          nomes: passageiros.map((p) => p.nome).join(", "),
          data: dataViagem,
          paragem_embarque_nome: res.data.paragem_embarque_nome || "",
        });
      })
      .catch((error) => {
        if (error.response?.data) {
          alert("Erro:\n" + JSON.stringify(error.response.data, null, 2));
        } else {
          alert("Erro de conexão com o servidor.");
        }
      });
  };

  return (
    <div>
      <h2>Reserva Interprovincial</h2>

      <label>Rota: </label>
      <select value={rotaSelecionada} onChange={(e) => setRotaSelecionada(e.target.value)}>
        <option value="">-- Selecione uma rota --</option>
        {rotas.map((rota) => (
          <option key={rota.id} value={rota.id}>
            {rota.nome} - {rota.horario} | {rota.valor_passagem} MZN
          </option>
        ))}
      </select>

      {paragens.length > 0 && (
        <>
          <label>Local de Embarque: </label>
          <select value={paragemSelecionada} onChange={(e) => setParagemSelecionada(e.target.value)}>
            {paragens.map((paragem) => (
              <option key={paragem.id} value={paragem.id}>
                {paragem.nome_paragem}
              </option>
            ))}
          </select>
        </>
      )}

      {datasAgenda.length > 0 && (
        <>
          <label>Data da Viagem: </label>
          <select value={dataViagem} onChange={(e) => setDataViagem(e.target.value)}>
            <option value="">-- Selecione uma data --</option>
            {datasAgenda.map((data, idx) => (
              <option key={idx} value={data}>
                {data}
              </option>
            ))}
          </select>
        </>
      )}
	  <p>
      <label>Nº de Bilhetes: </label>
      <input
        type="number"
        min="1"
        value={quantidade}
        onChange={(e) => setQuantidade(parseInt(e.target.value || "1", 10))}
      />
	  </p>
      <h4>🧍 Dado(s) do(s) Passageiro(s)</h4>
      {passageiros.map((p, index) => (
        <div key={index} style={{ border: "1px solid #ccc", padding: "8px", marginBottom: "6px" }}>
          <label>Nome {index + 1}: </label>
          <input
            type="text"
            value={p.nome}
            onChange={(e) => handlePassageiroChange(index, "nome", e.target.value)}
          />
		  <p>
          <label>Telefone {index + 1}: </label>
          <input
            type="text"
            value={p.telefone}
            onChange={(e) => handlePassageiroChange(index, "telefone", e.target.value)}
          />
		  </p>
        </div>
      ))}

      <h4>📞 Contacto de Emergência</h4>
      <label>Nome: </label>
      <input
        type="text"
        value={contactoEmergenciaNome}
        onChange={(e) => setContactoEmergenciaNome(e.target.value)}
      />
	  <p>
      <label>Telefone: </label>
      <input
        type="text"
        value={contactoEmergenciaTelefone}
        onChange={(e) => setContactoEmergenciaTelefone(e.target.value)}
      />
	  </p>
	  <p>
      <button className="titulo-yango" onClick={handleReserva}>Confirmar Reserva</button>
	  </p>
      {bilhete && (
        <div className="bilhete">
          <h3>🎫 Bilhetes Gerados</h3>
          <p>
            <strong>Passageiros:</strong> {bilhete.nomes}
          </p>
          <p>
            <strong>Códigos dos Bilhetes:</strong>{" "}
            {Array.isArray(bilhete.codigos) ? bilhete.codigos.join(", ") : "—"}
          </p>
          <p>
            <strong>Rota:</strong> {bilhete.rota}
          </p>
          <p>
            <strong>Data:</strong> {bilhete.data}
          </p>
          <p>
            <strong>Paragem de Embarque:</strong> {bilhete.paragem_embarque_nome || "—"}
          </p>
          <p>
            <strong>Total:</strong>{" "}
            {((bilhete.quantidade || 0) * parseFloat(bilhete.valor || 0)).toFixed(2)} MZN
          </p>
		  
		  <button onClick={() => alert("Futuramente será possível baixar!")}>⬇️ Baixar Bilhete</button>
        </div>
      )}
    </div>
  );
};

export default PassageiroInterprovincial;
