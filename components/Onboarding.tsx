/**
 * Onboarding Component
 * Shows on first app launch to collect user name and language preference
 */
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingProps {
    onComplete: (name: string, language: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const { t, i18n } = useTranslation();
    const [name, setName] = useState('');
    const [language, setLanguage] = useState(i18n.language || 'en');
    const [step, setStep] = useState(1);

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    const handleContinue = () => {
        if (step === 1) {
            setStep(2);
        } else {
            if (name.trim()) {
                onComplete(name.trim(), language);
            }
        }
    };

    const isNextDisabled = step === 2 && !name.trim();

    return (
        <LinearGradient
            colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Logo / Icon */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>📚</Text>
                    <Text style={styles.title}>Quizzy</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? t('welcome_message', 'Welcome! Let\'s get started.') : t('almost_there', 'Almost there!')}
                    </Text>
                </View>

                {step === 1 ? (
                    /* Step 1: Language Selection */
                    <View style={styles.stepContainer}>
                        <Text style={styles.questionText}>{t('select_language', 'Select your language')}</Text>

                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={language}
                                onValueChange={handleLanguageChange}
                                style={styles.picker}
                                dropdownIconColor="white"
                                itemStyle={styles.pickerItem}
                            >
                                <Picker.Item label="🇬🇧 English" value="en" />
                                <Picker.Item label="🇩🇪 Deutsch" value="de" />
                                <Picker.Item label="🇫🇮 Suomi" value="fi" />
                            </Picker>
                        </View>

                        <Text style={styles.helperText}>
                            {t('language_helper', 'You can change this later in settings')}
                        </Text>
                    </View>
                ) : (
                    /* Step 2: Name Input */
                    <View style={styles.stepContainer}>
                        <Text style={styles.questionText}>{t('whats_your_name', 'What\'s your name?')}</Text>

                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('enter_name', 'Enter your name')}
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            autoCapitalize="words"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleContinue}
                        />

                        <Text style={styles.helperText}>
                            {t('name_helper', 'This helps personalize your experience')}
                        </Text>
                    </View>
                )}

                {/* Progress Dots */}
                <View style={styles.progressDots}>
                    <View style={[styles.dot, step >= 1 && styles.dotActive]} />
                    <View style={[styles.dot, step >= 2 && styles.dotActive]} />
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[styles.button, isNextDisabled && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={isNextDisabled}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {step === 1 ? t('continue', 'Continue') : t('start_learning', 'Start Learning')}
                    </Text>
                    <Text style={styles.buttonArrow}>→</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    stepContainer: {
        width: '100%',
        maxWidth: 350,
        alignItems: 'center',
    },
    questionText: {
        fontSize: 22,
        fontWeight: '600',
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
    },
    pickerContainer: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        height: 60,
        color: 'white',
    },
    pickerItem: {
        color: 'white',
        fontSize: 18,
    },
    input: {
        width: '100%',
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    helperText: {
        marginTop: 12,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
    },
    progressDots: {
        flexDirection: 'row',
        marginTop: 40,
        marginBottom: 30,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: '#4ECDC4',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4ECDC4',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        minWidth: 200,
    },
    buttonDisabled: {
        backgroundColor: 'rgba(78, 205, 196, 0.4)',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    },
    buttonArrow: {
        fontSize: 22,
        color: 'white',
        marginLeft: 10,
    },
});

export default Onboarding;
