const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

const DEFAULT_SERVER_URL = 'http://localhost:3000';

let mainWindow = null;
let configWindow = null;

function createMainWindow(serverUrl) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
    title: 'Cupim na Telha',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.loadURL(serverUrl).catch((err) => {
    dialog.showErrorBox(
      'Erro de conexão',
      `Não foi possível conectar ao servidor do Cupim na Telha em:\n${serverUrl}\n\nVerifique se o servidor está ligado e na mesma rede, depois reabra o aplicativo.\n\nErro técnico: ${err.message}`
    );
    if (configWindow) configWindow.focus();
    else createConfigWindow();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Abre links externos no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentHost = new URL(mainWindow.webContents.getURL()).host;
    const targetHost = new URL(url).host;
    if (currentHost !== targetHost) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createConfigWindow() {
  if (configWindow) {
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 500,
    height: 320,
    resizable: false,
    maximizable: false,
    minimizable: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
    title: 'Configurar Servidor - Cupim na Telha',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const currentUrl = store.get('serverUrl', DEFAULT_SERVER_URL);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configurar Servidor</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
          background: #f5efe8;
          color: #3d1c0b;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .container {
          background: #fff;
          border-radius: 12px;
          padding: 28px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 8px 24px rgba(61,28,11,0.12);
        }
        h1 { margin: 0 0 8px 0; font-size: 20px; }
        p { margin: 0 0 20px 0; font-size: 14px; color: #6b4a32; }
        label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9c8b8;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          outline: none;
        }
        input:focus { border-color: #c4885b; }
        button {
          width: 100%;
          padding: 12px;
          background: #3d1c0b;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }
        button:hover { background: #5a2d14; }
        .hint { margin-top: 12px; font-size: 12px; color: #8a6b4f; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Conectar ao Servidor</h1>
        <p>Informe o endereço do computador servidor do Cupim na Telha.</p>
        <label for="serverUrl">Endereço do servidor</label>
        <input type="text" id="serverUrl" value="${currentUrl}" placeholder="http://192.168.1.10:3000" />
        <button id="saveBtn">Conectar</button>
        <div class="hint">Exemplos: http://localhost:3000 ou http://192.168.1.10:3000</div>
      </div>
      <script>
        document.getElementById('saveBtn').addEventListener('click', () => {
          const url = document.getElementById('serverUrl').value.trim();
          if (!url) return alert('Digite o endereço do servidor.');
          window.electronAPI.setServerUrl(url);
        });
      </script>
    </body>
    </html>
  `;

  configWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  configWindow.on('closed', () => {
    configWindow = null;
  });
}

function getServerUrl() {
  return store.get('serverUrl', DEFAULT_SERVER_URL);
}

app.whenReady().then(() => {
  const serverUrl = getServerUrl();
  createMainWindow(serverUrl);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(getServerUrl());
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('set-server-url', (event, url) => {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'http://' + normalized;
  }
  store.set('serverUrl', normalized);

  if (configWindow) {
    configWindow.close();
    configWindow = null;
  }

  if (mainWindow) {
    mainWindow.loadURL(normalized);
  } else {
    createMainWindow(normalized);
  }
});

ipcMain.on('open-config-window', () => {
  createConfigWindow();
});

// Atalho de menu para reconfigurar servidor
const { Menu } = require('electron');
const template = [
  {
    label: 'Cupim na Telha',
    submenu: [
      {
        label: 'Reconfigurar Servidor',
        accelerator: 'Ctrl+Shift+S',
        click: () => createConfigWindow(),
      },
      { type: 'separator' },
      {
        label: 'Recarregar',
        accelerator: 'F5',
        click: () => {
          if (mainWindow) mainWindow.reload();
        },
      },
      {
        label: 'Alternar Tela Cheia',
        accelerator: 'F11',
        click: () => {
          if (mainWindow) {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
          }
        },
      },
      { type: 'separator' },
      { role: 'quit', label: 'Sair' },
    ],
  },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));
