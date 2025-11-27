EXPO_PUBLIC_URL_ANDROID=http://10.0.2.2:8080/api
EXPO_PUBLIC_URL_WEB=http://localhost:8080/api

npx patch-package expo
npx expo install --fix

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
npx react-native start



