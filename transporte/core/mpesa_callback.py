from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["POST"])
def mpesa_callback(request):
    print("📥 CALLBACK RECEBIDO:", request.data)

    # aqui validas pagamento e atualizas a reserva
    return Response({"status": "callback recebido"})
