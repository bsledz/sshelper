const { app, globalShortcut, BrowserWindow, desktopCapturer, ipcMain, screen } = require('electron')


app.on('ready', () => {
        // Create the browser window.
        win = new BrowserWindow({width: 800, height: 600, webPreferences: {
                        nodeIntegration: true, nodeIntegrationInWorker: true
                }})
    // and load the index.html of the app.
        win.loadFile('index.html')
    globalShortcut.register('F1', () => {
        console.log('F1 is pressed')
        win.webContents.send('ADD_EVENT', {type: "SSEVENT"});
    })

    globalShortcut.register('F2', () => {
        console.log('F2 is pressed')
        var cursorPosition = screen.getCursorScreenPoint();
        win.webContents.send('ADD_EVENT', {type: "MSEVENT", pos: cursorPosition});
    })


    // Check whether a shortcut is registered.
    console.log(globalShortcut.isRegistered('F1'))
})

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})