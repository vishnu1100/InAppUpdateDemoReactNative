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

const UPDATE_URL =
  'https://reactnativeappupdates.web.app/version.json';

const LandingPage = () => {
  const [downloadProgress, setDownloadProgress] = useState(null);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const response = await fetch(UPDATE_URL);
      const latest = await response.json();

      const currentBuild = parseInt(DeviceInfo.getBuildNumber());
      const latestBuild = parseInt(latest.build);

      if (latestBuild > currentBuild) {
        Alert.alert('Update Available', latest.notes || 'Download now?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Update', onPress: () => handleDownload(latest.apkUrl) },
        ]);
      }
    } catch (error) {
      console.log('Update check failed:', error);
    }
  };

  const handleDownload = async (apkUrl) => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Cannot download without storage permission');
          return;
        }
      }

      const { dirs } = RNFetchBlob.fs;
      const apkPath = `${dirs.DownloadDir}/update.apk`;

      RNFetchBlob.config({
        fileCache: true,
        appendExt: 'apk',
        path: apkPath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: 'Downloading update...',
          description: 'App update is being downloaded',
          path: apkPath,
        },
      })
        .fetch('GET', apkUrl)
        .progress((received, total) => {
          setDownloadProgress((received / total) * 100);
        })
        .then((res) => {
          setDownloadProgress(null);
          installAPK(res.path());
        });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const installAPK = (apkPath) => {
    RNFetchBlob.android.actionViewIntent(apkPath, 'application/vnd.android.package-archive');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
      <Text style={{ color: 'white', fontSize: 16 }}>Welcome to version 1!</Text>
      {downloadProgress !== null && (
        <>
          <Text style={{ color: 'white', marginTop: 20 }}>
            Downloading: {downloadProgress.toFixed(0)}%
          </Text>
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={downloadProgress / 100}
            style={{ width: 200 }}
          />
        </>
      )}
    </View>
  );
};

export default LandingPage;
