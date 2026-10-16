import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useApp, Label } from './UI';
// Sample IDs deliberately remain enabled in installable testing builds.
// Replace with publisher IDs and configure UMP before a Play Store release.
export function AdBanner() {
  const { colors } = useApp();
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        // Only sample IDs are enabled. Publisher IDs require UMP consent.
        await mobileAds().initialize();
        if (active) setReady(true);
      } catch {
        if (active) setFailed(true);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 54,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingVertical: 2,
      }}
    >
      {ready && !failed ? (
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => setFailed(true)}
        />
      ) : (
        <Label size={11} muted>
          {failed ? 'Advertisement unavailable' : 'Advertisement'}
        </Label>
      )}
    </View>
  );
}
