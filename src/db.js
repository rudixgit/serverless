var AWS = require('aws-sdk')
// Set the region
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'eu-central-1',
})
var db = new AWS.DynamoDB.DocumentClient()
if (!process.env.LAMBDA_RUNTIME_DIR) {
    var params = {
        TableName: 'ddb',
        //FilterExpression: 'id >= :this_year',
        //ExpressionAttributeValues: { ':this_year': '_AllenDSmith_' },
        Limit: 10,
    }

    db.scan(params, function (err, data) {
        if (err) console.log(err)
        else console.log(data)
    })
}
function get(id, callback) {
    return new Promise((resolve) => {
        db.get(
            {
                TableName: 'ddb',
                Key: {
                    id: id,
                },
            },
            function (err, data) {
                resolve(data.Item ? data.Item : {})
            }
        )
    })
}

function put(json, callback) {
    const json1 = {
        ...json,
        id: json.id ? json.id : new Date().getTime().toString(),
    }
    return new Promise((resolve, reject) => {
        db.put({ TableName: 'ddb', Item: json1 }, function (err, data) {
            resolve({ id: json1.id })
        })
    })
}
module.exports = { get, put }
