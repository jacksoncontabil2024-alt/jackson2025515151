#define MyAppName "Cupim na Telha"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Cupim na Telha"
#define MyAppExeName "CupimNaTelha.exe"
#define MyAppBatName "CupimNaTelha.bat"

[Setup]
AppId={{CUPIM-NA-TELHA-DESKTOP-2026}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\CupimNaTelha
DisableProgramGroupPage=yes
LicenseFile=
InfoBeforeFile=
InfoAfterFile=
OutputDir=C:\Users\adm\Documents\verdent-projects\cupim-na-telha\dist
OutputBaseFilename=CupimNaTelha_Setup
SetupIconFile=C:\Users\adm\Documents\verdent-projects\cupim-na-telha\assets\icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar icone na area de trabalho"; GroupDescription: "Atalhos:"; Flags: unchecked
Name: "startup"; Description: "Iniciar automaticamente com o Windows"; GroupDescription: "Inicializacao:"; Flags: unchecked

[Files]
Source: "C:\Users\adm\Documents\verdent-projects\cupim-na-telha\dist\desktop\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\icon.ico"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\assets\icon.ico"; Tasks: startup

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar o Cupim na Telha agora"; Flags: nowait postinstall skipifsilent
