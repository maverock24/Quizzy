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
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const image = require('../../assets/images/stars.jpg');
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
        screenOptions={{
          animation: 'shift',
          transitionSpec: {
            animation: 'timing',
            config: { easing: Easing.linear },
          },
          //show selected quiz name in the header if route is not settings

          // to prevent a hydration error in React Navigation v6.
          headerShown: false,
          headerStyle: {
            backgroundColor: '#000',
            borderBottomColor: 'white',
            borderWidth: 1,
          },
          headerTitleStyle: {
            color: 'white',
          },
          tabBarStyle: {
            backgroundColor: '#000',
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
