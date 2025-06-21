/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Text,
  View,
  ProgressBarAndroid,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFetchBlob from 'rn-fetch-blob';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { openFile } from 'react-native-openanything';

const UPDATE_URL = `https://reactnativeappupdates.web.app/version.json?t=${new Date().getTime()}`;


const LandingPage = () => {
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);

  useEffect(() => {
    getCurrentVersion();
    checkForUpdate();
  }, []);

  const getCurrentVersion = async () => {
    try {
      const version = DeviceInfo.getVersion();
      const buildNumber = DeviceInfo.getBuildNumber();
      setCurrentVersion({ version, buildNumber });
    } catch (error) {
      console.error('Failed to get version info:', error);
    }
  };

  const checkForUpdate = async () => {
    try {
      setIsChecking(true);
      setError(null);
      
      console.log('Checking for updates...');
      const response = await fetch(UPDATE_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const latest = await response.json();
      console.log('Latest version info:', latest);

      const currentBuild = parseInt(DeviceInfo.getBuildNumber());
      const currentVersion = DeviceInfo.getVersion();
      const latestBuild = parseInt(latest.build);
      const latestVersion = latest.version || latest.versionName;
      
      console.log(`Current: v${currentVersion} (${currentBuild}), Latest: v${latestVersion} (${latestBuild})`);

      // Check if there's a newer version (either version name or build number)
      let updateAvailable = false;
      let updateReason = '';

      if (latestVersion && currentVersion !== latestVersion) {
        // Compare version names (e.g., "1.0" vs "1.1")
        const currentVersionParts = currentVersion.split('.').map(Number);
        const latestVersionParts = latestVersion.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentVersionParts.length, latestVersionParts.length); i++) {
          const current = currentVersionParts[i] || 0;
          const latest = latestVersionParts[i] || 0;
          
          if (latest > current) {
            updateAvailable = true;
            updateReason = `New version available: v${currentVersion} → v${latestVersion}`;
            break;
          } else if (latest < current) {
            break;
          }
        }
      }

      // If version names are the same, check build numbers
      if (!updateAvailable && latestBuild > currentBuild) {
        updateAvailable = true;
        updateReason = `New build available: ${currentBuild} → ${latestBuild}`;
      }

      if (updateAvailable) {
        Alert.alert(
          'Update Available', 
          `${updateReason}\n\n${latest.notes || 'Download now?'}`, 
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Update', onPress: () => handleDownload(latest.apkUrl) },
          ]
        );
      } else {
        console.log('App is up to date');
        Alert.alert('Up to Date', 'You have the latest version installed.');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setError(`Update check failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const androidVersion = Platform.Version;
      
      if (androidVersion >= 30) {
        // Android 11+ doesn't need WRITE_EXTERNAL_STORAGE for app-specific directories
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to download updates',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission request failed:', err);
      return false;
    }
  };

  const handleDownload = async (apkUrl) => {
    try {
      setError(null);
      
      if (!apkUrl) {
        throw new Error('Download URL is not available');
      }

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot download without storage permission');
        return;
      }

      console.log('Starting download from:', apkUrl);
      
      const { dirs } = RNFetchBlob.fs;
      const apkPath = `${dirs.DownloadDir}/update_${Date.now()}.apk`;

      const config = {
        fileCache: true,
        appendExt: 'apk',
        path: apkPath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: 'Downloading App Update',
          description: 'App update is being downloaded',
          path: apkPath,
          mime: 'application/vnd.android.package-archive',
        },
      };

      console.log('Download config:', config);

      RNFetchBlob.config(config)
        .fetch('GET', apkUrl)
        .progress((received, total) => {
          const progress = (received / total) * 100;
          console.log(`Download progress: ${progress.toFixed(1)}%`);
          setDownloadProgress(progress);
        })
        .then((res) => {
          console.log('Download completed, file path:', res.path());
          setDownloadProgress(null);
          installAPK(res.path());
        })
        .catch((downloadError) => {
          console.error('Download failed:', downloadError);
          setDownloadProgress(null);
          setError(`Download failed: ${downloadError.message}`);
          Alert.alert('Download Failed', 'Failed to download the update. Please try again.');
        });
    } catch (error) {
      console.error('Download setup failed:', error);
      setError(`Download setup failed: ${error.message}`);
      Alert.alert('Error', `Failed to start download: ${error.message}`);
    }
  };

  const installAPK = (apkPath) => {
    try {
      console.log('Installing APK from:', apkPath);
      
      if (Platform.OS === 'android') {
        RNFetchBlob.android.actionViewIntent(apkPath, 'application/vnd.android.package-archive');
      } else {
        // For iOS, you would handle differently
        console.log('Installation not supported on iOS');
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setError(`Installation failed: ${error.message}`);
      Alert.alert('Installation Failed', 'Failed to install the update. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
      <Text style={{ color: 'white', fontSize: 16 }}>Welcome to version 1!</Text>
      
      {currentVersion && (
        <Text style={{ color: 'white', fontSize: 14, marginTop: 10 }}>
          Version: {currentVersion.version} (Build {currentVersion.buildNumber})
        </Text>
      )}
      
      {isChecking && (
        <Text style={{ color: 'white', marginTop: 20 }}>
          Checking for updates...
        </Text>
      )}
      
      {error && (
        <Text style={{ color: 'red', marginTop: 20, textAlign: 'center', paddingHorizontal: 20 }}>
          {error}
        </Text>
      )}
      
      {downloadProgress !== null && (
        <>
          <Text style={{ color: 'white', marginTop: 20 }}>
            Downloading: {downloadProgress.toFixed(0)}%
          </Text>
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={downloadProgress / 100}
            style={{ width: 200, marginTop: 10 }}
          />
        </>
      )}
      
      <Text 
        style={{ color: 'blue', marginTop: 30, textDecorationLine: 'underline' }}
        onPress={checkForUpdate}
      >
        Check for Updates
      </Text>
    </View>
  );
};

export default LandingPage;
