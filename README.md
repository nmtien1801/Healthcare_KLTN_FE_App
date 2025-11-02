<!-- build -->
npx expo prebuild --clean
npx expo run:android

eas build -p android --profile preview --clear-cache
eas build -p android --profile production
eas build -p ios --profile production

<!-- submit -->
eas submit -p android --latest
eas submit -p ios --latest

<!-- nếu dùng biến môi trường env -->
eas secret:create --name API_URL --value https://your-api.com
eas secret:create --name API_URL --value https://your-api.com --environment preview
eas secret:list

<!-- đây là phần env cần để build -->
<!-- Thêm --force để ghi đè nếu secret đã tồn tại -->
eas env:create --name URL_ANDROID --value http://192.168.1.3:8080/api --environment preview
eas env:create --name URL_WEB --value http://localhost:8080/api --environment preview
eas env:create --name UID_DOCTER --value 1HwseYsBwxby5YnsLUWYzvRtCw53 --environment preview
eas env:create --name UID_PATIENT --value cq6SC0A1RZXdLwFE1TKGRJG8fgl2 --environment preview
eas env:create --name FIREBASE_API_KEY --value AIzaSyDcis3qmp7pQmd-pbnQ4ZhwcL9Q6SjDrSw --environment preview
eas env:create --name FIREBASE_AUTH_DOMAIN --value test-chat-firebase-8ef22.firebaseapp.com --environment preview
eas env:create --name FIREBASE_PROJECT_ID --value test-chat-firebase-8ef22 --environment preview
eas env:create --name FIREBASE_STORAGE_BUCKET --value test-chat-firebase-8ef22.appspot.com --environment preview
eas env:create --name FIREBASE_MESSAGING_SENDER_ID --value 1099403948301 --environment preview
eas env:create --name FIREBASE_APP_ID --value 1:1099403948301:web:fa16665eb9dfb40ec44044 --environment preview
eas env:create --name FIREBASE_MEASUREMENT_ID --value G-6SVYBYHMZD --environment preview
eas env:create --name FIREBASE_DATABASE_URL --value https://test-chat-firebase-8ef22-default-rtdb.asia-southeast1.firebasedatabase.app --environment preview
eas env:create --name BOOKING_FEE --value 200000 --environment preview