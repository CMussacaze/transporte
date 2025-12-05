from django.db import models
from datetime import date
from django.utils import timezone
from decimal import Decimal

# Create your models here.
import random
from django.db import models
from django.utils import timezone

class Proprietario(models.Model):
    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.nome

class Veiculo(models.Model):
    TIPO_VEICULO_CHOICES = [
        ('autocarro', 'Autocarro'),
        ('camiao', 'Camião')
    ]
    nome_proprietario = models.CharField(max_length=255, null=True, blank=True)
    telefone = models.CharField(max_length=15, null=True, blank=True)
    tipo = models.CharField(max_length=10, choices=TIPO_VEICULO_CHOICES)
    modelo = models.CharField(max_length=100)
    capacidade = models.IntegerField()
    placa = models.CharField(max_length=20, unique=True)
    renda_diaria = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    renda_mensal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.BooleanField(default=True)  # <- Ativo ou inativo

    def __str__(self):
        return f"{self.modelo} - {self.placa}"

class Cidade(models.Model):
    nome = models.CharField(max_length=100)

    def __str__(self):
        return self.nome

class Rota(models.Model):
    TIPO_ROTA_CHOICES = [
    ("urbana", "Urbana"),
    ("interprovincial", "Interprovincial"),
]
    nome = models.CharField(max_length=255)
    cidade = models.ForeignKey(Cidade, on_delete=models.CASCADE)
    tipo_rota = models.CharField(max_length=20, choices=[("urbana", "Urbana"), ("interprovincial", "Interprovincial")], default="urbana")
    tipo_transporte = models.CharField(max_length=20, choices=[("terrestre", "Terrestre"), ("ferroviario", "Ferroviário"), ("maritimo", "Marítimo")], default="terrestre")
    
    horario = models.TimeField()
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE, null=True, blank=True)
    valor_passagem = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    status = models.BooleanField(default=True)
    nr_rota = models.CharField(max_length=255, blank=True)
    motorista = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='rotas_motorista')
    tipo_rota = models.CharField(max_length=20, choices=TIPO_ROTA_CHOICES, default="urbana")
    data_rota = models.DateField(default=timezone.now)
    
    def save(self, *args, **kwargs):
        if not self.nr_rota:
            self.nr_rota = f"{self.nome}-{self.horario.strftime('%H%M')}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} ({self.nr_rota})"

class Reserva(models.Model):
    nome = models.CharField(max_length=255, null=True, blank=True)
    telefone = models.CharField(max_length=15, null=True, blank=True)
    rota = models.ForeignKey("Rota", on_delete=models.CASCADE)
    tipo_transporte = models.CharField(
        max_length=20,
        choices=[
            ("terrestre", "Terrestre"),
            ("ferroviario", "Ferroviário"),
            ("maritimo", "Marítimo"),
        ]
    )
    quantidade = models.PositiveIntegerField(default=1)
    nome_passageiro = models.CharField(max_length=255, null=True, blank=True)
    telefone_passageiro = models.CharField(max_length=15, null=True, blank=True)
    contacto_emergencia_nome = models.CharField(max_length=255, null=True, blank=True)
    contacto_emergencia_telefone = models.CharField(max_length=15, null=True, blank=True)
    bagagem_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    ref_bagagem = models.CharField(max_length=255, null=True, blank=True)
    data_reserva = models.DateTimeField(auto_now_add=True)
    data_viagem = models.DateField(default=date.today)
    paragem_embarque = models.ForeignKey('Paragem', on_delete=models.SET_NULL, null=True, blank=True)
    codigo_bilhete = models.CharField(max_length=20, unique=True, blank=True, null=True)
    usado = models.BooleanField(default=False)
    embarcado = models.BooleanField(default=False)
    agenda = models.ForeignKey("AgendaViagem", on_delete=models.SET_NULL, null=True, blank=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pago = models.BooleanField(default=False)

    def gerar_codigo_bilhete(self):
        if self.rota and self.rota.nome:
            sigla = ''.join([parte[:2].upper() for parte in self.rota.nome.split('-')])
        else:
            sigla = "XX"
        numero = random.randint(100000, 999999)
        return f"{sigla}-{numero}"

    def save(self, *args, **kwargs):
        if not self.codigo_bilhete:
            self.codigo_bilhete = self.gerar_codigo_bilhete()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} - {self.rota} ({self.codigo_bilhete})"
 
class Usuario(models.Model):
    nome = models.CharField(max_length=100)
    nome_usuario = models.CharField(max_length=100, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=15)
    senha = models.CharField(max_length=128)
    tipo = models.CharField(max_length=20, choices=[
        ("administrador", "Administrador"),
        ("proprietario", "Proprietário"),
        ("motorista", "Motorista"),   
    ])
    
    def __str__(self):
        return f"{self.nome} ({self.tipo})"

class Paragem(models.Model):
    rota = models.ForeignKey('Rota', on_delete=models.CASCADE)
    nome_paragem = models.CharField(max_length=255)
    ordem = models.PositiveIntegerField()  # Sequência da paragem

    def __str__(self):
        return f"{self.nome_paragem} ({self.rota})"


class VeiculoRota(models.Model):
    veiculo = models.ForeignKey('Veiculo', on_delete=models.CASCADE)
    rota = models.ForeignKey('Rota', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.veiculo} - {self.rota}"
        
class TipoTransporte(models.Model):
    nome = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nome
 
class AgendaViagem(models.Model):
    rota = models.ForeignKey(Rota, on_delete=models.CASCADE, related_name='agendas')
    data = models.DateField()
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.rota.nome} - {self.data}"
 
class Encomenda(models.Model):
    rota = models.ForeignKey(Rota, on_delete=models.CASCADE)
    data_envio = models.DateField(auto_now_add=True)
    quantidade = models.PositiveIntegerField(default=1)
    peso_kg = models.DecimalField("Peso (Kg)", max_digits=6, decimal_places=2)
    ref_bagagem = models.CharField("Referência da Bagagem", max_length=100, unique=True)
    embarcado = models.BooleanField(default=False)

    nome_remetente = models.CharField(max_length=255)
    telefone_remetente = models.CharField(max_length=20)
    nome_receptor = models.CharField(max_length=255)
    telefone_receptor = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.ref_bagagem} - {self.rota.nome}" 

class ConfiguracaoSistema(models.Model):
    comissao_reutilizacao = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=0.10,
        help_text="Percentagem da comissão sobre reutilização (ex: 0.10 = 10%)"
    )

    def __str__(self):
        return "Configuração Geral"
        
class Bilhete(models.Model):
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name="bilhetes")
    nome_passageiro = models.CharField(max_length=255)
    telefone_passageiro = models.CharField(max_length=15)
    codigo = models.CharField(max_length=20, unique=True, blank=True, null=True)
    bagagem_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    data_viagem = models.DateField(null=True, blank=True)
    usado = models.BooleanField(default=False)
    embarcado = models.BooleanField(default=False)

    # ✅ restaurar este método
    def gerar_codigo(self):
        rota = self.reserva.rota if self.reserva else None

        if rota and rota.nome:
            sigla = ''.join(parte[:2].upper() for parte in rota.nome.split('-'))
        else:
            sigla = "XX"

        numero = random.randint(100000, 999999)
        return f"{sigla}-{numero}"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self.gerar_codigo()

        if not self.data_viagem:
            self.data_viagem = self.reserva.data_viagem

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} - {self.nome_passageiro}"

class Payment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("success", "Pago"),
        ("failed", "Falhado"),
        ("cancelled", "Cancelado"),
    ]

    transaction_ref = models.CharField(max_length=128, unique=True)
    reserva = models.ForeignKey("Reserva", on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    msisdn = models.CharField(max_length=20)  # número do cliente
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    meta = models.JSONField(null=True, blank=True)  # qualquer dados extra (response do provedor)      
