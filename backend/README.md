# Backend Application connectivity

## Local development

Use Node.js 20.19.0 or newer. Run `npm ci` to install the exact versions in
`package-lock.json`. The development script uses Node's built-in watch mode,
so nodemon is not required. Both start scripts expect `server.js` in this
directory; that entry point is not present in the current backend folder.