# 📦 Cupim na Telha - Sistema de Gestão de Entregas (OFFLINE)

## 🚀 Instalação e Uso

### Pré-requisitos

**Você precisa ter instalado:**
- Docker Desktop ([Download aqui](https://www.docker.com/products/docker-desktop))
  - Windows: Docker Desktop for Windows
  - Mac: Docker Desktop for Mac  
  - Linux: Docker Engine + Docker Compose

### 📥 Instalação

1. **Descompacte o arquivo** do sistema em uma pasta de sua escolha
2. **Certifique-se que o Docker Desktop está rodando**

### ▶️ Iniciando o Sistema

#### Windows
1. Dê duplo clique no arquivo `start-cupim.bat`
2. Aguarde o sistema iniciar (primeira vez pode demorar alguns minutos)
3. O navegador abrirá automaticamente em `http://localhost:3000`

#### Linux / Mac
1. Abra o terminal na pasta do sistema
2. Execute: `./start-cupim.sh`
3. Aguarde o sistema iniciar
4. Acesse: `http://localhost:3000`

### ⏹️ Parando o Sistema

#### Windows
- Dê duplo clique no arquivo `stop-cupim.bat`

#### Linux / Mac
- Execute: `./stop-cupim.sh`

---

## 🎯 Como Usar

### Primeiro Acesso
1. O sistema abrirá no navegador
2. Comece cadastrando entregadores na aba "Entregadores"
3. Depois cadastre entregas na aba "Entregas"

### Funcionalidades Principais

#### 💰 Caixa
- Registre entradas e saídas de dinheiro
- Acompanhe o saldo em tempo real
- Histórico completo de movimentações

#### 📦 Entregas
- Cadastre novas entregas com cliente, valor e forma de pagamento
- 6 formas de pagamento: PIX, Cartão, Dinheiro, Já Pago, Vem Retirar, Marcar
- **Busca múltipla**: Digite números separados por `;` (exemplo: `27;45;67`)
- Atribua entregadores
- Acompanhe status: Pendente → Em Entrega → Entregue
- Edite, cancele ou descancele entregas

#### 👥 Entregadores
- Cadastre seus entregadores
- Atribua entregas a cada um
- Acompanhe performance

#### 💼 Funcionários
- Registre pagamentos a funcionários
- Controle total pago
- Histórico de pagamentos

#### 📊 Relatórios
- Visualize totais por forma de pagamento
- **Checklist**: Marque entregas conferidas (fica verde)
- Clique nos cards para ver detalhes
- Cada forma de pagamento tem seu próprio checklist

#### 📄 Resumo
- Visão geral de todas as entregas
- Status e entregador de cada pedido

#### 📥 Exportações
- **Excel**: Todas as entregas, caixa e funcionários
- **PDF**: Resumos, relatórios e pagamentos

---

## 🔧 Comandos Úteis

### Ver logs do sistema
```bash
docker-compose logs
```

### Ver logs em tempo real
```bash
docker-compose logs -f
```

### Reiniciar o sistema
```bash
docker-compose restart
```

### Backup do banco de dados
```bash
docker-compose exec mongodb mongodump --out /data/backup
```

---

## 📱 Acessando de Outros Dispositivos

Se quiser acessar o sistema de outro computador na mesma rede:

1. Descubra o IP do computador onde o sistema está rodando
   - Windows: `ipconfig` (procure por IPv4)
   - Linux/Mac: `ifconfig` ou `ip addr`

2. No outro dispositivo, acesse: `http://IP-DO-COMPUTADOR:3000`
   - Exemplo: `http://192.168.1.100:3000`

---

## ❓ Solução de Problemas

### Porta 3000 ou 8001 já está em uso
Edite o arquivo `docker-compose.yml` e altere as portas:
```yaml
ports:
  - "3001:80"  # Mude 3000 para 3001
```

### Docker não encontrado
1. Certifique-se que o Docker Desktop está instalado
2. No Windows: Verifique se o Docker Desktop está rodando (ícone na bandeja)
3. Reinicie o computador após instalar o Docker

### Sistema não inicia
```bash
docker-compose down
docker-compose up --build
```

### Limpar tudo e começar do zero
```bash
docker-compose down -v
docker-compose up -d
```

---

## 💾 Dados do Sistema

**Onde ficam os dados?**
- Os dados ficam em um volume Docker chamado `mongodb_data`
- Mesmo parando o sistema, os dados são preservados
- Para backup, use o comando de backup mencionado acima

**Como fazer backup?**
```bash
# Exportar dados
docker-compose exec mongodb mongodump --out /data/backup

# Restaurar dados
docker-compose exec mongodb mongorestore /data/backup
```

---

## 📞 Suporte

Sistema desenvolvido para gestão de entregas do Cupim na Telha.

**Versão:** 1.0.0  
**Última atualização:** 2025

---

## ⚡ Dicas Rápidas

1. **Sempre deixe o Docker Desktop rodando** antes de iniciar o sistema
2. Use a **busca múltipla** (27;45;67) para localizar vários pedidos rapidamente
3. **Marque as entregas** nos relatórios conforme vai conferindo (ficam verdes)
4. Faça **backup regular** dos dados
5. O sistema funciona **100% offline** - não precisa de internet

---

## 🎉 Pronto para Usar!

O sistema está instalado e pronto para gerenciar suas entregas.

**Boa gestão! 🚀**
