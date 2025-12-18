# 🪟 Guia de Instalação - Windows

## Passo 1️⃣: Instalar Docker Desktop

1. **Baixe o Docker Desktop**
   - Acesse: https://www.docker.com/products/docker-desktop
   - Clique em "Download for Windows"

2. **Instale o Docker Desktop**
   - Execute o instalador baixado
   - Siga as instruções na tela
   - Aceite instalar o WSL 2 se solicitado
   - **Reinicie o computador** após a instalação

3. **Inicie o Docker Desktop**
   - Procure por "Docker Desktop" no menu Iniciar
   - Abra o programa
   - Aguarde até ver "Docker Desktop is running" (ícone verde na bandeja)

## Passo 2️⃣: Descompactar o Sistema

1. **Localize o arquivo ZIP** do Cupim na Telha
2. **Clique com botão direito** no arquivo
3. Selecione **"Extrair tudo..."**
4. Escolha uma pasta fácil de lembrar (ex: `C:\Cupim`)
5. Clique em **"Extrair"**

## Passo 3️⃣: Iniciar o Sistema

1. **Abra a pasta** onde extraiu o sistema
2. **Duplo clique** no arquivo `start-cupim.bat`
3. Uma janela preta (terminal) irá aparecer
4. Aguarde a mensagem: "Sistema iniciado com sucesso!"
5. O navegador abrirá automaticamente em `http://localhost:3000`

**Na primeira vez**, o download das imagens Docker pode demorar 5-10 minutos.

## Passo 4️⃣: Usar o Sistema

🎉 **Pronto!** O sistema está rodando.

- Cadastre entregadores na aba "Entregadores"
- Cadastre entregas na aba "Entregas"
- Acompanhe o caixa, relatórios e muito mais!

## ⏹️ Parar o Sistema

1. Vá até a pasta do sistema
2. Duplo clique em `stop-cupim.bat`
3. Aguarde a mensagem de confirmação

## 🔄 Usar Novamente

Sempre que quiser usar o sistema:
1. Certifique-se que o **Docker Desktop está rodando**
2. Execute `start-cupim.bat`

## ❓ Problemas Comuns

### "Docker não encontrado"
- ✅ Certifique-se que o Docker Desktop está instalado
- ✅ Verifique se o Docker Desktop está rodando (ícone na bandeja)
- ✅ Reinicie o computador

### "Porta 3000 já está em uso"
- ✅ Feche outros programas que possam estar usando a porta
- ✅ Execute `stop-cupim.bat` e depois `start-cupim.bat` novamente

### Sistema não abre no navegador
- ✅ Abra manualmente: http://localhost:3000
- ✅ Aguarde 1-2 minutos após executar o start-cupim.bat

## 💡 Dicas

- ✅ Sempre inicie o Docker Desktop ANTES de executar start-cupim.bat
- ✅ Não feche a janela preta que aparece ao iniciar
- ✅ Use stop-cupim.bat ANTES de desligar o computador
- ✅ O sistema funciona 100% offline - não precisa de internet!

## 📞 Suporte

Todos os dados ficam salvos localmente no seu computador.
O sistema é completamente offline e seguro.

**Aproveite! 🚀**
