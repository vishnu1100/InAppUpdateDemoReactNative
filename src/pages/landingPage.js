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
    const initializeApp = async () => {
      try {
        await getCurrentVersion();
        await checkForUpdate();
      } catch (error) {
        console.error('App initialization failed:', error);
        setError('Failed to initialize app');
      }
    };
    
    initializeApp();
  }, []);

  const getCurrentVersion = async () => {
    try {
      const version = await DeviceInfo.getVersion();
      const buildNumber = await DeviceInfo.getBuildNumber();
      setCurrentVersion({ version, buildNumber });
    } catch (error) {
      console.error('Failed to get version info:', error);
      setCurrentVersion({ version: 'Unknown', buildNumber: 'Unknown' });
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

      if (!latest || typeof latest !== 'object') {
        throw new Error('Invalid response format');
      }

      const currentBuild = parseInt(await DeviceInfo.getBuildNumber()) || 0;
      const currentVersion = await DeviceInfo.getVersion() || '0.0';
      const latestBuild = parseInt(latest.build) || 0;
      const latestVersion = latest.version || latest.versionName || '0.0';
      
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

      if (updateAvailable && latest.apkUrl) {
        Alert.alert(
          'Update Available', 
          `${updateReason}\n\n${latest.notes || 'Download now?'}`, 
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Update', onPress: () => handleDownload(latest.apkUrl) },
          ]
        );
      } else if (updateAvailable) {
        setError('Update available but download URL is missing');
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
      
      if (!apkUrl || typeof apkUrl !== 'string') {
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
        // Remove addAndroidDownloads when not using download manager
        // addAndroidDownloads: {
        //   useDownloadManager: false,
        //   notification: false,
        //   title: 'Downloading App Update',
        //   description: 'App update is being downloaded',
        //   path: apkPath,
        //   mime: 'application/vnd.android.package-archive',
        // },
      };

      console.log('Download config:', config);

      const downloadTask = RNFetchBlob.config(config)
        .fetch('GET', apkUrl)
        .progress((received, total) => {
          if (received && total && total > 0) {
            const progress = (received / total) * 100;
            console.log(`Download progress: ${progress.toFixed(1)}% (${received}/${total} bytes)`);
            setDownloadProgress(progress);
          }
        })
        .then((res) => {
          console.log('Download completed, file path:', res.path());
          console.log('Response type:', typeof res);
          console.log('Response keys:', Object.keys(res));
          setDownloadProgress(null);
          
          Alert.alert(
            'Download Complete',
            'Update has been downloaded successfully. Would you like to install it now?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Install', onPress: () => installAPK(res.path()) },
            ]
          );
        })
        .catch((downloadError) => {
          console.error('Download failed:', downloadError);
          console.error('Error details:', JSON.stringify(downloadError, null, 2));
          setDownloadProgress(null);
          setError(`Download failed: ${downloadError.message}`);
          Alert.alert('Download Failed', 'Failed to download the update. Please try again.');
        });

      console.log('Download task started');
    } catch (error) {
      console.error('Download setup failed:', error);
      setError(`Download setup failed: ${error.message}`);
      Alert.alert('Error', `Failed to start download: ${error.message}`);
    }
  };

  const installAPK = async (apkPath) => {
    try {
      console.log('Installing APK from:', apkPath);
      
      if (Platform.OS === 'android') {
        // Check if we have permission to install APKs
        const hasInstallPermission = await checkInstallPermission();
        
        if (!hasInstallPermission) {
          Alert.alert(
            'Installation Permission Required',
            'Please enable "Install unknown apps" permission for this app in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openAppSettings() },
            ]
          );
          return;
        }

        // Install the APK
        RNFetchBlob.android.actionViewIntent(apkPath, 'application/vnd.android.package-archive');
      } else {
        // For iOS, you would handle differently
        console.log('Installation not supported on iOS');
        Alert.alert('Not Supported', 'Automatic installation is not supported on iOS.');
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setError(`Installation failed: ${error.message}`);
      Alert.alert('Installation Failed', 'Failed to install the update. Please try again.');
    }
  };

  const checkInstallPermission = async () => {
    if (Platform.OS !== 'android') return true;
    
    try {
      // For Android 8.0+ (API 26+), we need to check if we can install unknown apps
      if (Platform.Version >= 26) {
        // This is a simplified check - in practice, you might need to use
        // react-native-permissions to check for REQUEST_INSTALL_PACKAGES permission
        return true; // We'll let the system handle the permission request
      }
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  const openAppSettings = () => {
    // This would typically open the app's settings page
    // You might need to use a library like react-native-app-settings
    Alert.alert(
      'Manual Settings Required',
      'Please go to Settings > Apps > [Your App] > Install unknown apps and enable it.'
    );
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
          <View style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            padding: 20, 
            borderRadius: 10, 
            marginTop: 20,
            width: 300,
            alignItems: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>
              Downloading Update...
            </Text>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              {downloadProgress.toFixed(0)}%
            </Text>
            <ProgressBarAndroid
              styleAttr="Horizontal"
              indeterminate={false}
              progress={downloadProgress / 100}
              style={{ width: 250, height: 8 }}
              color="#4CAF50"
            />
            <Text style={{ color: 'white', fontSize: 12, marginTop: 10, opacity: 0.8 }}>
              Please don't close the app
            </Text>
          </View>
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
