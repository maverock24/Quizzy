import { Stack } from 'expo-router';

export default function MultiplayerLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="[code]" options={{ headerShown: false }} />
        </Stack>
    );
}
