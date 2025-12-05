from portalsdk import APIContext, APIMethodType, APIRequest

API_KEY = "insvcs2ipeeye7k35w60z4zk6akic0r7"
PUBLIC_KEY = """MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAmptSWqV7cGUUJJhUBxsMLonux24u+FoTlrb+4Kgc6092JIszmI1QUoMohaDDXSVueXx6IXwYGsjjWY32HGXj1iQhkALXfObJ4DqXn5h6E8y5/xQYNAyd5bpN5Z8r892B6toGzZQVB7qtebH4apDjmvTi5FGZVjVYxalyyQkj4uQbbRQjgCkubSi45Xl4CGtLqZztsKssWz3mcKncgTnq3DHGYYEYiKq0xIj100LGbnvNz20Sgqmw/cH+Bua4GJsWYLEqf/h/yiMgiBbxFxsnwZl0im5vXDlwKPw+QnO2fscDhxZFAwV06bgG0oEoWm9FnjMsfvwm0rUNYFlZ+TOtCEhmhtFp+Tsx9jPCuOd5h2emGdSKD8A6jtwhNa7oQ8RtLEEqwAn44orENa1ibOkxMiiiFpmmJkwgZPOG/zMCjXIrrhDWTDUOZaPx/lEQoInJoE2i43VN/HTGCCw8dKQAwg0jsEXau5ixD0GUothqvuX3B9taoeoFAIvUPEq35YulprMM7ThdKodSHvhnwKG82dCsodRwY428kg2xM/UjiTENog4B6zzZfPhMxFlOSFX4MnrqkAS+8Jamhy1GgoHkEMrsT5+/ofjCx0HjKbT5NuA2V/lmzgJLl3jIERadLzuTYnKGWxVJcGLkWXlEPYLbiaKzbJb2sYxt+Kt5OxQqC1MCAwEAAQ=="""

SERVICE_PROVIDER = "171717"

# 👇 ALTERE AQUI PARA O SEU NÚMERO (em formato internacional)
TELEFONE = "258847648013"  
VALOR = "10"  # valor de teste

ctx = APIContext()
ctx.api_key = API_KEY
ctx.public_key = PUBLIC_KEY
ctx.ssl = True
ctx.method_type = APIMethodType.POST
ctx.address = "api.sandbox.vm.co.mz"
ctx.port = 18352
ctx.path = "/ipg/v1x/c2bPayment/singleStage/"

# 🔥 Adicionar HEADER obrigatório
ctx.add_header("Origin", "*")

# 🔥 Parâmetros obrigatórios
ctx.add_parameter("input_TransactionReference", "TESTE123")
ctx.add_parameter("input_CustomerMSISDN", TELEFONE)
ctx.add_parameter("input_Amount", VALOR)
ctx.add_parameter("input_ThirdPartyReference", "TP12345")
ctx.add_parameter("input_ServiceProviderCode", SERVICE_PROVIDER)

req = APIRequest(ctx)
result = req.execute()

print("STATUS:", result.status_code)
print("BODY:", result.body)
