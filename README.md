npx patch-package expo

<!-- build -->
npx expo prebuild --clean
npx expo run:android

<!-- build local : cd android -->
.\gradlew assembleDebug
./gradlew clean assembleDebug
.\gradlew assembleDebug --stacktrace --info --debug

