# 🍖 Cupim na Telha - Sistema de Gestão de Entregas

Sistema completo para gerenciar as entregas, o caixa, o estoque e os
entregadores do **Cupim na Telha**. Roda direto no computador da loja,
**sem precisar de internet** para funcionar no dia a dia, e pode ser
usado ao mesmo tempo por dois notebooks na mesma rede.

---

## 🧭 O que é este sistema?

É um programa que ajuda a organizar o dia a dia do negócio:

- Registrar **entregas** (cliente, valor, forma de pagamento, entregador).
- Controlar o **caixa** (entradas e saídas de dinheiro).
- Controlar o **estoque** de produtos.
- Controlar os **entregadores** e o que cada um entregou.
- Registrar **pagamentos de funcionários**.
- Gerar **relatórios** e conferir tudo por forma de pagamento (PIX, cartão,
  dinheiro, etc).
- Fazer **backup automático** dos dados todos os dias, para nunca perder
  informação.

Tudo isso acontece dentro do próprio computador da loja — os dados não
ficam guardados na internet, ficam guardados ali, com você.

---

## 🖥️ Como o sistema é organizado (resumo simples)

Pense assim:

- **Um computador é o "servidor"** (vamos chamar de **Notebook A**): é
  nele que o sistema realmente roda e onde os dados são guardados.
- **Um segundo computador pode ser o "cliente"** (**Notebook B**): ele
  só precisa de um navegador de internet (Chrome, Edge, etc) para acessar
  o sistema que está rodando no Notebook A, pela rede local (Wi-Fi/cabo).

```
Notebook A (servidor)              Notebook B (cliente)
   roda o sistema        <----->     só abre o navegador
   guarda os dados                   (não precisa instalar nada)
```

Os dois notebooks precisam estar **na mesma rede** (mesmo Wi-Fi, por
exemplo). Assim, o que é feito em um aparece automaticamente no outro,
em tempo real.

> 📘 Guia detalhado sobre os 2 notebooks: veja [`REDE-LOCAL.md`](REDE-LOCAL.md).

---

## ✅ O que você precisa ter

- Um computador com **Windows 10 ou 11**.
- O programa **Docker Desktop** instalado (é gratuito — o guia de
  instalação explica passo a passo).
- Os dois notebooks (se for usar em dois) conectados **na mesma rede**
  (mesmo Wi-Fi ou mesmo cabo de rede).

---

## 🚀 Como começar rapidinho

1. Confirme que o **Docker Desktop** está aberto e rodando.
2. Dê **duplo clique** no arquivo `start-cupim.bat`.
3. Aguarde a mensagem de que o sistema iniciou.
4. O navegador abrirá automaticamente em `http://localhost:3000`.

Para instruções completas (primeira instalação, uso diário, como parar,
como configurar o segundo notebook), veja o guia:
[`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md).

---

## 🔑 Login e senha padrão

- **Usuário:** `admin`
- **Senha:** `admin123`

> ⚠️ **Importante:** troque essa senha assim que possível, na primeira
> vez que usar o sistema. Depois de fazer login, procure a opção de
> **alterar senha** dentro do sistema.

---

## 📦 Funcionalidades do sistema

| Área | O que dá para fazer |
|---|---|
| 🚚 **Entregas** | Cadastrar entregas, escolher forma de pagamento, atribuir entregador, acompanhar status (pendente, em entrega, entregue) |
| 💰 **Caixa** | Registrar entradas e saídas de dinheiro, ver o saldo em tempo real |
| 📊 **Relatórios** | Ver totais por forma de pagamento, marcar entregas já conferidas |
| 📦 **Estoque** | Cadastrar produtos, controlar quantidade e alertas de estoque baixo |
| 🏍️ **Entregadores** | Cadastrar entregadores e acompanhar as entregas de cada um |
| 👥 **Funcionários** | Registrar pagamentos feitos aos funcionários |
| 💾 **Backup** | Backup automático todo dia, backup manual quando quiser, restaurar backups antigos |

Todas as telas atualizam **em tempo real**: se alguém no Notebook B faz
uma entrega, o Notebook A vê a atualização na hora (e vice-versa).

---

## 📚 Outros documentos deste projeto

| Documento | Para que serve |
|---|---|
| [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md) | Passo a passo completo de instalação, uso diário e solução de problemas |
| [`REDE-LOCAL.md`](REDE-LOCAL.md) | Como usar o sistema com 2 notebooks na mesma rede |
| [`BACKUP-RESTAURACAO.md`](BACKUP-RESTAURACAO.md) | Como funciona o backup automático, backup manual e como restaurar |
| [`MIGRACAO.md`](MIGRACAO.md) | Como migrar os dados de um sistema anterior (Emergent) para este sistema local |

---

## ❓ Precisa de ajuda?

- Sistema não abre? Veja a seção de solução de problemas em
  [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md).
- Perdeu algum dado? Veja como restaurar um backup em
  [`BACKUP-RESTAURACAO.md`](BACKUP-RESTAURACAO.md).

O sistema funciona **100% offline** no dia a dia. A internet só é usada
na primeira instalação, para baixar os componentes necessários.
