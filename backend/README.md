# Backend Application connectivity

## Local development

Use Node.js 20.19.0 or newer. Run `npm ci` to install the exact versions in
`package-lock.json`. The development script uses Node's built-in watch mode,
so nodemon is not required.

From this directory, run `node seed.js` or `npm run seed` to load sample data.
The seed script **deletes all existing posts and users** before inserting
sample records. Only run it against a database where that is acceptable.