const https = require('https');
const crypto = require('crypto');

async function momo_query({ orderId, requestId }) {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;

    // Tạo raw signature đúng thứ tự
    const rawSignature =
        "accessKey=" + accessKey +
        "&orderId=" + orderId +
        "&partnerCode=" + partnerCode +
        "&requestId=" + requestId;

    const signature = crypto.createHmac('sha256', secretkey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = JSON.stringify({
        partnerCode,
        accessKey,
        requestId,
        orderId,
        signature,
        lang: 'en'
    });

    const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/query',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (err) {
                    reject('Lỗi parse JSON từ MoMo: ' + err.message);
                }
            });
        });

        req.on('error', (e) => reject(`Lỗi gửi request tới MoMo: ${e.message}`));
        req.write(requestBody);
        req.end();
    });
}

module.exports = momo_query;