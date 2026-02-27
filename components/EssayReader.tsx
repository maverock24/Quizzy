import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CategoryEssay } from './types';

type EssayReaderProps = {
    essay: CategoryEssay;
    onBack: () => void;
    onStartQuiz?: () => void;
};

// Static image registry — React Native requires compile-time paths for require()
const essayImages: Record<string, any> = {
    'cloud_pizza_model.png': require('../assets/essay_images/cloud_pizza_model.png'),
    'aws_regions_azs.png': require('../assets/essay_images/aws_regions_azs.png'),
    'compute_ec2_lambda.png': require('../assets/essay_images/compute_ec2_lambda.png'),
    'storage_s3_tiers.png': require('../assets/essay_images/storage_s3_tiers.png'),
    'vpc_networking.png': require('../assets/essay_images/vpc_networking.png'),
    'iam_security.png': require('../assets/essay_images/iam_security.png'),
    'cdk_constructs.png': require('../assets/essay_images/cdk_constructs.png'),
    'monitoring_trio.png': require('../assets/essay_images/monitoring_trio.png'),
};

export const EssayReader: React.FC<EssayReaderProps> = ({
    essay,
    onBack,
    onStartQuiz,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="white" />
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.headerBadge}>
                    <Ionicons name="book-outline" size={16} color="#4FC3F7" />
                    <Text style={styles.headerBadgeText}>Study Material</Text>
                </View>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.categoryLabel}>{essay.category}</Text>
                <Text style={styles.title}>{essay.title}</Text>
                <Text style={styles.sectionCount}>
                    {essay.sections.length} sections
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                {essay.sections.map((section, index) => (
                    <View key={index} style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionNumberBadge}>
                                <Text style={styles.sectionNumber}>{index + 1}</Text>
                            </View>
                            <Text style={styles.sectionHeading}>{section.heading}</Text>
                        </View>
                        {section.image && essayImages[section.image] && (
                            <Image
                                source={essayImages[section.image]}
                                style={styles.sectionImage}
                                resizeMode="contain"
                            />
                        )}
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                {/* Start Quiz CTA */}
                {onStartQuiz && (
                    <View style={styles.ctaContainer}>
                        <Text style={styles.ctaText}>
                            Ready to test your knowledge?
                        </Text>
                        <TouchableOpacity
                            style={styles.startQuizButton}
                            onPress={onStartQuiz}
                        >
                            <Ionicons name="play-circle" size={22} color="white" />
                            <Text style={styles.startQuizButtonText}>Start Quiz</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom spacing */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: 'rgba(255, 255, 255, 0.15)',
        borderBottomWidth: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(79, 195, 247, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    headerBadgeText: {
        color: '#4FC3F7',
        fontSize: 13,
        fontWeight: '600',
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomWidth: 1,
    },
    categoryLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginBottom: 4,
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 28,
        marginBottom: 6,
    },
    sectionCount: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 12,
    },
    sectionContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    sectionNumberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(79, 195, 247, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionNumber: {
        color: '#4FC3F7',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sectionHeading: {
        color: '#4FC3F7',
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
    },
    sectionImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    sectionContent: {
        color: 'rgba(255, 255, 255, 0.88)',
        fontSize: 15,
        lineHeight: 24,
    },
    ctaContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    ctaText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        marginBottom: 14,
    },
    startQuizButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 10,
    },
    startQuizButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    bottomSpacer: {
        height: 40,
    },
});
