EXPO_PUBLIC_URL_ANDROID=http://10.0.2.2:8080/api
EXPO_PUBLIC_URL_WEB=http://localhost:8080/api

npx patch-package expo
npx expo install --fix
adb logcat *:S ReactNative:V ReactNativeJS:V

<!-- build -->
npx expo prebuild --clean
npx expo run:android
npx expo install --fix
<!-- build local : cd android -->
.\gradlew assembleDebug
./gradlew clean assembleDebug
.\gradlew assembleDebug --stacktrace --info --debug
./gradlew assembleRelease

<!-- run -->
adb install -r "C:\Healthcare_KLTN_FE_App\android\app\build\outputs\apk\debug\app-debug.apk"
adb install -r "C:\Healthcare_KLTN_FE_App\android\app\build\outputs\apk\release\app-release.apk"
npx react-native start
npx expo start --clear


<!-- cài chạy release -->
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias NguyenMinhTien -keyalg RSA -keysize 2048 -validity 10000

keytool -list -v -keystore android/app/my-upload-key.keystore -alias NguyenMinhTien