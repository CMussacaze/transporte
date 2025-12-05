const pagar = () => {
  axios.post("http://127.0.0.1:8000/api/mpesa/iniciar/", {
    rota_id,
    paragem_id,
    telefone,
    quantidade
  })
  .then(res => {
    alert("Pagamento enviado para o seu telemóvel. Conclua no M-Pesa.");
  })
  .catch(() => alert("Erro ao iniciar pagamento."));
};
