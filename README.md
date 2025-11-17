npx patch-package expo

<!-- build -->
npx expo prebuild --clean
npx expo run:android

<!-- build local : cd android -->
.\gradlew assembleDebug
./gradlew clean assembleDebug
.\gradlew assembleDebug --stacktrace --info --debug

<!-- run -->
adb install -r "C:\Healthcare_KLTN_FE_App\android\app\build\outputs\apk\debug\app-debug.apk"
npx react-native start
