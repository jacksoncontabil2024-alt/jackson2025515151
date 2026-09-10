# Rede Local - Cupim na Telha (2 notebooks)

Este guia explica como usar o sistema **Cupim na Telha** com dois notebooks
na mesma rede local:

- **Notebook A (servidor)**: roda o Docker com os containers do sistema
  (frontend, backend e banco de dados).
- **Notebook B (cliente)**: apenas abre o navegador e acessa o sistema pelo
  endereco IP do Notebook A.

---

## 1. Como descobrir o IP do servidor (Notebook A)

O IP do Notebook A e mostrado automaticamente ao executar:

- `configurar-servidor.bat` (primeira instalacao), ou
- `start-cupim.bat` (uso do dia a dia), ou
- `status-cupim.bat` (ver status sem iniciar nada)

Se quiser descobrir manualmente, abra o Prompt de Comando (cmd) no
Notebook A e digite:

```
ipconfig
```

Procure a linha **"Endereco IPv4"** dentro da secao do adaptador de rede que
esta conectado (Wi-Fi ou Ethernet). Sera algo como:

```
Endereco IPv4. . . . . . . . . . . . . : 192.168.0.10
```

Esse e o IP que o Notebook B deve usar para acessar o sistema.

---

## 2. Como fixar o IP do servidor (IP fixo ou reserva DHCP)

Por padrao, o roteador costuma atribuir o IP automaticamente (DHCP), e esse
IP pode mudar quando o notebook reinicia ou reconecta na rede. Para evitar
que o endereco mude, existem duas opcoes:

### Opcao A - Reserva de IP no roteador (recomendado)

1. Descubra o endereco MAC da placa de rede do Notebook A:
   - No cmd, digite `ipconfig /all` e procure por **"Endereco Fisico"** do
     adaptador em uso (Wi-Fi ou Ethernet).
2. Acesse o painel de administracao do roteador (geralmente
   `http://192.168.0.1` ou `http://192.168.1.1` - endereco e senha costumam
   estar na etiqueta do roteador).
3. Procure por uma secao chamada **"Reserva de IP"**, **"DHCP Reservation"**
   ou **"Endereco IP Estatico"** (o nome varia conforme o fabricante).
4. Associe o endereco MAC do Notebook A a um IP fixo dentro da faixa da
   rede (ex: `192.168.0.10`).
5. Reinicie o Notebook A (ou reconecte a rede) para que o IP reservado seja
   aplicado.

### Opcao B - IP fixo direto no Windows

1. Vá em **Configuracoes de Rede > Alterar opcoes do adaptador**.
2. Clique com o botao direito no adaptador em uso > **Propriedades**.
3. Selecione **Protocolo IP Versao 4 (TCP/IPv4)** > **Propriedades**.
4. Escolha **Usar o seguinte endereco IP** e informe um IP fora da faixa
   do DHCP do roteador (para nao conflitar com outros dispositivos), a
   mascara de sub-rede e o gateway padrao (IP do roteador).

> Recomendacao: prefira a **Opcao A** (reserva no roteador), pois evita
> conflitos de IP com outros dispositivos da rede.

---

## 3. Como o Notebook B acessa o sistema

Com o Notebook A rodando o sistema (`start-cupim.bat` ja executado) e o
IP do servidor em mãos:

1. Conecte o Notebook B na **mesma rede local** (mesmo Wi-Fi ou cabo/switch
   do Notebook A).
2. Abra o navegador no Notebook B.
3. Acesse: `http://ENDERECO-IP:3000`, substituindo `ENDERECO-IP` pelo IP do
   Notebook A. Exemplo:

```
http://192.168.0.10:3000
```

4. Faca login normalmente. Nao e necessario instalar nada no Notebook B.

---

## 4. O que acontece se o servidor (Notebook A) desligar

- O sistema **fica indisponivel** para o Notebook B enquanto o Notebook A
  estiver desligado, hibernando ou sem o Docker Desktop em execucao.
- O Notebook B mostrara erro de conexao (pagina nao encontrada / falha ao
  conectar) ao tentar acessar `http://ENDERECO-IP:3000`.
- Os dados **nao se perdem**: ficam salvos no banco de dados (volume Docker)
  e nos backups da pasta `backups`, dentro do Notebook A.
- Quando o Notebook A for religado, execute `start-cupim.bat` (ou configure
  a inicializacao automatica pelo `configurar-servidor.bat`) para o sistema
  voltar a ficar disponivel na rede.

---

## 5. Solucao de problemas

### O Notebook B nao consegue acessar o endereco IP

1. **Confirme que ambos os notebooks estao na mesma rede.** Redes Wi-Fi
   diferentes (ex: rede de convidados) nao se comunicam entre si.
2. **Confirme que o sistema esta rodando** no Notebook A com
   `status-cupim.bat`.
3. **Teste o IP correto**: rode `ipconfig` novamente no Notebook A, o IP
   pode ter mudado se nao foi fixado (veja secao 2).
4. **Firewall do Windows pode estar bloqueando** as portas 3000/8001. Veja
   abaixo como liberar.

### Liberando as portas no Firewall do Windows

Se o acesso do Notebook B falhar mesmo com o IP correto, libere as portas
3000 (frontend) e 8001 (backend) no Firewall do Windows **no Notebook A**.

**Via interface grafica:**
1. Abra **Firewall do Windows Defender com Seguranca Avancada**.
2. Clique em **Regras de Entrada > Nova Regra**.
3. Tipo de regra: **Porta**.
4. Protocolo: **TCP**, portas especificas: `3000,8001`.
5. Acao: **Permitir a conexao**.
6. Aplique para todos os perfis (ou pelo menos o perfil da rede local usada)
   e de um nome, por exemplo "Cupim na Telha".

**Via linha de comando (executar como Administrador):**

```
netsh advfirewall firewall add rule name="Cupim na Telha - Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Cupim na Telha - Backend" dir=in action=allow protocol=TCP localport=8001
```

Para remover as regras depois, se necessario:

```
netsh advfirewall firewall delete rule name="Cupim na Telha - Frontend"
netsh advfirewall firewall delete rule name="Cupim na Telha - Backend"
```

### Docker Desktop nao inicia

- Verifique se a virtualizacao esta habilitada na BIOS/UEFI do Notebook A.
- Verifique se o WSL2 esta instalado e atualizado (Docker Desktop no
  Windows normalmente depende dele).
- Reinicie o Notebook A e tente `start-cupim.bat` novamente.

### O sistema abre no Notebook A mas nao no Notebook B

- Isso geralmente indica bloqueio de firewall ou rede diferente (veja os
  itens acima). O acesso local (`localhost:3000`) sempre funciona no
  proprio Notebook A independente de firewall/rede, pois nao passa pela
  rede externa.

---

## 6. Resumo rapido

| Onde | O que fazer |
|---|---|
| Notebook A (primeira vez) | Executar `configurar-servidor.bat` |
| Notebook A (uso diario) | Executar `start-cupim.bat` |
| Notebook A (ver status) | Executar `status-cupim.bat` |
| Notebook A (parar sistema) | Executar `stop-cupim.bat` |
| Notebook B | Acessar `http://IP-DO-NOTEBOOK-A:3000` no navegador |
