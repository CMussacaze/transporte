import React, { useState, useEffect } from "react";
import axios from "axios";

const ReutilizarInterprovincial = () => {
    const [codigo, setCodigo] = useState("");
    const [reserva, setReserva] = useState(null);
    const [rotas, setRotas] = useState([]);
    const [novaRotaId, setNovaRotaId] = useState("");
    const [datasDisponiveis, setDatasDisponiveis] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState("");

    const [novoBilhete, setNovoBilhete] = useState(null); // ⇐ Novo

    // Carregar rotas interprovinciais
    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/rotas/?tipo_rota=interprovincial")
            .then((res) => setRotas(res.data))
            .catch(() => alert("Erro ao carregar rotas."));
    }, []);

    // Carregar datas disponíveis
    useEffect(() => {
        if (novaRotaId) {
            axios.get(`http://127.0.0.1:8000/api/agenda-viagem/?rota=${novaRotaId}`)
                .then((res) => setDatasDisponiveis(res.data))
                .catch(() => alert("Erro ao carregar datas disponíveis."));
        } else {
            setDatasDisponiveis([]);
        }
    }, [novaRotaId]);

    // Buscar reserva
    const buscarReserva = () => {
        if (!codigo.trim()) return alert("Insira o código do bilhete.");

        axios.get(`http://127.0.0.1:8000/api/reservas/?codigo_bilhete=${codigo}`)
            .then((res) => {
                const encontrada = res.data.find(
                    (r) => r.tipo_rota === "interprovincial" && !r.usado
                );

                if (encontrada) {
                    setReserva(encontrada);
                    setNovoBilhete(null); // limpar impressão anterior

                    // Se for bilhete múltiplo → rota bloqueada
                    if (encontrada.quantidade > 1) {
                        alert("⚠️ Reserva com vários passageiros — só poderá alterar a DATA.");
                        setNovaRotaId(encontrada.rota); // trava rota
                    }
                } else {
                    alert("Bilhete não encontrado ou já utilizado.");
                    setReserva(null);
                }
            })
            .catch(() => alert("Erro ao buscar bilhete."));
    };

    // Confirmar reutilização
    const confirmarReutilizacao = () => {
        if (!reserva || !dataSelecionada) {
            alert("Por favor, selecione a data.");
            return;
        }

        axios.post("http://127.0.0.1:8000/api/reutilizar-bilhete-interprovincial/", {
            codigo_bilhete: codigo,
            nova_rota: novaRotaId || reserva.rota,
            nova_data: dataSelecionada,
        })
        .then((res) => {
            alert("✅ Bilhete reutilizado com sucesso!");

            setNovoBilhete({
                novo_codigo: res.data.novo_codigo,
                rota_nome: reserva.rota_nome,
                horario: reserva.horario,
                nr_rota: reserva.nr_rota,
                paragem_embarque_nome: reserva.paragem_embarque_nome,
                quantidade: reserva.quantidade,
                valor_total: res.data.valor_total
            });
        })
        .catch((err) => {
            alert(err.response?.data?.erro || "Erro ao reutilizar bilhete.");
        });
    };

    // Imprimir bilhete
    const imprimirBilhete = () => {
        if (!novoBilhete) return;

        const w = window.open("", "_blank");
        w.document.write(`
            <html>
            <head>
                <title>Bilhete Interprovincial</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 14px; }
                    .ticket { border: 1px solid #000; padding: 12px; width: 320px; }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <h3>🎫 Bilhete Reutilizado</h3>
                    <p><strong>Nº de Bilhete:</strong> ${novoBilhete.novo_codigo}</p>
                    <p><strong>Rota:</strong> ${novoBilhete.rota_nome}</p>
                    <p><strong>Horário:</strong> ${novoBilhete.horario}</p>
                    <p><strong>Paragem:</strong> ${novoBilhete.paragem_embarque_nome || "—"}</p>
                    <p><strong>Qtd Passageiros:</strong> ${novoBilhete.quantidade}</p>
                    <p><strong>Comissão paga:</strong> ${parseFloat(novoBilhete.valor_total).toFixed(2)} MZN</p>
                    <hr />
                    <p>Boa viagem!</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        w.document.close();
    };

    return (
        <div>
            <h3>♻️ Reutilizar Bilhete (Interprovincial)</h3>

            <input
                type="text"
                placeholder="Digite o código do bilhete"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
            />
            <button onClick={buscarReserva}>Buscar</button>

            {reserva && (
                <div style={{ marginTop: 15 }}>
                    <p><strong>Ref:</strong> {reserva.codigo_bilhete}</p>
                    <p><strong>Rota Atual:</strong> {reserva.rota_nome}</p>

                    {reserva.quantidade <= 1 && (
                        <>
                            <label>Nova Rota:</label>
                            <select value={novaRotaId} onChange={(e) => setNovaRotaId(e.target.value)}>
                                <option value="">-- Escolha uma nova rota --</option>
                                {rotas.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome} - {r.horario}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {reserva.quantidade > 1 && (
                        <p style={{ color: "red" }}>
                            🔒 Reserva com vários passageiros – rota bloqueada. Escolha apenas data.
                        </p>
                    )}

                    <label>Data da Nova Viagem:</label>
                    <select value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)}>
                        <option value="">-- Selecione uma data --</option>
                        {datasDisponiveis.map(d => (
                            <option key={d.id} value={d.data}>{d.data}</option>
                        ))}
                    </select>

                    <button style={{ marginTop: 10 }} onClick={confirmarReutilizacao}>
                        Confirmar Reutilização
                    </button>
                </div>
            )}

            {novoBilhete && (
                <div style={{ marginTop: 25, padding: 15, border: "1px solid #ccc", borderRadius: 8 }}>
                    <h3>🎫 Novo Bilhete</h3>
                    <p><strong>Nº de Bilhete:</strong> {novoBilhete.novo_codigo}</p>
                    <p><strong>Rota:</strong> {novoBilhete.rota_nome}</p>
                    <p><strong>Qtd:</strong> {novoBilhete.quantidade}</p>
                    <p><strong>Comissão Paga:</strong> {parseFloat(novoBilhete.valor_total).toFixed(2)} MZN</p>

                    <button onClick={imprimirBilhete} style={{ marginTop: 10 }}>
                        🖨️ Imprimir Bilhete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReutilizarInterprovincial;
