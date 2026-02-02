import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';

// Import learning components
import SRSDailyWarmup from '@/components/learning/SRSDailyWarmup';
import CodeTracing from '@/components/learning/CodeTracing';
import ParsonsProblems from '@/components/learning/ParsonsProblems';
import FadedExamples from '@/components/learning/FadedExamples';
import DebuggingExercise from '@/components/learning/DebuggingExercise';

type LearningMode =
    | 'menu'
    | 'daily-warmup'
    | 'code-tracing'
    | 'parsons'
    | 'faded-examples'
    | 'debugging';

interface LearningOption {
    id: LearningMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    tier: 1 | 2;
}

export default function LearnScreen() {
    const { t } = useTranslation();
    const [currentMode, setCurrentMode] = useState<LearningMode>('menu');

    const learningOptions: LearningOption[] = [
        {
            id: 'daily-warmup',
            title: 'Daily Warmup',
            description: 'Spaced repetition practice on questions you\'ve answered before',
            icon: <Ionicons name="flash" size={32} color="#4FC3F7" />,
            color: '#4FC3F7',
            tier: 1,
        },
        {
            id: 'code-tracing',
            title: 'Mental Compiler',
            description: 'Predict code output to build your mental execution model',
            icon: <MaterialCommunityIcons name="brain" size={32} color="#9C27B0" />,
            color: '#9C27B0',
            tier: 1,
        },
        {
            id: 'parsons',
            title: 'Parsons Problems',
            description: 'Arrange scrambled code lines into the correct order',
            icon: <MaterialCommunityIcons name="puzzle" size={32} color="#FF9800" />,
            color: '#FF9800',
            tier: 1,
        },
        {
            id: 'faded-examples',
            title: 'Scaffolded Learning',
            description: 'Study complete examples, then fill in progressively more blanks',
            icon: <Ionicons name="school" size={32} color="#00BCD4" />,
            color: '#00BCD4',
            tier: 2,
        },
        {
            id: 'debugging',
            title: 'Bug Hunter',
            description: 'Find the bug in seemingly correct code',
            icon: <FontAwesome5 name="bug" size={28} color="#f44336" />,
            color: '#f44336',
            tier: 2,
        },
    ];

    const tier1Options = learningOptions.filter(o => o.tier === 1);
    const tier2Options = learningOptions.filter(o => o.tier === 2);

    const handleBack = () => {
        setCurrentMode('menu');
    };

    // Render learning mode component
    if (currentMode !== 'menu') {
        return (
            <View style={styles.outerContainer}>
                <SafeAreaLinearGradient
                    colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                    style={styles.safeArea}
                >
                    {currentMode === 'daily-warmup' && <SRSDailyWarmup onBack={handleBack} />}
                    {currentMode === 'code-tracing' && <CodeTracing onBack={handleBack} />}
                    {currentMode === 'parsons' && <ParsonsProblems onBack={handleBack} />}
                    {currentMode === 'faded-examples' && <FadedExamples onBack={handleBack} />}
                    {currentMode === 'debugging' && <DebuggingExercise onBack={handleBack} />}
                </SafeAreaLinearGradient>
            </View>
        );
    }

    // Render menu
    return (
        <View style={styles.outerContainer}>
            <SafeAreaLinearGradient
                colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                style={styles.safeArea}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>🧠 Enhanced Learning</Text>
                        <Text style={styles.headerSubtitle}>
                            Science-backed methods for maximum retention
                        </Text>
                    </View>

                    {/* Tier 1 Section */}
                    <View style={styles.tierSection}>
                        <View style={styles.tierHeader}>
                            <View style={styles.tierBadge}>
                                <Text style={styles.tierBadgeText}>TIER 1</Text>
                            </View>
                            <Text style={styles.tierTitle}>High Efficiency</Text>
                        </View>
                        <Text style={styles.tierDescription}>
                            Low cognitive load, high learning ROI
                        </Text>

                        <View style={styles.optionsGrid}>
                            {tier1Options.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.optionCard, { borderColor: option.color + '40' }]}
                                    onPress={() => setCurrentMode(option.id)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                                        {option.icon}
                                    </View>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Tier 2 Section */}
                    <View style={styles.tierSection}>
                        <View style={styles.tierHeader}>
                            <View style={[styles.tierBadge, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
                                <Text style={[styles.tierBadgeText, { color: '#CE93D8' }]}>TIER 2</Text>
                            </View>
                            <Text style={styles.tierTitle}>Deep Learning</Text>
                        </View>
                        <Text style={styles.tierDescription}>
                            For mastering patterns after grasping basics
                        </Text>

                        <View style={styles.optionsGrid}>
                            {tier2Options.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.optionCard, { borderColor: option.color + '40' }]}
                                    onPress={() => setCurrentMode(option.id)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                                        {option.icon}
                                    </View>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Info Section */}
                    <View style={styles.infoSection}>
                        <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.infoText}>
                            Daily Warmup adapts to your quiz performance using spaced repetition.
                            The more you practice, the smarter it gets!
                        </Text>
                    </View>
                </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 28,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
    },
    tierSection: {
        marginBottom: 28,
    },
    tierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    tierBadge: {
        backgroundColor: 'rgba(79, 195, 247, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 10,
    },
    tierBadgeText: {
        color: '#4FC3F7',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    tierTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    tierDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 16,
        marginLeft: 2,
    },
    optionsGrid: {
        gap: 12,
    },
    optionCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 6,
    },
    optionDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 20,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 19,
    },
});
