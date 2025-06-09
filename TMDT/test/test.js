const https = require('https');
const crypto = require('crypto');

// Thông tin cấu hình MoMo (có thể lấy từ .env)
const partnerCode = "MOMO";
const accessKey = "F8BBA842ECF85";
const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

// Thay orderId và requestId bằng của bạn khi test thực tế
const orderId = "900";
const requestId = "900";

// Tạo raw signature đúng tài liệu MoMo
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

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('MoMo response:');
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`Lỗi gửi request tới MoMo: ${e.message}`);
});

req.write(requestBody);
req.end();