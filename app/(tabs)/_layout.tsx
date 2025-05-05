import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Easing, ImageBackground, Pressable, StyleSheet } from 'react-native';

import { useQuiz } from '@/components/Quizprovider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return (
    <FontAwesome
      size={35}
      style={{ marginBottom: -15, marginRight: -10 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const image = require('../../assets/images/stars.jpeg');
  const colorScheme = useColorScheme();
  const { selectedQuizName } = useQuiz();

  const pathName = usePathname();
  const isSettings = pathName === '/';

  return (
    <ImageBackground
      source={image}
      resizeMode="cover"
      style={styles.imageContainer}
    >
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
            height: 85,
            backgroundColor: '#000',
          },
          tabBarLabelStyle: {
            marginTop: 10,
            marginRight: -10,
            padding: 0,
            fontSize: 16,
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
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
          }}
        />
      </Tabs>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
