import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ConfigInicial = ({ onConfigurar }) => {
    const [cidades, setCidades] = useState([]);
    const [cidadeSelecionada, setCidadeSelecionada] = useState("");
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const navigate = useNavigate();  // Hook para navegação

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/cidades/")
            .then((response) => {
                setCidades(response.data);
            })
            .catch((error) => {
                console.error("Erro ao buscar cidades:", error);
            });
    }, []);

    const handleSalvar = () => {
		const cidadeObj = cidades.find((c) => c.id === parseInt(cidadeSelecionada));
		const dadosUsuario = {
			cidadeSelecionada,
			cidadeNome: cidadeObj ? cidadeObj.nome : "",
			nome,
			telefone,
		};
        localStorage.setItem("configUsuario", JSON.stringify(dadosUsuario));
        onConfigurar(dadosUsuario);  // Atualiza o estado no App.js
        navigate("/home");  // Redireciona para a tela de reserva
    };

    return (
        <div>
            <h2>Configuração Inicial</h2>
            
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
                Nome:
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </label>

            <label>
                Telefone:
                <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </label>

            <button onClick={handleSalvar}>Salvar</button>
        </div>
    );
};

export default ConfigInicial;
