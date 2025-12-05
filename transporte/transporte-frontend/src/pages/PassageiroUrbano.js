import React, { useState, useEffect } from "react";
import axios from "axios";

const PassageiroUrbano = () => {
    const [cidades, setCidades] = useState([]);
    const [cidadeSelecionada, setCidadeSelecionada] = useState("");
    const [tipoTransporte, setTipoTransporte] = useState("");
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [rotas, setRotas] = useState([]);  // Estado para as rotas
    const [rotaSelecionada, setRotaSelecionada] = useState("");
    const [bilhete, setBilhete] = useState(null);  // Armazenar o bilhete gerado

    // Buscar lista de cidades na API
    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/cidades/")
            .then((response) => {
                setCidades(response.data); // Atualiza o estado com os dados da API
            })
            .catch((error) => {
                console.error("Erro ao buscar cidades:", error);
            });
    }, []);

    // Buscar rotas com base na cidade e tipo de transporte selecionados
    useEffect(() => {
        if (cidadeSelecionada && tipoTransporte) {
            axios.get("http://127.0.0.1:8000/api/rotas/", {
                params: { cidade: cidadeSelecionada, transporte: tipoTransporte }
            })
                .then((response) => {
                    setRotas(response.data);
                })
                .catch((error) => {
                    console.error("Erro ao buscar rotas:", error);
                });
        }
    }, [cidadeSelecionada, tipoTransporte]);

    // Enviar os dados da reserva
    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Reserva enviada:", { cidadeSelecionada, tipoTransporte, nome, telefone, rotaSelecionada });

        // Enviar dados para a API de reservas
        const reserva = {
            nome,
            telefone,
            rota_id: rotaSelecionada,
        };

        axios.post("http://127.0.0.1:8000/api/reservas/", reserva)
            .then((response) => {
                setBilhete(response.data);  // Armazena o bilhete gerado
                alert("Reserva realizada com sucesso!");
            })
            .catch((error) => {
                alert("Erro ao criar reserva.");
            });
    };

    return (
        <div>
            <h1>Reserva de Bilhete Urbano</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Cidade:
                    <select value={cidadeSelecionada} onChange={(e) => setCidadeSelecionada(e.target.value)}>
                        <option value="">Selecione uma cidade</option>
                        {cidades.map((cidade) => (
                            <option key={cidade.id} value={cidade.id}>
                                {cidade.nome}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Tipo de Transporte:
                    <select value={tipoTransporte} onChange={(e) => setTipoTransporte(e.target.value)}>
                        <option value="">Selecione o transporte</option>
                        <option value="terrestre">Terrestre</option>
                        <option value="ferroviario">Ferroviário</option>
                        <option value="maritimo">Marítimo</option>
                    </select>
                </label>

                <label>
                    Rota:
                    <select value={rotaSelecionada} onChange={(e) => setRotaSelecionada(e.target.value)}>
                        <option value="">Selecione a rota</option>
                        {rotas.map((rota) => (
                            <option key={rota.id} value={rota.id}>
                                {rota.nome}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Nome:
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </label>

                <label>
                    Telefone:
                    <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
                </label>

                <button type="submit">Confirmar Reserva</button>
            </form>

            {bilhete && (
                <div className="bilhete">
                    <h3>Bilhete Digital</h3>
                    <p><strong>Passageiro:</strong> {bilhete.nome}</p>
                    <p><strong>Telefone:</strong> {bilhete.telefone}</p>
                    <p><strong>Rota:</strong> {bilhete.rota}</p>
                    <p><strong>Horário:</strong> {bilhete.horario}</p>
                    <button onClick={() => alert("Futuramente será possível baixar!")}>Baixar Bilhete</button>
                </div>
            )}
        </div>
    );
};

export default PassageiroUrbano;
