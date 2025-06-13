// imcfg.port lib
const ejs = require('ejs');
const path = require('path')
const fs = require('fs');
const express = require('express')
const util = require('util')
const app = express()
const dotdenv = require('dotenv').config();
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
// const ngrok = require('@ngrok/ngrok');
const http = require('http');
// connect to db
const db = require('./src/config/db/connect');
const query = util.promisify(db.query).bind(db)

const cfg = require('./src/config/index')
const route = require('./src/routes/index')

// set view engine
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// use static folder
app.use(express.static(path.join('src', 'public')))

const orderController = require('./src/controllers/customer/orderController.js')
app.use('/order/webhook', bodyParser.raw({type: 'application/json'}), orderController.webhook);

//parse URL-encoded bodies
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('secret'))

//app.use('/', require('./routes/index'))

// route init
route(app)

app.listen(cfg.port, async () => {
    console.log(`Website is running at http://${cfg.host}:${cfg.port}`);

    try {
        // const listener = await ngrok.connect({
        //     addr: cfg.port,
        //     authtoken: process.env.NGROK_AUTHTOKEN,
        // });
        // const ngrokUrl = listener.url();
        // console.log(`Ngrok tunnel: ${ngrokUrl}`);
        // updateConfig(ngrokUrl);
    } catch (err) {
        console.error('Ngrok error:', err);
    }
});
