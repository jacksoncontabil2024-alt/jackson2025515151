# 🪟 Guia Completo de Instalação - Windows

Este guia explica, passo a passo e em linguagem simples, como instalar e
usar o sistema **Cupim na Telha** no Windows. Não é preciso saber nada de
programação — basta seguir as instruções na ordem.

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Primeira instalação](#2-primeira-instalação)
3. [Uso do dia a dia (iniciar)](#3-uso-do-dia-a-dia-iniciar)
4. [Como parar o sistema](#4-como-parar-o-sistema)
5. [Como verificar o status](#5-como-verificar-o-status)
6. [Inicialização automática com o Windows](#6-inicialização-automática-com-o-windows)
7. [Como o segundo notebook acessa o sistema](#7-como-o-segundo-notebook-acessa-o-sistema)
8. [Descobrir o IP do servidor](#8-descobrir-o-ip-do-servidor)
9. [Configurar um IP fixo](#9-configurar-um-ip-fixo)
10. [O que fazer se o servidor desligar](#10-o-que-fazer-se-o-servidor-desligar)
11. [Solução de problemas](#11-solução-de-problemas)
12. [Como atualizar o sistema](#12-como-atualizar-o-sistema)

---

## 1. Pré-requisitos

Antes de instalar o sistema, você precisa ter:

- **Windows 10 ou 11**.
- **Docker Desktop** instalado (é o programa que faz o sistema funcionar).
  É gratuito para uso deste tipo.

### Como instalar o Docker Desktop

1. Acesse: https://www.docker.com/products/docker-desktop
2. Clique em **"Download for Windows"**.
3. Execute o arquivo baixado e siga as instruções na tela.
4. Se aparecer uma tela pedindo para **habilitar o WSL2**, aceite
   (é um componente do Windows necessário para o Docker funcionar).
   - Se o Windows disser que o WSL2 não está habilitado, você pode
     habilitar manualmente abrindo o **Prompt de Comando como
     Administrador** e digitando:
     ```
     wsl --install
     ```
   - Depois disso, **reinicie o computador**.
5. Após a instalação, **reinicie o computador**.
6. Abra o **Docker Desktop** pelo Menu Iniciar e aguarde até aparecer o
   ícone da "baleia" 🐳 na bandeja do Windows (perto do relógio),
   indicando que está pronto para uso.

> 💡 O Docker Desktop precisa estar **aberto e rodando** sempre que você
> quiser usar o sistema Cupim na Telha.

---

## 2. Primeira instalação

Esta etapa você faz **uma única vez**, no computador que vai funcionar
como servidor (o "Notebook A").

1. Coloque a pasta do sistema **Cupim na Telha** em um lugar fácil de
   encontrar, por exemplo `C:\Cupim`.
2. Confirme que o **Docker Desktop está aberto**.
3. Dentro da pasta do sistema, dê **duplo clique** em
   `configurar-servidor.bat`.
4. Uma janela preta (terminal) vai aparecer e mostrar o progresso:
   - Verifica se o Docker está instalado e rodando.
   - Cria a pasta `backups` (onde ficam as cópias de segurança).
   - Constrói e inicia o sistema (pode levar alguns minutos na primeira
     vez, porque baixa alguns componentes da internet).
   - Mostra o **endereço IP** deste computador na rede local — anote
     esse endereço, você vai usá-lo para acessar do segundo notebook.
5. No final, o script pergunta se você quer que o sistema **inicie
   automaticamente sempre que o Windows ligar**. Digite `S` (sim) ou `N`
   (não) e pressione Enter. Veja mais detalhes na seção
   [6](#6-inicialização-automática-com-o-windows).
6. O navegador abrirá automaticamente em `http://localhost:3000`.

🎉 Pronto! O sistema está instalado e funcionando.

---

## 3. Uso do dia a dia (iniciar)

Depois da primeira instalação, para usar o sistema normalmente:

1. Abra o **Docker Desktop** e espere ficar pronto (ícone da baleia 🐳).
2. Dê **duplo clique** em `start-cupim.bat`.
3. Aguarde a mensagem **"Sistema iniciado com sucesso!"**.
4. O navegador abrirá automaticamente em `http://localhost:3000`.
5. Faça login com usuário e senha (veja no [`README.md`](README.md) as
   credenciais padrão).

> Se você configurou a inicialização automática (seção 6), não é
> necessário clicar em nada — o sistema já sobe sozinho quando o Windows
> liga.

---

## 4. Como parar o sistema

Quando terminar de usar o sistema (por exemplo, ao final do dia):

1. Dê **duplo clique** em `stop-cupim.bat`.
2. Aguarde a mensagem de confirmação **"Sistema parado com sucesso!"**.

> Os dados **não são perdidos** ao parar o sistema — eles ficam salvos e
> estarão lá na próxima vez que você iniciar.

---

## 5. Como verificar o status

Se quiser saber se o sistema está rodando, sem precisar abrir o
navegador:

1. Dê **duplo clique** em `status-cupim.bat`.
2. A janela vai mostrar:
   - Se os componentes do sistema estão em execução.
   - O endereço para acessar no próprio computador (`localhost:3000`).
   - Os endereços para acessar de outros computadores na rede.
   - Os backups mais recentes que já existem.

---

## 6. Inicialização automática com o Windows

Isso faz o sistema **iniciar sozinho** sempre que você ligar o
computador e fizer login no Windows — assim você não precisa lembrar de
clicar em `start-cupim.bat` todos os dias.

### Se você ainda não configurou

Execute novamente `configurar-servidor.bat` e responda `S` quando for
perguntado sobre a inicialização automática.

### Como funciona

O script cria uma **tarefa agendada do Windows** chamada
`CupimNaTelhaAutoStart`, que executa `start-cupim.bat` automaticamente
no logon.

### Como remover a inicialização automática (se quiser desativar depois)

1. Abra o **Prompt de Comando** (não precisa ser como administrador,
   mas ajuda).
2. Digite:
   ```
   schtasks /Delete /TN "CupimNaTelhaAutoStart" /F
   ```

---

## 7. Como o segundo notebook acessa o sistema

O segundo notebook (Notebook B) **não precisa instalar nada**. Ele só
precisa de um navegador de internet.

1. Certifique-se de que o Notebook B está conectado **na mesma rede**
   (mesmo Wi-Fi ou cabo) do Notebook A.
2. No Notebook A, descubra o endereço IP (veja a seção 8 abaixo, ou
   basta olhar a tela que aparece ao rodar `start-cupim.bat` ou
   `status-cupim.bat`).
3. No navegador do Notebook B, digite o endereço:
   ```
   http://ENDERECO-IP:3000
   ```
   Substituindo `ENDERECO-IP` pelo IP mostrado no Notebook A. Exemplo:
   ```
   http://192.168.0.10:3000
   ```
4. Faça login normalmente.

> 📘 Guia completo com mais detalhes: [`REDE-LOCAL.md`](REDE-LOCAL.md).

---

## 8. Descobrir o IP do servidor

O IP do Notebook A (servidor) é mostrado automaticamente quando você
executa `configurar-servidor.bat`, `start-cupim.bat` ou
`status-cupim.bat`.

Se quiser descobrir manualmente:

1. No Notebook A, abra o **Prompt de Comando** (digite `cmd` no menu
   Iniciar e pressione Enter).
2. Digite:
   ```
   ipconfig
   ```
3. Procure a linha **"Endereço IPv4"**, dentro da seção do adaptador de
   rede que está em uso (Wi-Fi ou Ethernet). Vai aparecer algo como:
   ```
   Endereço IPv4. . . . . . . . . . . . . : 192.168.0.10
   ```
4. Esse número (`192.168.0.10` no exemplo) é o IP que o Notebook B deve
   usar.

---

## 9. Configurar um IP fixo

Por padrão, o roteador costuma trocar o IP do computador de vez em
quando (isso se chama DHCP). Se isso acontecer, o endereço que o
Notebook B usa para acessar o sistema muda, e é preciso descobrir o novo
IP. Para evitar esse incômodo, existem duas opções:

### Opção A — Reservar o IP no roteador (mais recomendada)

1. No Notebook A, digite no Prompt de Comando: `ipconfig /all` e
   procure por **"Endereço Físico"** do adaptador em uso — isso é o
   endereço MAC da placa de rede.
2. Acesse o painel do roteador no navegador (geralmente
   `http://192.168.0.1` ou `http://192.168.1.1` — endereço e senha
   costumam estar numa etiqueta atrás do roteador).
3. Procure por uma opção chamada **"Reserva de IP"**, **"DHCP
   Reservation"** ou **"IP Estático"** (o nome varia conforme a marca do
   roteador).
4. Associe o endereço MAC do Notebook A a um IP fixo (por exemplo,
   `192.168.0.10`).
5. Reinicie o Notebook A (ou desconecte e reconecte da rede) para o novo
   IP ser aplicado.

### Opção B — IP fixo direto no Windows

1. Vá em **Configurações de Rede > Alterar opções do adaptador**.
2. Clique com o botão direito no adaptador em uso (Wi-Fi ou Ethernet) e
   escolha **Propriedades**.
3. Selecione **Protocolo IP Versão 4 (TCP/IPv4)** e clique em
   **Propriedades**.
4. Escolha **Usar o seguinte endereço IP** e informe um IP fora da faixa
   usada pelo DHCP do roteador (para não conflitar com outros
   dispositivos), a máscara de sub-rede e o gateway (IP do roteador).

> 💡 Prefira a **Opção A**: ela é mais segura e evita conflitos de
> endereço com outros aparelhos da rede.

---

## 10. O que fazer se o servidor desligar

- Enquanto o Notebook A estiver desligado, hibernando ou sem o Docker
  Desktop aberto, o sistema **fica indisponível** para o Notebook B.
- O Notebook B vai mostrar erro de conexão ao tentar acessar o endereço.
- **Não se preocupe com os dados**: eles ficam salvos com segurança e
  não se perdem.
- Quando o Notebook A ligar de novo:
  - Se a inicialização automática estiver configurada (seção 6), o
    sistema volta a funcionar sozinho.
  - Caso contrário, basta abrir o Docker Desktop e executar
    `start-cupim.bat` novamente.

---

## 11. Solução de problemas

### "Docker não encontrado"

- Confirme que o Docker Desktop está instalado.
- Confirme que o Docker Desktop está aberto (ícone da baleia 🐳 na
  bandeja do Windows).
- Reinicie o computador e tente novamente.

### Docker Desktop não inicia

- Verifique se a **virtualização** está habilitada na BIOS/UEFI do
  computador (em geral já vem habilitada de fábrica).
- Verifique se o **WSL2** está instalado e atualizado.
- Reinicie o computador e tente `start-cupim.bat` novamente.

### "Porta 3000 (ou 8001) já está em uso"

- Feche outros programas que possam estar usando essas portas.
- Execute `stop-cupim.bat` e depois `start-cupim.bat` novamente.

### O sistema abre no Notebook A, mas não no Notebook B

Isso geralmente é um problema de rede ou firewall:

1. **Confirme que os dois notebooks estão na mesma rede.** Redes de
   Wi-Fi diferentes (por exemplo, "rede de convidados") não se
   comunicam entre si.
2. **Confirme que o sistema está rodando** no Notebook A, usando
   `status-cupim.bat`.
3. **Confira se o IP está correto** — ele pode ter mudado, se você não
   configurou um IP fixo (veja seção 9).
4. **O Firewall do Windows pode estar bloqueando o acesso.** Veja como
   liberar abaixo.

#### Liberando as portas no Firewall do Windows (no Notebook A)

**Pelo menu (mais fácil):**

1. Abra **"Firewall do Windows Defender com Segurança Avançada"** (basta
   digitar no menu Iniciar).
2. Clique em **Regras de Entrada > Nova Regra**.
3. Tipo de regra: **Porta**.
4. Protocolo: **TCP**, portas específicas: `3000,8001`.
5. Ação: **Permitir a conexão**.
6. Dê um nome, por exemplo "Cupim na Telha", e finalize.

**Pelo Prompt de Comando (como Administrador):**

```
netsh advfirewall firewall add rule name="Cupim na Telha - Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Cupim na Telha - Backend" dir=in action=allow protocol=TCP localport=8001
```

Para remover essas regras depois, se precisar:

```
netsh advfirewall firewall delete rule name="Cupim na Telha - Frontend"
netsh advfirewall firewall delete rule name="Cupim na Telha - Backend"
```

### Sistema não inicia mesmo com o Docker rodando

1. Feche a janela e execute `stop-cupim.bat`.
2. Em seguida, execute `start-cupim.bat` novamente.
3. Se persistir, execute `configurar-servidor.bat` de novo — ele
   reconstrói o sistema do zero.

---

## 12. Como atualizar o sistema

Quando houver uma nova versão do sistema (por exemplo, arquivos
atualizados):

1. Execute `stop-cupim.bat` para parar o sistema atual.
2. Substitua os arquivos do sistema pela nova versão (mantendo a pasta
   `backups` intacta, para não perder as cópias de segurança).
3. Execute novamente `configurar-servidor.bat` (ele reconstrói o
   sistema com a nova versão).

> ⚠️ Antes de atualizar, é sempre uma boa ideia fazer um backup manual
> pelo próprio sistema. Veja como em
> [`BACKUP-RESTAURACAO.md`](BACKUP-RESTAURACAO.md).

---

## 📚 Veja também

- [`README.md`](README.md) — visão geral do sistema.
- [`REDE-LOCAL.md`](REDE-LOCAL.md) — detalhes sobre o uso com 2 notebooks.
- [`BACKUP-RESTAURACAO.md`](BACKUP-RESTAURACAO.md) — backup e restauração.
- [`MIGRACAO.md`](MIGRACAO.md) — migração de dados de outro sistema.
