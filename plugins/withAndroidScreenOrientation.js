const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to mark screen orientation features as optional on Android.
 * This resolves Google Play Console pre-launch warning:
 * "Required hardware feature declarations are restricting your app's availability:
 * android.hardware.screen.portrait affects Phone, Tablet, Desktop, and Android XR users.
 * To expand your app's availability, mark non-essential hardware features as optional in your app's manifest."
 */
const withAndroidScreenOrientation = (config) => {
  return withAndroidManifest(config, async (modConfig) => {
    const androidManifest = modConfig.modResults.manifest;

    if (!Array.isArray(androidManifest['uses-feature'])) {
      androidManifest['uses-feature'] = [];
    }

    const targetFeatures = [
      'android.hardware.screen.portrait',
      'android.hardware.screen.landscape',
    ];

    for (const featureName of targetFeatures) {
      const existing = androidManifest['uses-feature'].find(
        (f) => f.$ && f.$['android:name'] === featureName
      );

      if (existing) {
        existing.$['android:required'] = 'false';
      } else {
        androidManifest['uses-feature'].push({
          $: {
            'android:name': featureName,
            'android:required': 'false',
          },
        });
      }
    }

    return modConfig;
  });
};

module.exports = withAndroidScreenOrientation;
