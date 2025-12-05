// src/pages/ReservaUrbano.js
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./ReservaUrbano.css"; // <-- novo ficheiro de estilo

const ReservaUrbano = () => {
  const [rotas, setRotas] = useState([]);
  const [rotaSelecionada, setRotaSelecionada] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [tipoTransporte, setTipoTransporte] = useState("terrestre");
  const [bilhete, setBilhete] = useState(null);

  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [metodo, setMetodo] = useState("mpesa");
  const [telMpesa, setTelMpesa] = useState("");
  const [pendReservaId, setPendReservaId] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const pollRef = useRef(null);

  const [paragens, setParagens] = useState([]);
  const [paragemSelecionada, setParagemSelecionada] = useState("");

  const configUsuario = JSON.parse(localStorage.getItem("configUsuario")) || {};
  const { nome, telefone, cidadeSelecionada } = configUsuario;
  const [tipoRota, setTipoRota] = useState("");

  // Modal sizing for keyboard / mobile friendliness
  const [modalMaxHeight, setModalMaxHeight] = useState(() => {
    return Math.round(window.innerHeight * 0.62); // px
  });

  useEffect(() => {
    if (cidadeSelecionada && tipoTransporte) {
      axios
        .get("http://127.0.0.1:8000/api/rotas/", {
          params: {
            cidade: cidadeSelecionada,
            tipo_transporte: tipoTransporte,
            tipo_rota: "urbana",
          },
        })
        .then((res) => setRotas(res.data.filter((r) => r.status)))
        .catch(console.error);
    }
  }, [cidadeSelecionada, tipoTransporte]);

  useEffect(() => {
    if (rotaSelecionada) {
      axios
        .get("http://127.0.0.1:8000/api/paragens/", {
          params: { rota: rotaSelecionada },
        })
        .then((res) => {
          setParagens(res.data);
          if (res.data.length > 0) setParagemSelecionada(res.data[0].id);
        })
        .catch(console.error);
    }
  }, [rotaSelecionada]);

  const calcularTotal = () => {
    const rotaInfo = rotas.find((r) => r.id === parseInt(rotaSelecionada));
    if (!rotaInfo) return 0;
    return parseFloat(rotaInfo.valor_passagem) * quantidade;
  };

  const handleComprarClick = (e) => {
    e.preventDefault();
    if (!rotaSelecionada || quantidade < 1) {
      alert("Por favor, selecione uma rota e a quantidade.");
      return;
    }
    setModalPagoOpen(true);
    setMetodo("mpesa");
    setTelMpesa(telefone || "");
    setPaymentMessage("");
    // quando abre modal de pagamento, aumenta a altura disponível (útil mobile)
    setModalMaxHeight(Math.round(window.innerHeight * 0.9));
  };

  const cancelarPagamento = async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPaymentProcessing(false);
    setPaymentMessage("Pagamento cancelado.");
    setModalPagoOpen(false);

    if (pendReservaId) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/reservas/${pendReservaId}/`);
      } catch (err) {
        console.warn("Não foi possível apagar reserva pendente:", err?.response?.data || err.message);
      }
    }
    setPendReservaId(null);
  };

  // fluxo: 1) criar reserva pendente, 2) push mpesa, 3) polling
  const confirmarPagamento = async () => {
    const tel = (telMpesa || "").trim();
    if (!tel) {
      setPaymentMessage("Insira um número de telefone para o pagamento.");
      return;
    }
    setPaymentProcessing(true);
    setPaymentMessage("A iniciar pagamento...");

    try {
      const iniciar = await axios.post("http://127.0.0.1:8000/api/iniciar-pagamento/", {
        rota_id: rotaSelecionada,
        paragem_id: paragemSelecionada,
        telefone: tel,
        quantidade,
        nome: nome || "",
        tipo_transporte: tipoTransporte,
      });

      const reserva_id = iniciar.data.reserva_id;
      setPendReservaId(reserva_id);

      const msisdn = tel.startsWith("258") ? tel : "258" + tel;
      const push = await axios.post("http://127.0.0.1:8000/api/mpesa-pagar/", {
        reserva_id,
        telefone: msisdn,
      });

      // interpreta resposta do backend
      if (push.data && (push.data.status === "push_sent" || (push.data.output_ResponseCode === "INS-0"))) {
        setPaymentMessage("Pedido M-Pesa enviado — confirmar no telefone. Aguardando confirmação...");
      } else {
        // mantém polling curto para debug e tenta limpar depois
        setPaymentMessage("Pedido M-Pesa enviado mas a gateway deu resposta não-ok. Aguardando confirmação...");
      }

      // polling
      let attempts = 0;
      const maxAttempts = 40;
      const intervalMs = 3000;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const r = await axios.get("http://127.0.0.1:8000/api/mpesa-status/", { params: { reserva_id } });
          const body = r.data;
          if (body.pago || (Array.isArray(body.bilhetes) && body.bilhetes.length > 0)) {
            const codigos = Array.isArray(body.bilhetes) ? body.bilhetes.map((b) => b.codigo).filter(Boolean) : [];
            setBilhete({
              codigos,
              rota: rotas.find((x) => x.id === parseInt(rotaSelecionada))?.nome || "",
              nr_rota: "",
              quantidade: body.quantidade || quantidade,
              valor: parseFloat(body.valor_total || calcularTotal() / quantidade || 0),
              rota_horario: "",
              paragem_embarque_nome: paragens.find((p) => p.id === parseInt(paragemSelecionada))?.nome_paragem || "",
            });

            clearInterval(pollRef.current);
            pollRef.current = null;
            setPaymentProcessing(false);
            setModalPagoOpen(false);
            setPendReservaId(null);
            setPaymentMessage("Pagamento confirmado — bilhete emitido.");
            return;
          } else {
            if (attempts >= maxAttempts) {
              clearInterval(pollRef.current);
              pollRef.current = null;
              setPaymentProcessing(false);
              setPaymentMessage("Tempo esgotado. Pagamento não confirmado. A reserva pendente será removida.");
              // tenta apagar reserva pendente
              try {
                await axios.delete(`http://127.0.0.1:8000/api/reservas/${reserva_id}/`);
              } catch (errDel) {
                console.warn("Não foi possível apagar reserva pendente:", errDel?.response?.data || errDel.message);
              }
              setPendReservaId(null);
              return;
            } else {
              setPaymentMessage(`Aguardando confirmação... tentativa ${attempts}/${maxAttempts}`);
            }
          }
        } catch (errInner) {
          console.error("Erro a verificar estado da reserva:", errInner?.response?.data || errInner.message);
          if (attempts >= maxAttempts) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setPaymentProcessing(false);
            setPaymentMessage("Tempo esgotado. Pagamento não confirmado. A reserva pendente será removida.");
            try {
              await axios.delete(`http://127.0.0.1:8000/api/reservas/${reserva_id}/`);
            } catch (e) {
              console.warn(e);
            }
            setPendReservaId(null);
          } else {
            setPaymentMessage(`Aguardando confirmação... tentativa ${attempts}/${maxAttempts}`);
          }
        }
      }, intervalMs);
    } catch (err) {
      console.error("Erro ao iniciar pagamento:", err?.response?.data || err.message);
      setPaymentProcessing(false);
      setPaymentMessage("Erro ao iniciar pagamento. Tente novamente.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleComprarClick(e);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  // small helpers to show friendly labels
  const tipoRotaLabel = tipoRota === "interprovincial" ? "Interprovincial" : "Urbano";

  return (
    <div className="reserva-container">
      <h2 className="titulo-yango">Comprar Bilhete</h2>

      {/* CIDADE */}
		<p>
		  <strong>Cidade:</strong> {configUsuario?.cidadeNome || "—"}
		  {/* Se quiser um ícone que indique que se edita via menu, pode adicionar um pequeno hint */}
		  <span style={{ marginLeft: 8, color: "#888", fontSize: 13 }}> (edite pelo menu)</span>

	  {/* TIPO DE TRANSPORTE (direita) */}
	  <div className="text-right">
		<label className="text-gray-600 text-sm font-semibold block">
		  
		</label>
		<select
		  className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-gray-800 text-sm shadow"
		  value={tipoTransporte}
		  onChange={(e) => setTipoTransporte(e.target.value)}
		>
		  <option value="terrestre">Terrestre</option>
		  <option value="maritimo">Marítimo</option>
		  <option value="ferroviario">Ferroviário</option>
		</select>
	  </div>
	  </p>

      {/* ROTA */}
      <div className="campo-yango">
        <label className="label-yango">Rota</label>
        <select
          className="input-yango"
          value={rotaSelecionada}
          onChange={(e) => setRotaSelecionada(e.target.value)}
        >
          <option value="">Selecione...</option>
          {rotas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome} — {r.valor_passagem} MZN
            </option>
          ))}
        </select>
      </div>

      {/* PARAGEM */}
      {paragens.length > 0 && (
        <div className="campo-yango">
          <label className="label-yango">Paragem de Embarque</label>
          <select
            className="input-yango"
            value={paragemSelecionada}
            onChange={(e) => setParagemSelecionada(e.target.value)}
          >
            {paragens.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_paragem}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* QUANTIDADE */}
      <div className="campo-yango">
        <label className="label-yango">Quantidade</label>
        <input
          className=""
          type="number"
          min="1"
          value={quantidade}
          onChange={(e) => setQuantidade(parseInt(e.target.value))}
        />
      </div>

      {/* TOTAL */}
      {rotaSelecionada && (
        <div className="total-yango">
          Total: <strong>{calcularTotal().toFixed(2)} MZN</strong>
        </div>
      )}

      {/* BOTÃO */}
      <button className="btn-yango" onClick={handleComprarClick}>
        Comprar Bilhete
      </button>

      {/* MODAL PAGA */}
      {modalPagoOpen && (
        <div className="modal-bg">
          <div className="modal-yango">
            <h3>Pagamento</h3>

            <p className="info-pagamento">
              Vai receber um pedido no seu telefone.
            </p>

            <label>Número M-Pesa</label>
            <input
              className="input-yango"
              value={telMpesa}
              onChange={(e) => setTelMpesa(e.target.value)}
            />

            <button disabled={paymentProcessing} onClick={confirmarPagamento} className="btn-yango">Confirmar Pagamento</button>

            <button
              className="btn-cancelar"
              onClick={() => setModalPagoOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservaUrbano;
