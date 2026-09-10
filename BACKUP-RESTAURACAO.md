# 💾 Backup e Restauração - Guia Completo

Este guia explica, de forma simples, como funciona o backup (cópia de
segurança) dos dados do sistema **Cupim na Telha**, como fazer backups
manuais, onde eles ficam guardados e como restaurá-los se precisar.

---

## 📋 Índice

1. [Como funciona o backup automático](#1-como-funciona-o-backup-automático)
2. [Como fazer um backup manual](#2-como-fazer-um-backup-manual)
3. [Onde ficam os backups](#3-onde-ficam-os-backups)
4. [Como restaurar um backup](#4-como-restaurar-um-backup)
5. [Como copiar backups para pendrive/HD externo](#5-como-copiar-backups-para-pendrivehd-externo)
6. [Como mover o sistema para outro computador](#6-como-mover-o-sistema-para-outro-computador)
7. [Procedimento de emergência](#7-procedimento-de-emergência-se-o-computador-principal-quebrar)

---

## 1. Como funciona o backup automático

O sistema faz uma cópia de segurança de **todos os dados** (entregas,
caixa, entregadores, pagamentos de funcionários) automaticamente, **todos
os dias, às 23h**, sem que você precise fazer nada.

- Cada backup automático gera um arquivo `.zip` com um nome parecido com:
  ```
  backup_2026-09-10_23-00-00.zip
  ```
- O sistema mantém os **últimos 30 dias** de backups automáticos. Ao
  criar um novo, se já existirem mais de 30, o mais antigo é apagado
  automaticamente — assim a pasta de backups não cresce sem limite.
- Isso funciona mesmo se você nunca abrir a aba de Backup: o backup
  automático roda em segundo plano, todo santo dia, enquanto o sistema
  estiver ligado (Docker Desktop aberto e sistema iniciado) no horário
  configurado.

> 💡 O horário (23h) é o padrão do sistema. Se o computador estiver
> desligado nesse horário, o backup daquele dia simplesmente não é
> gerado — ele não "atrasa" para outro horário. Por isso, é recomendável
> deixar o Notebook A (servidor) ligado, ou usar a inicialização
> automática (veja [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md)).

### Como ver quando será o próximo backup automático

Na aba **"Backup"** do sistema, ou executando `status-cupim.bat`, você
pode ver informações sobre os backups existentes. Dentro do sistema, a
aba Backup mostra a lista de backups já feitos e o horário do próximo
backup automático agendado.

---

## 2. Como fazer um backup manual

Além do backup automático diário, você pode gerar um backup **na hora**,
sempre que quiser (por exemplo, antes de fazer alguma alteração
importante, ou antes de atualizar o sistema).

1. Abra o sistema no navegador e faça login.
2. Vá até a aba **"Backup"**.
3. Clique no botão de **gerar backup** (backup por data, ou backup
   completo com todos os dados históricos).
4. O arquivo `.zip` será baixado pelo navegador e/ou salvo na pasta de
   backups do sistema, dependendo da opção escolhida.

> 💡 Recomendação: faça um backup manual sempre antes de "Limpar Tudo",
> atualizar o sistema, ou fazer qualquer alteração maior — mesmo que o
> sistema já proteja automaticamente antes de limpar os dados.

---

## 3. Onde ficam os backups

Todos os backups (automáticos e os manuais salvos pelo sistema) ficam
guardados na pasta:

```
backups\
```

Essa pasta está **na raiz do projeto**, ou seja, dentro da mesma pasta
onde estão os arquivos `start-cupim.bat`, `stop-cupim.bat`, etc.

Exemplo de caminho completo, se o sistema estiver instalado em
`C:\Cupim`:

```
C:\Cupim\backups\
```

Dentro dela, você vai encontrar arquivos `.zip` com nomes como:

```
backup_2026-09-08_23-00-00.zip
backup_2026-09-09_23-00-00.zip
backup_2026-09-10_23-00-00.zip
```

Cada um desses arquivos ZIP contém uma planilha Excel com os dados e,
dependendo do tipo de backup, também PDFs de resumo.

> Você pode abrir essa pasta normalmente pelo **Explorador de Arquivos**
> do Windows, como qualquer outra pasta do computador.

---

## 4. Como restaurar um backup

Se você precisar voltar os dados do sistema para um momento anterior
(por exemplo, um erro foi cometido e você quer desfazer, ou está
migrando dados), siga estes passos:

1. Certifique-se de que o arquivo de backup (`.zip`) que você quer
   restaurar está dentro da pasta `backups` (veja seção 3).
2. Abra o sistema no navegador e faça login.
3. Vá até a aba **"Backup"**.
4. Na lista de backups disponíveis, encontre o arquivo desejado (pelos
   nomes, que incluem data e hora).
5. Clique no botão **"Restaurar"** ao lado desse backup.
6. Aguarde a confirmação de que a restauração foi concluída.

> ⚠️ **Atenção — isso substitui os dados atuais!** Restaurar um backup
> **troca** os dados atuais do sistema (entregas, caixa, entregadores,
> pagamentos de funcionários) pelos dados daquele backup. Se quiser
> manter os dados atuais também, **faça um novo backup antes de
> restaurar** (assim você não perde nada).

---

## 5. Como copiar backups para pendrive/HD externo

É uma boa prática guardar uma cópia dos backups **fora do computador**
também — assim, mesmo que o computador tenha um problema (roubo, defeito,
vírus), você não perde os dados.

1. Conecte o pendrive ou HD externo ao computador (Notebook A).
2. Abra o **Explorador de Arquivos** do Windows.
3. Vá até a pasta do sistema e entre na pasta `backups`.
4. Selecione os arquivos `.zip` que deseja copiar (ou selecione todos
   com `Ctrl+A`).
5. Copie (`Ctrl+C`) e cole (`Ctrl+V`) dentro do pendrive/HD externo.

> 💡 Dica: faça isso periodicamente (por exemplo, uma vez por semana ou
> por mês), guardando os backups mais recentes em um local físico
> diferente do computador principal.

---

## 6. Como mover o sistema para outro computador

Se for necessário trocar o computador que funciona como servidor (por
exemplo, o Notebook A quebrou ou foi substituído), siga este
procedimento:

### No computador novo

1. **Instale o Docker Desktop** (veja o passo a passo em
   [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md), seção 1).
2. **Copie a pasta inteira do projeto** do sistema Cupim na Telha
   (a pasta que contém `docker-compose.yml`, `start-cupim.bat`, etc) para
   o computador novo — pode ser via pendrive, HD externo, ou rede.
3. **Copie também a pasta `backups`** (se não estiver junto com o
   restante da pasta do projeto) — ela contém o histórico de backups
   automáticos.
4. Dentro da pasta copiada, execute `configurar-servidor.bat` (primeira
   vez no computador novo).
5. Restaure o backup mais recente seguindo os passos da seção 4 acima,
   para trazer os dados de volta.
6. Confirme que tudo está funcionando (veja o checklist de validação em
   [`MIGRACAO.md`](MIGRACAO.md), seção 4).

### Resumindo em um passo a passo curto

```
1. Instalar Docker Desktop no computador novo
2. Copiar a pasta do projeto + pasta backups
3. Executar configurar-servidor.bat (ou docker-compose up -d)
4. Restaurar o backup mais recente pela aba Backup
5. Validar os dados
```

---

## 7. Procedimento de emergência (se o computador principal quebrar)

Se o Notebook A (servidor) parar de funcionar de repente (quebrou,
não liga mais, foi perdido), siga esta ordem:

1. **Não entre em pânico com os dados** — se você seguiu as
   recomendações deste guia (backups automáticos diários + cópias em
   pendrive/HD externo), os dados dos últimos dias estão seguros em
   outro lugar.
2. Localize a **cópia mais recente da pasta `backups`** que você tenha
   guardado fora do computador quebrado (pendrive, HD externo, outro
   computador).
   - Se você **não tem** uma cópia fora do computador quebrado e o
     computador realmente não liga mais, pode ser necessário ajuda
     técnica especializada para tentar recuperar o disco antes de
     qualquer outra coisa. Por isso a seção 5 (copiar para pendrive/HD)
     é tão importante.
3. Prepare um computador substituto (pode ser o Notebook B, temporário,
   ou outro disponível):
   - Instale o Docker Desktop.
   - Copie a pasta do sistema Cupim na Telha (se não tiver, será preciso
     obter uma cópia do código-fonte/projeto novamente).
   - Copie a pasta `backups` que você recuperou.
4. Execute `configurar-servidor.bat` no computador substituto.
5. Restaure o backup mais recente disponível (seção 4).
6. Valide os dados (compare com o que você lembra do último dia de
   funcionamento normal).
7. A partir de agora, esse computador substituto passa a ser o novo
   "Notebook A" — atualize o IP usado pelo Notebook B, se necessário
   (veja [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md), seção 8).

> 💾 **A melhor prevenção contra esse tipo de emergência é simples:**
> copie a pasta `backups` para um pendrive ou HD externo regularmente
> (seção 5). Isso garante que, mesmo em uma emergência total, você perde
> no máximo os dados de um único dia (o de hoje, ainda sem backup).

---

## 📚 Veja também

- [`README.md`](README.md) — visão geral do sistema.
- [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md) — instalação e uso
  diário.
- [`MIGRACAO.md`](MIGRACAO.md) — migração de dados de outro sistema
  (Emergent) para este sistema local.
