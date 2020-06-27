require('dotenv').config()
const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const isBot = require('isbot-fast')
const db = require('./src/db.js')
const app = express()
app.use(bodyParser.json())

app.get('/', function (req, res) {
    const ua = req.headers['user-agent'] || ''

    if (isBot(ua)) {
        res.end(ua)
    } else {
        res.end('not bot')
        // Making cookies
    }
})

db.put({ id: 'test' }, function (data) {
    console.log(data)
})
db.get('test', function (data) {
    console.log(data)
})

app.get('/:id', function (req, res) {
    db.get(req.params.id, function (data) {
        res.json(data)
    })
})
app.post('/', function (req, res) {
    db.put(req.body, function (data) {
        res.json(data)
    })
})
if (!process.env.LAMBDA_RUNTIME_DIR) {
    app.listen(3000)
}
//testdsds
module.exports.handler = serverless(app)
