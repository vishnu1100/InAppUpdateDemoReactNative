import React, { useEffect } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const UPDATE_URL = 'https://raw.githubusercontent.com/<your-username>/<repo-name>/main/version.json';

const LandingPage = () => {

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
        Alert.alert(
          "Update Available",
          latest.notes || "A new version is available. Update now?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Update",
              onPress: () => Linking.openURL(latest.apkUrl)
            }
          ]
        );
      }
    } catch (error) {
      console.log("Update check failed:", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'  }}>
      <Text style ={{color: 'white'}} >Welcome to the version 1 !</Text>
    </View>
  );
};

export default LandingPage;
