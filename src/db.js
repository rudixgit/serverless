var AWS = require('aws-sdk')
// Set the region
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'eu-central-1',
})
var db = new AWS.DynamoDB.DocumentClient()
function get(id) {
    db.get(
        {
            TableName: 'ddb',
            Key: {
                id: id,
            },
        },
        function (err, data) {
            return data.Item ? data.Item : {}
        }
    )
}

function put(json) {
    const json1 = {
        ...json,
        id: json.id ? json.id : new Date().getTime().toString(),
    }

    db.put({ TableName: 'ddb', Item: json1 }, function (err, data) {
        return { id: json1.id }
    })
}
module.exports = { get, put }
