Create project ------- npx @react-native-community/cli init first App


//////////////////////////////////////////////////////////////




npx react-native start --reset-cache



//////////////////////////////////////////////////////////////

npx react-native start --reset-cache
npx react-native run-android  # For Android
npx react-native run-ios      # For iOS (if applicable)


//////////////////////////////////////////////////////////////


gradlew clean 

//////////////////////////////////////////////////////////////



Run Project -----  npx react-native run-android  or    npx react-native start

//////////////////////////////////////////////////////////////


buid apk  --- cd /android ----  gradlew assembleRelease


////////////////////////////////////////////////////////

Create Local properties /android/local.properties

sdk.dir=/Users/username/Library/Android/sdk  # macOS

sdk.dir=C:\\Users\\username\\AppData\\Local\\Android\\Sdk  


////////////////////////////////////////////////////////

for deperate apk put /android/app/buid.gradle

 android{

     splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
}

////////////////////////////////////////////////////////

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass #Bypass Powershell as admin

///////////////////////////////////////////////////////





///// Clear cache and sesssion data /////////////

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

useEffect(() => {
  const clearStorage = async () => {
    await AsyncStorage.clear();
    console.log('AsyncStorage cleared!');
  };

  clearStorage();
}, []);


///////////////////////////////////////////////////////


///////////////////////////////////////////////////////


Installation
Get platform tools

Add to env

adb devices

adb tcpip 5555

adb connect 192.168.1.5:5555

adb devices

Get JAVA 17

add as system environment

name = JAVA_HOME , value = C:\jdk-17.0.15+6

Set path environment
%JAVA_HOME%\bin

Install Android Studio

Set sdk location on android/local.properties

sdk.dir=C:\Users\vishn\AppData\Local\Android\Sdk