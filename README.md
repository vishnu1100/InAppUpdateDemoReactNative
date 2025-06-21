# InAppUpdateDemoReactNative

This project is a demonstration of in-app updates in React Native.

## Project Setup

To create a new React Native project:

```bash
npx @react-native-community/cli init YourProjectName
```

## Development

### Starting the Metro Bundler

To start the Metro bundler and reset the cache:

```bash
npx react-native start --reset-cache
```

### Running the application

To run the project on a specific platform:

-   **Android:**
    ```bash
    npx react-native run-android
    ```
-   **iOS:**
    ```bash
    npx react-native run-ios
    ```

### Clean Gradle build

To clean the Gradle build cache, navigate to the `android` directory and run:

```bash
gradlew clean
```

## Building the APK

To build a release APK:

1.  Navigate to the `android` directory:
    ```bash
    cd android
    ```
2.  Run the `assembleRelease` Gradle task:
    ```bash
    gradlew assembleRelease
    ```

### Generating separate APKs for different ABIs

To generate separate APKs for different CPU architectures, add the following to your `/android/app/build.gradle` file:

```groovy
android {
    // ...
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
    // ...
}
```

## Environment Setup

### Android SDK Configuration

Create a `local.properties` file in the `/android` directory with the path to your Android SDK:

**/android/local.properties**

```properties
# For macOS
# sdk.dir=/Users/username/Library/Android/sdk

# For Windows
sdk.dir=C:\\Users\\username\\AppData\\Local\\Android\\Sdk
```

### PowerShell Execution Policy

To allow running scripts on PowerShell, you might need to bypass the execution policy (run as Administrator):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Wireless Debugging with ADB

1.  **Get platform tools** and add them to your environment's `PATH`.
2.  List connected devices:
    ```bash
    adb devices
    ```
3.  **Enable ADB over TCP/IP on the target device:**
    ```bash
    adb tcpip 5555
    ```
4.  **Connect to your device via its IP address:**
    ```bash
    adb connect 192.168.1.5:5555
    ```
5.  **Verify connection:**
    ```bash
    adb devices
    ```

### Java Development Kit (JDK) Setup

This project requires JDK 17.

1.  **Install JDK 17.**
2.  **Set `JAVA_HOME` environment variable:**
    -   **Name:** `JAVA_HOME`
    -   **Value:** `C:\path\to\your\jdk-17` (e.g., `C:\jdk-17.0.15+6`)
3.  **Add JDK to your `Path` environment variable:**
    -   Add `%JAVA_HOME%\bin` to your `Path`.

### Required Tools

-   Android Studio
-   Android Platform Tools (for `adb`)
-   Java 17