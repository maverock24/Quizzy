/**
 * Profile Tab
 * Shows user's gamification stats, achievements, and progress
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { GamificationStats } from '@/components/gamification';

export default function ProfileScreen() {
    return (
        <View style={styles.outerContainer}>
            <SafeAreaLinearGradient
                colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                style={styles.safeArea}
            >
                <GamificationStats />
            </SafeAreaLinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    safeArea: {
        flex: 1,
        maxWidth: 550,
        width: '100%',
        borderLeftColor: 'rgb(129, 129, 129)',
        borderRightColor: 'rgb(141, 141, 141)',
        borderTopColor: 'rgb(26, 26, 26)',
        borderBottomColor: 'rgb(26, 26, 26)',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
});
