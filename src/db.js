var AWS = require("aws-sdk");
const fs = require("fs");
// Set the region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "eu-central-1",
});
var db = new AWS.DynamoDB.DocumentClient();

async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile("/tmp/" + path, "utf8", function (err, data) {
      if (err) {
        resolve(null);
      }
      resolve(data);
    });
  });
}
async function get(id) {
  const cached = await readFile(id);
  var params = {
    TableName: "ddb",
    KeyConditionExpression: "tip = :hkey",
    ExpressionAttributeValues: {
      ":hkey": id,
    },
    ScanIndexForward: false,
  };
  return new Promise((resolve) => {
    if (!cached) {
      db.query(params, function (err, data) {
        const x = data.Count >= 1 ? data.Items[0] : {};
        fs.writeFile("/tmp/" + id, JSON.stringify(x), function (err, data) {
          resolve(x);
        });
      });
    } else {
      resolve({ ...JSON.parse(cached), cached: true });
    }
  });
}

function put(json, callback) {
  return new Promise((resolve, reject) => {
    db.put({ TableName: "ddb", Item: json }, function (err, data) {
      resolve({});
    });
  });
}
async function test({ title, attributes, collection }) {
  var params = {
    TableName: "ddb",
    KeyConditionExpression: "tip = :hkey  and vreme >= :zkey",
    FilterExpression: "title = :ukey",
    ExpressionAttributeValues: {
      ":zkey": 1,
      ":hkey": "newsbg",
      ":ukey": title,
    },
  };
  db.query(params, function (err, data) {
    console.log(data, err);
  });
}

async function query({ id, collection, limit, descending, count, fields }) {
  var params = {
    TableName: "ddb",
    KeyConditionExpression: "tip = :hkey and vreme >= :ukey",
    ExpressionAttributeValues: {
      ":hkey": collection,
      ":ukey": id ? id : 1,
    },
    Limit: limit,
    Skip: 1,
    ScanIndexForward: descending ? descending : true,
    ReturnConsumedCapacity: "TOTAL",
  };
  if (fields) {
    params.ProjectionExpression = fields;
  }
  if (count) {
    params.Select = "COUNT";
  }
  return new Promise((resolve) => {
    db.query(params, function (err, data) {
      resolve(data);
    });
  });
}

module.exports = { get, put, query };
