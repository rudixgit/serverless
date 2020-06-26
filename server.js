require('dotenv').config()
const serverless = require('serverless-http')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
var AWS = require('aws-sdk')
// Set the region
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'eu-central-1',
})

var db = new AWS.DynamoDB.DocumentClient()
app.get('/test', function (req, res) {
    res.end('hello world 222222')
})
app.get('/:id', function (req, res) {
    db.get(
        {
            TableName: 'ddb',
            Key: {
                id: req.params.id,
            },
        },
        function (err, data) {
            res.json(data.Item ? data.Item : {})
        }
    )
})
app.post('/', function (req, res) {
    const json = {
        ...req.body,
        id: req.body.id ? req.body.id : new Date().getTime().toString(),
    }
    console.log(json)

    db.put({ TableName: 'ddb', Item: json }, function (err, data) {
        res.json({ id: json.id })
    })
})
if (!process.env.LAMBDA_RUNTIME_DIR) {
    const request = require('request')
    var options = {
        uri: 'http://localhost:3000/',
        method: 'POST',
        json: {
            longUrl: 'http://www.google.com/',
        },
    }

    request(options, function (error, response, body) {
        console.log(body) // Print the shortened url.
    })
    app.listen(3000)
}
//testdsds
module.exports.handler = serverless(app)
