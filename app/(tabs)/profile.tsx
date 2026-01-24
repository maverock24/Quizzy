/**
 * Profile Tab
 * Shows user's gamification stats, achievements, progress, and learning to-dos
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { GamificationStats } from '@/components/gamification';
import { LearningTodos } from '@/components/LearningTodos';
import { useQuiz } from '@/components/Quizprovider';
import { useTranslation } from 'react-i18next';

type TabType = 'stats' | 'todos';

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { userName } = useQuiz();
    const [activeTab, setActiveTab] = useState<TabType>('stats');

    return (
        <View style={styles.outerContainer}>
            <SafeAreaLinearGradient
                colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                style={styles.safeArea}
            >
                <View style={styles.container}>
                    {/* User greeting */}
                    {userName && (
                        <Text style={styles.greeting}>
                            {t('hello', 'Hello')}, {userName}! 👋
                        </Text>
                    )}

                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
                            onPress={() => setActiveTab('stats')}
                        >
                            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
                                📊 {t('stats', 'Stats')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'todos' && styles.activeTab]}
                            onPress={() => setActiveTab('todos')}
                        >
                            <Text style={[styles.tabText, activeTab === 'todos' && styles.activeTabText]}>
                                📚 {t('learning', 'Learning')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab Content */}
                    <View style={styles.content}>
                        {activeTab === 'stats' && <GamificationStats />}
                        {activeTab === 'todos' && <LearningTodos />}
                    </View>
                </View>
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
    container: {
        flex: 1,
        padding: 16,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: 'rgba(78, 205, 196, 0.3)',
    },
    tabText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    activeTabText: {
        color: 'white',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
});
