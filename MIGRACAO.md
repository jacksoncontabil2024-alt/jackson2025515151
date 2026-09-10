# 🔄 Migração de Dados - Da Emergent para o Sistema Local

Este guia explica como levar os dados do sistema que estava hospedado
na internet (Emergent) para o sistema local que agora roda no seu
computador. É importante seguir esses passos **antes de cancelar** a
conta na Emergent, para garantir que nenhum dado seja perdido.

---

## ⚠️ Antes de tudo: o que exportar antes de cancelar a Emergent

**Não cancele a Emergent antes de completar todos os passos abaixo.**
Enquanto o sistema antigo ainda estiver no ar, você tem a chance de
copiar tudo com segurança. Depois de cancelar, pode não ser mais
possível recuperar os dados.

Checklist rápido do que precisa ser feito **antes** do cancelamento:

- [ ] Fazer o backup completo pelo sistema (Excel com todos os dados).
- [ ] (Opcional, mais completo) Fazer o `mongodump` do banco de dados.
- [ ] Copiar o(s) arquivo(s) de backup para o computador local (não deixe
      apenas na nuvem da Emergent).
- [ ] Confirmar que os arquivos abrem e têm os dados esperados.
- [ ] Restaurar os dados no sistema local (Notebook A).
- [ ] Confirmar que todos os dados aparecem corretamente no sistema local.
- [ ] Só então, cancelar a conta na Emergent.

---

## 1. Como fazer o backup completo pelo sistema (jeito mais simples)

Este é o método recomendado para a maioria dos casos — gera um arquivo
com todos os dados (entregas, caixa, entregadores, funcionários) em
formato Excel, fácil de conferir.

### Pelo navegador, usando o sistema ainda hospedado na Emergent

1. Acesse o sistema antigo (o endereço que você já usa hoje, hospedado
   na Emergent).
2. Faça login normalmente.
3. Vá até a aba **"Backup"**.
4. Clique no botão de **gerar backup completo**.
5. Um arquivo ZIP será baixado para o seu computador (geralmente na
   pasta "Downloads").
6. **Guarde esse arquivo ZIP em um lugar seguro** — ele contém todos os
   dados: entregas, caixa, entregadores e pagamentos de funcionários.

### Alternativa: chamando diretamente o endereço técnico

Se preferir (ou se o botão não estiver disponível), é possível baixar o
mesmo backup completo acessando diretamente este endereço no navegador,
com o sistema antigo já aberto e logado:

```
POST /api/backup/full
```

> Essa é uma chamada técnica (usada internamente pelo botão da aba
> Backup). Se você não tiver familiaridade, use o botão da aba Backup —
> o resultado final é o mesmo arquivo ZIP.

---

## 2. Como fazer um backup mais completo (opção avançada: mongodump)

Essa opção é recomendada quando se quer preservar **100% da estrutura
interna** dos dados (incluindo identificadores internos e relações entre
registros), e não apenas os valores em uma planilha. Ela exige acesso
técnico (terminal) ao ambiente onde o sistema estava hospedado.

1. Acesse o ambiente da Emergent com acesso a terminal/linha de comando.
2. Execute o comando:
   ```
   mongodump --uri="<endereço-do-banco-mongodb>" --out=/caminho/para/dump
   ```
   (o endereço exato do banco depende da configuração da hospedagem —
   se você não tiver essa informação, use o método do item 1 acima, que
   não exige acesso técnico).
3. Copie a pasta gerada pelo `mongodump` para o computador local (por
   exemplo, um pendrive ou pasta compartilhada).

> 💡 Se você não tem experiência com terminal/linha de comando, prefira
> sempre o **método 1** (backup completo pelo sistema). Ele é suficiente
> para a grande maioria dos casos e não exige conhecimento técnico.

---

## 3. Como restaurar os dados no sistema local

Depois de ter o arquivo de backup (ZIP) em mãos, siga um dos métodos
abaixo para trazer os dados para o sistema local (que já deve estar
instalado — veja [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md)).

### Método recomendado: restaurar pelo próprio sistema

1. Coloque o arquivo ZIP do backup dentro da pasta `backups`, na raiz do
   projeto do sistema local (a mesma pasta onde está o `start-cupim.bat`).
2. Com o sistema local rodando (`start-cupim.bat` já executado), acesse
   o sistema no navegador (`http://localhost:3000`) e faça login.
3. Vá até a aba **"Backup"**.
4. Localize o arquivo na lista de backups disponíveis.
5. Clique em **"Restaurar"** neste arquivo.

> ⚠️ **Atenção:** restaurar um backup **substitui** os dados atuais do
> sistema local (entregas, caixa, entregadores, pagamentos de
> funcionários) pelos dados contidos no arquivo restaurado. Se já
> existirem dados no sistema local que você queira manter, faça um
> backup deles antes de restaurar.

Tecnicamente, esse botão chama o endereço:

```
POST /api/backups/restore/{nome-do-arquivo}
```

Mas não é necessário usar esse endereço diretamente — o botão da aba
Backup faz isso por você.

### Método avançado: mongorestore (se você usou mongodump)

Se você optou pelo backup avançado (`mongodump`) no passo 2, restaure
assim:

1. Copie a pasta do dump para dentro do Notebook A (o servidor local).
2. Com os containers do sistema rodando (`start-cupim.bat` já
   executado), abra o Prompt de Comando na pasta do projeto e execute:
   ```
   docker-compose exec mongodb mongorestore --drop /caminho/para/dump
   ```
   (o `--drop` substitui as coleções existentes pelos dados do dump —
   remova essa opção se quiser apenas adicionar, sem substituir).

---

## 4. Como validar que todos os dados foram migrados

Depois de restaurar, confira com calma se tudo está correto:

- [ ] Abra a aba **"Entregas"** e confira se o número de entregas
      parece correto (compare com o que você tinha no sistema antigo).
- [ ] Abra a aba **"Caixa"** e confira o saldo — ele deve bater com o
      saldo do sistema antigo no momento do backup.
- [ ] Abra a aba **"Entregadores"** e confira se todos os entregadores
      cadastrados aparecem.
- [ ] Abra a aba **"Funcionários"** e confira os pagamentos registrados.
- [ ] Abra a aba **"Estoque"** e confira os produtos cadastrados.
- [ ] Gere um relatório (aba **"Relatórios"**) e compare os totais por
      forma de pagamento com o que você lembra/tinha registrado antes.
- [ ] Peça para outra pessoa da equipe conferir também, se possível —
      duas pessoas checando reduzem a chance de erro passar despercebido.

Se algo parecer estranho ou faltando, **não cancele a Emergent ainda**.
Refaça a restauração ou revise o arquivo de backup usado.

---

## 5. Checklist final antes de cancelar a Emergent

Só cancele a conta/assinatura da Emergent depois de confirmar **todos**
os itens abaixo:

- [ ] O sistema local (`Notebook A`) está instalado e funcionando
      (veja [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md)).
- [ ] O backup completo dos dados antigos foi feito e guardado em local
      seguro (fora da Emergent).
- [ ] Os dados foram restaurados no sistema local.
- [ ] Todos os itens da seção 4 (validação) foram conferidos e estão
      corretos.
- [ ] O sistema local foi testado por pelo menos alguns dias no dia a
      dia, sem problemas.
- [ ] Uma cópia do arquivo de backup usado na migração está guardada em
      um pendrive ou HD externo, como segurança extra (veja
      [`BACKUP-RESTAURACAO.md`](BACKUP-RESTAURACAO.md)).

Somente depois de marcar todos os itens acima, é seguro cancelar a
conta na Emergent.

---

## 📚 Veja também

- [`README.md`](README.md) — visão geral do sistema.
- [`INSTALACAO-WINDOWS.md`](INSTALACAO-WINDOWS.md) — como instalar o
  sistema local.
- [`BACKUP-RESTAURACAO.md`](BACKUP-RESTAURACAO.md) — guia completo de
  backup e restauração no sistema local.
