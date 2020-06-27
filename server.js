require('dotenv').config()
const serverless = require('serverless-http')
const express = require('express')

//const db = require('./src/db.js')
const app = express()
//app.use(bodyParser.json())
const PouchDB = require('pouchdb')
var TempPouchDB = PouchDB.defaults({ prefix: '/tmp/' })

app.use('/', require('express-pouchdb')(TempPouchDB))

if (!process.env.LAMBDA_RUNTIME_DIR) {
    app.listen(3000)
}
//testdsds
module.exports.handler = serverless(app)
