from django.core.management.base import BaseCommand
from core.models import Rota
from datetime import datetime
from django.utils.timezone import localtime

class Command(BaseCommand):
    help = 'Desativa rotas urbanas cujo horário já passou'

    def handle(self, *args, **kwargs):
        agora = localtime().time()
        rotas_expiradas = Rota.objects.filter(status=True, tipo_rota='urbana', horario__lt=agora)

        for rota in rotas_expiradas:
            rota.status = False
            rota.save()
            self.stdout.write(self.style.SUCCESS(f'Rota {rota.nome} desativada.'))

        self.stdout.write(self.style.SUCCESS(f'Total de rotas desativadas: {rotas_expiradas.count()}'))
