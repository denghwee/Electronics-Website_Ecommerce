const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

router.get('/create_payment_url', (req, res) => {
    const configPath = path.join(__dirname, '../config/vnpay.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let tmnCode = config.vnp_TmnCode;
    let secretKey = config.vnp_HashSecret;
    let vnpUrl = config.vnp_Url;
    let returnUrl = config.vnp_ReturnUrl;

    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    let orderId = moment(date).format('HHmmss');
    let amount = req.query.amount || 10000; // Số tiền test (VND) (chỉnh theo yêu cầu)
    let bankCode = req.query.bankCode || '';

    let locale = req.query.locale || 'vn';
    if (locale !== 'vn') locale = 'en';

    let currCode = 'VND';

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': locale,
        'vnp_CurrCode': currCode,
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': 'Thanh toan don hang test',
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
    };

    if (bankCode !== '') {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Bước 1: Sort params theo thứ tự alphabet
    vnp_Params = sortObject(vnp_Params);

    // Bước 2: Tạo querystring và hash SHA256
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(signData).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    let paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: true });
    console.log(vnp_Params)
    return res.redirect(paymentUrl);
});

function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    for (let key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}

module.exports = router;