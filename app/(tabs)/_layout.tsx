import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Easing, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return (
    <FontAwesome
      size={30}
      style={{ marginBottom: -15, marginRight: -10 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const image = require('../../assets/images/stars.jpeg');
  const colorScheme = useColorScheme();

  const pathName = usePathname();
  const isSettings = pathName === '/';

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 20000,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.imageContainer}>
      <Animated.Image
        source={image}
        resizeMode="cover"
        style={[
          styles.backgroundImage,
          animatedStyle,
        ]}
      />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarLabelPosition: 'below-icon',
          animation: 'shift',
          transitionSpec: {
            animation: 'timing',
            config: { easing: Easing.linear },
          },
          headerShown: false,
          tabBarStyle: {
            height: 70,
            backgroundColor: '#000',
          },
          tabBarLabelStyle: {
            marginTop: 5,
            marginRight: -10,
            padding: 0,
            fontSize: 14,
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Quiz',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color={Colors[colorScheme ?? 'light'].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: 'Learn',
            tabBarIcon: ({ color }) => <TabBarIcon name="graduation-cap" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black', // fallback
  },
  backgroundImage: {
    position: 'absolute',
    left: '-10%',
    top: '-10%',
    width: '120%',
    height: '120%',
  },
});
