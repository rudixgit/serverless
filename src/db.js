const AWS = require("aws-sdk");
const fs = require("fs");
// Set the region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "eu-central-1",
});
const db = new AWS.DynamoDB.DocumentClient();

async function readFile(path) {
  return new Promise((resolve) => {
    fs.readFile(`/tmp/${path}`, "utf8", (err, data) => {
      if (err) {
        resolve(null);
      }
      resolve(data);
    });
  });
}
async function get(id) {
  const cached = await readFile(id);
  const params = {
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
        fs.writeFile(`/tmp/${id}`, JSON.stringify(x), function () {
          resolve(x);
        });
      });
    } else {
      resolve({ ...JSON.parse(cached), cached: true });
    }
  });
}

function put(json) {
  return new Promise((resolve) => {
    db.put({ TableName: "ddb", Item: json }, function () {
      resolve({});
    });
  });
}

async function q1({ fields, collection, descending, limit }) {
  const params = {
    TableName: "ddb",
    KeyConditionExpression: "tip = :hkey  and vreme >= :zkey",
    FilterExpression: `${Object.keys(query)[0]} = :ukey`,
    ExpressionAttributeValues: {
      ":zkey": 1,
      ":hkey": collection,
      ":ukey": Object.values(query)[0],
    },
    Limit: limit || 100,
    ScanIndexForward: descending || true,
    ReturnConsumedCapacity: "TOTAL",
  };
  if (fields) {
    params.ProjectionExpression = fields;
  }
  return new Promise((resolve) => {
    db.query(params, (err, data) => {
      if (data.Count === 1) {
        resolve(data.Items[0]);
      }
      resolve(data);
    });
  });
}

async function query({ id, collection, limit, descending, count, fields }) {
  const params = {
    TableName: "ddb",
    KeyConditionExpression: "tip = :hkey and vreme >= :ukey",
    ExpressionAttributeValues: {
      ":hkey": collection,
      ":ukey": id || 1,
    },
    Limit: limit || 100,
    ScanIndexForward: descending || false,
    ReturnConsumedCapacity: "TOTAL",
  };
  if (fields) {
    params.ProjectionExpression = fields;
  }
  if (count) {
    params.Select = "COUNT";
  }
  return new Promise((resolve) => {
    db.query(params, (err, data) => {
      if (data.Count === 1) {
        resolve(data.Items[0]);
      }
      resolve(data);
    });
  });
}

module.exports = { get, put, query, q1 };
