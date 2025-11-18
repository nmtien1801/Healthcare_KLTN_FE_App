const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Định nghĩa nội dung của module ảo (@env)
// Các biến này phải được định nghĩa trong các tệp .env với tiền tố EXPO_PUBLIC_ [3].
const VIRTUAL_ENV_MODULE_CONTENT = `
// Đảm bảo tất cả các biến bạn import trong firebase.js đều được export tại đây

export const EXPO_PUBLIC_URL_ANDROID=process.env.EXPO_PUBLIC_URL_ANDROID
export const EXPO_PUBLIC_URL_WEB=process.env.EXPO_PUBLIC_URL_WEB
export const EXPO_PUBLIC_FIREBASE_API_KEY=process.env.EXPO_PUBLIC_FIREBASE_API_KEY
export const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
export const EXPO_PUBLIC_FIREBASE_PROJECT_ID=process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
export const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
export const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
export const EXPO_PUBLIC_FIREBASE_APP_ID=process.env.EXPO_PUBLIC_FIREBASE_APP_ID
export const EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
export const EXPO_PUBLIC_FIREBASE_DATABASE_URL=process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
export const EXPO_PUBLIC_BOOKING_FEE=process.env.EXPO_PUBLIC_BOOKING_FEE
`;

// 2. Định nghĩa đường dẫn và tạo tệp module ảo
const VIRTUAL_ENV_PATH = path.resolve(__dirname, 'node_modules/.cache/virtual/env-module.js');

try {
    // Tạo thư mục nếu nó chưa tồn tại [2]
    fs.mkdirSync(path.dirname(VIRTUAL_ENV_PATH), { recursive: true });
    // Ghi nội dung vào tệp ảo [2]
    fs.writeFileSync(VIRTUAL_ENV_PATH, VIRTUAL_ENV_MODULE_CONTENT);
} catch (e) {
    console.error("Lỗi khi tạo tệp module ảo:", e);
}


// 3. Tùy chỉnh Resolver để chuyển hướng yêu cầu '@env'
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Nếu tên module là '@env', chuyển hướng nó đến tệp ảo
    if (moduleName === '@env') {
        return {
            filePath: VIRTUAL_ENV_PATH,
            type: 'sourceFile',
        };
    }

    // Nếu bạn muốn giữ lại ví dụ giả lập lodash trên web (ví dụ trong template của bạn):
    if (platform === 'web' && moduleName === 'lodash') {
        return { type: 'empty' }; // Giả lập lodash thành module rỗng trên web [4]
    }

    // Đảm bảo bạn gọi trình phân giải mặc định cho tất cả các module khác [4, 5]
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;