const tunnel = require('tunnel-ssh');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

const DB_HOST = '' // doc-db cluster endpoint
const DB_PORT = 27017 // doc-db cluster endpoint port
const DB_USERNAME = '' // doc-db username
const DB_PASSWORD = '' // doc-db passord
const DB_NAME = '' // doc-db db name ie my_db_name
const DB_TLS_PATH = '' // Path of the DocDb Tls cert ie ./rds-combined-ca-bundle.pem

const PROXY_HOST = '' //IP adress of VPS which is the proxy SSH server ie ec2-x.x.x.x.us-west-1.compute.amazonaws.com
const PROXY_SSH_USER = '' // The SSH server username ie ec2-user
const PRIVATE_KEY_PATH = '' // path of of ssh private key cert ie ./pass.pem

const LOCAL_DB_PORT = 27017 // local socks port that ssh tunnel will bind to

const sshTunnelConfig = {
    agent: process.env.SSH_AUTH_SOCK,
    username: PROXY_SSH_USER,
    privateKey: fs.readFileSync(PRIVATE_KEY_PATH),
    host: PROXY_HOST, 
    port: 22,
    dstHost: DB_HOST,
    dstPort: DB_PORT, //or 27017 or something like that
    localHost: '127.0.0.1',
    localPort: LOCAL_DB_PORT //or anything else unused you want
};

tunnel(sshTunnelConfig, (error, tnl) => {
    if(error) {
        console.log("SSH connection error: ", error);
    }
    const mongoUrl = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@127.0.0.1:${LOCAL_DB_PORT}/${DB_NAME}?ssl=true`
    // the Amazon DocumentDB cert
    const caCert = [fs.readFileSync(DB_TLS_PATH)];
    const client = new MongoClient(mongoUrl, {
        tlsAllowInvalidHostnames: true,
        tlsCAFile: caCert,
        useUnifiedTopology: true
    });
    client.connect(async function(err) {
        console.log('err => ', err)
        const db = client.db();
        const cols = await db.collections()
        console.log(cols.map(c=> c.collectionName))

        // ... TODO ...

        client.close();
        tnl.close();
    });
});