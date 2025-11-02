<!-- build -->
eas build -p android --profile production
eas build -p ios --profile production

eas build -p android --profile preview
<!-- submit -->
eas submit -p android --latest
eas submit -p ios --latest

<!-- nếu dùng biến môi trường env -->
eas secret:create --name API_URL --value https://your-api.com
eas secret:create --name API_URL --value https://your-api.com --environment preview
eas secret:list