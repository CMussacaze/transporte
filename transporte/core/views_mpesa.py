# core/views_mpesa.py  (MODO SIMULACAO)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from decimal import Decimal

from core.models import Reserva, Bilhete, Rota

# ==========================================================
# 1) CRIAR RESERVA PENDENTE
# ==========================================================
@api_view(["POST"])
def iniciar_pagamento(request):
    try:
        rota_id = request.data.get("rota_id")
        paragem_id = request.data.get("paragem_id")
        telefone = request.data.get("telefone")
        quantidade = int(request.data.get("quantidade", 1))

        rota = Rota.objects.get(id=rota_id)
        total = Decimal(rota.valor_passagem) * quantidade

        reserva = Reserva.objects.create(
            rota=rota,
            paragem_embarque_id=paragem_id if paragem_id else None,
            quantidade=quantidade,
            telefone=telefone,
            pago=False,
            valor_total=total,
            data_reserva=timezone.now(),
            tipo_transporte=rota.tipo_transporte or "terrestre"
        )

        return Response({
            "status": "pending",
            "reserva_id": reserva.id,
            "valor_total": str(total)
        })

    except Exception as e:
        return Response({"erro": str(e)}, status=500)


# ==========================================================
# 2) ENVIAR PAGAMENTO (SIMULADO)
# ==========================================================
@api_view(["POST"])
def mpesa_pagar(request):
    """
    MODO SIMULAÇÃO:
    - NÃO chama API do M-Pesa
    - Marca pago=True automaticamente
    - Gera bilhetes na hora
    """
    try:
        reserva_id = request.data.get("reserva_id")
        reserva = Reserva.objects.get(id=reserva_id)

        # marca como pago
        reserva.pago = True
        reserva.save()

        # gerar bilhetes imediatamente
        for i in range(reserva.quantidade):
            Bilhete.objects.create(
                reserva=reserva,
                nome_passageiro="Passageiro",
                telefone_passageiro=reserva.telefone,
                data_viagem=timezone.now().date()
            )

        return Response({
            "status": "simulated_paid",
            "mensagem": "Pagamento simulado com sucesso",
            "reserva_id": reserva_id
        })

    except Exception as e:
        return Response({"erro": str(e)}, status=500)


# ==========================================================
# 3) STATUS
# ==========================================================
@api_view(["GET"])
def mpesa_status(request):
    try:
        reserva_id = request.query_params.get("reserva_id")
        reserva = Reserva.objects.get(id=reserva_id)

        bilhetes = [{
            "codigo": b.codigo,
            "nome": b.nome_passageiro,
        } for b in reserva.bilhetes.all()]

        return Response({
            "pago": reserva.pago,
            "bilhetes": bilhetes
        })

    except Exception as e:
        return Response({"erro": str(e)}, status=500)


# ==========================================================
# 4) CALLBACK — DESATIVADO MAS MANTIDO
# ==========================================================
@api_view(["POST"])
def mpesa_callback(request):
    return Response({"status": "callback_desativado"})
