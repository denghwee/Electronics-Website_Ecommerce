const https = require('https');
const crypto = require('crypto');

/**
 * Tạo link thanh toán MoMo (Promise)
 * @param {Object} params - Các tham số cần thiết cho thanh toán
 * @returns {Promise<string>} - Trả về link thanh toán MoMo (payUrl)
 */
function get_momo_link({
        amount,
        orderInfo = "pay with MoMo",
        redirectUrl = process.env.MOMO_RETURN_URL,
        ipnUrl = process.env.MOMO_NOTIFY_URL,
        partnerCode = process.env.MOMO_PARTNER_CODE,
        accessKey = process.env.MOMO_ACCESS_KEY,
        secretkey = process.env.MOMO_SECRET_KEY,
        requestType = "captureWallet",
        extraData = ""
    } = {}) {
    return new Promise((resolve, reject) => {
        const requestId = partnerCode + new Date().getTime();
        const orderId = requestId;

        // Tạo raw signature đúng thứ tự tài liệu MoMo
        const rawSignature = 
            "accessKey=" + accessKey +
            "&amount=" + amount +
            "&extraData=" + extraData +
            "&ipnUrl=" + ipnUrl +
            "&orderId=" + orderId +
            "&orderInfo=" + orderInfo +
            "&partnerCode=" + partnerCode +
            "&redirectUrl=" + redirectUrl +
            "&requestId=" + requestId +
            "&requestType=" + requestType;

        const signature = crypto.createHmac('sha256', secretkey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: 'en'
        });

        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.payUrl) {
                        resolve(response.payUrl);
                    } else {
                        reject(response.message || 'Không lấy được payUrl từ MoMo');
                    }
                } catch (err) {
                    reject('Lỗi parse JSON từ MoMo: ' + err.message);
                }
            });
        });

        console.log(requestBody)


        req.on('error', (e) => reject(`Lỗi gửi request tới MoMo: ${e.message}`));
        req.write(requestBody);
        req.end();
    });
}

module.exports = get_momo_link;