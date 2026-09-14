# Cupim na Telha - Versão Desktop Windows

Este pacote permite instalar o Cupim na Telha como um aplicativo desktop no Windows, sem precisar do Docker.

## Arquitetura

- Um computador (mini PC/servidor) atua como servidor principal.
- O servidor roda MongoDB + backend FastAPI + frontend React embutidos.
- Outros PCs na mesma rede Wi-Fi acessam pelo navegador usando o IP do servidor.

## Como instalar

1. Execute `CupimNaTelha_Setup.exe` no computador que sera o servidor.
2. Siga o assistente de instalação.
3. Ao final, marque a opcao "Iniciar o Cupim na Telha agora".
4. O navegador padrao abrira em `http://localhost:8001`.

## Acesso pelos outros PCs

No servidor, abra o navegador em `http://localhost:8001`.

Para outros PCs na mesma rede Wi-Fi, use o endereco IP do servidor:

```
http://IP-DO-SERVIDOR:8001
```

Exemplo: `http://192.168.1.145:8001`

Para descobrir o IP do servidor, abra o Prompt de Comando e digite:

```cmd
ipconfig
```

Procure pelo campo "Endereco IPv4" na conexao Wi-Fi.

## Inicializacao automatica

Durante a instalacao, marque a opcao "Iniciar automaticamente com o Windows".
Caso queira alterar depois, o atalho pode ser removido da pasta:

```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

## Armazenamento de dados

Os dados ficam salvos na pasta do usuario:

```
%LOCALAPPDATA%\CupimNaTelha
```

- `mongodb_data` - banco de dados MongoDB
- `backups` - backups automaticos diarios
- `logs` - logs do sistema

## Como compilar novamente (desenvolvedor)

Requisitos:
- Node.js + yarn
- Python 3.11 (para rodar scripts de build)
- Inno Setup 6

Passos:

```cmd
# 1. Build do frontend
python scripts/build_desktop.py

# 2. Baixar Python 3.11 embeddable para a pasta python-embed/
#    https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip

# 3. Instalar dependencias no Python embeddable
python-embed\python.exe -m pip install -r requirements-desktop.txt

# 4. Baixar MongoDB Community Server Windows e extrair em mongodb/windows/bin/
#    https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.3.8.zip

# 5. Compilar executavel
python-embed\python.exe -m PyInstaller --onefile --console --name CupimNaTelha --icon assets\icon.ico launcher.py

# 6. Copiar para pasta desktop
copy dist\CupimNaTelha.exe dist\desktop\

# 7. Gerar instalador
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

## Solucao de problemas

### O programa nao abre
- Verifique se a porta 8001 nao esta sendo usada por outro programa.
- Verifique se o Visual C++ Redistributable esta instalado (necessario para o MongoDB).

### Outro PC nao consegue acessar
- Confirme que ambos estao na mesma rede Wi-Fi.
- Verifique o firewall do Windows - a porta 8001 precisa estar liberada.
- Confira se o IP do servidor esta correto.

### Dados nao aparecem
- Verifique se o MongoDB iniciou corretamente.
- Os dados ficam em `%LOCALAPPDATA%\CupimNaTelha\mongodb_data`.
