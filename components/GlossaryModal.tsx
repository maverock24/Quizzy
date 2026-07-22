import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlossary, GlossaryEntry } from './GlossaryProvider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GlossaryModal: React.FC = () => {
  const {
    selectedTerm,
    setSelectedTerm,
    isModalVisible,
    setModalVisible,
    searchQuery,
    setSearchQuery,
    searchTerms,
  } = useGlossary();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const filteredTerms = searchTerms(searchQuery);

  // Handle Android hardware back button + browser back on web
  useEffect(() => {
    if (Platform.OS === 'web' && isModalVisible) {
      // Push a history state so browser back closes the modal
      window.history.pushState({ glossaryModal: true }, '', window.location.href);
      const handlePopState = (e: PopStateEvent) => {
        if (e.state?.glossaryModal) {
          // Going back from glossary state
          handleClose();
        }
        // If no glossary state, browser already navigated back — let it be
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // Clean up the history state we pushed if modal is still open
        if (window.history.state?.glossaryModal) {
          window.history.back();
        }
      };
    }
    if (Platform.OS !== 'web' && isModalVisible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true; // Prevent default behavior
      });
      return () => backHandler.remove();
    }
  }, [isModalVisible, selectedTerm]);

  useEffect(() => {
    if (isModalVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Focus search input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [isModalVisible]);

  const handleClose = useCallback(() => {
    if (selectedTerm) {
      // If viewing a specific term, go back to list
      setSelectedTerm(null);
      setSearchQuery('');
    } else {
      // Clean up web history state before closing
      if (Platform.OS === 'web' && window.history.state?.glossaryModal) {
        window.history.back();
      }
      setModalVisible(false);
      setSearchQuery('');
    }
  }, [selectedTerm, setSelectedTerm, setModalVisible, setSearchQuery]);

  const handleTermPress = (entry: GlossaryEntry) => {
    setSelectedTerm(entry);
    setSearchQuery('');
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (selectedTerm) {
      setSelectedTerm(null);
    }
  };

  const renderTermItem = ({ item }: { item: GlossaryEntry }) => (
    <TouchableOpacity
      style={styles.termItem}
      onPress={() => handleTermPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.termItemContent}>
        <Text style={styles.termItemTitle}>{item.term}</Text>
        <Text style={styles.termItemPreview} numberOfLines={2}>
          {item.definition}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );

  const renderSelectedTerm = () => {
    if (!selectedTerm) return null;

    return (
      <View style={styles.selectedTermContainer}>
        <View style={styles.selectedTermHeader}>
          <Text style={styles.selectedTermTitle}>{selectedTerm.term}</Text>
        </View>
        <View style={styles.selectedTermDivider} />
        <Text style={styles.selectedTermDefinition}>{selectedTerm.definition}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop — closes modal when tapped */}
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
        />
        {/* Content — doesn't propagate to backdrop */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable onPress={() => {}} style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerHandle} />
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Ionicons
                  name={selectedTerm ? 'arrow-back' : 'close'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {selectedTerm ? 'Definition' : 'AI/ML Glossary'}
              </Text>
              <View style={styles.headerButton} />
            </View>

            {/* Search Bar */}
            {!selectedTerm && (
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color="rgba(255,255,255,0.5)"
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  placeholder="Search terms..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Content */}
          {selectedTerm ? (
            renderSelectedTerm()
          ) : (
            <FlatList
              data={filteredTerms}
              keyExtractor={(item) => item.term}
              renderItem={renderTermItem}
              style={styles.termList}
              contentContainerStyle={styles.termListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? 'No matching terms found'
                      : `${filteredTerms.length} terms available`}
                  </Text>
                </View>
              }
            />
          )}

          {/* Floating search button when viewing a term */}
          {selectedTerm && (
            <TouchableOpacity
              style={styles.floatingSearchButton}
              onPress={() => {
                setSelectedTerm(null);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              <Ionicons name="search" size={22} color="white" />
            </TouchableOpacity>
          )}
          </KeyboardAvoidingView>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: 'rgb(26, 35, 48)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  termList: {
    flex: 1,
  },
  termListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  termItemContent: {
    flex: 1,
    marginRight: 8,
  },
  termItemTitle: {
    color: 'rgb(100, 200, 255)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  termItemPreview: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    lineHeight: 18,
  },
  selectedTermContainer: {
    flex: 1,
    padding: 20,
  },
  selectedTermHeader: {
    marginBottom: 16,
  },
  selectedTermTitle: {
    color: 'rgb(100, 200, 255)',
    fontSize: 24,
    fontWeight: '700',
  },
  selectedTermDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  selectedTermDefinition: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    lineHeight: 26,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  floatingSearchButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgb(46, 150, 194)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
