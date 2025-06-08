const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const qs = require('qs');
const config = require('../config/vnpay.config');

router.get('/vnpay_ipn', (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', config.vnp_HashSecret);
    let signed = hmac.update(signData).digest('hex');

    if (secureHash === signed) {
        // TODO: Kiểm tra trạng thái đơn hàng trong DB, cập nhật nếu chưa xử lý
        // Nếu xử lý thành công:
        res.status(200).json({ RspCode: '00', Message: 'Success' });
        // Nếu đơn hàng đã xử lý rồi:
        // res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }
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