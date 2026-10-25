import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { MAX_MULTIPLICATION_FACTOR } from '@/services/multiplicationProblems';

type MultiplicationRangeSheetProps = {
  visible: boolean;
  initialFrom: number;
  initialTo: number;
  onCancel: () => void;
  onConfirm: (from: number, to: number) => void;
};

const FACTOR_ITEMS = Array.from(
  { length: MAX_MULTIPLICATION_FACTOR },
  (_, index) => index + 1,
).map((factor) => (
  <Picker.Item key={factor} label={String(factor)} value={factor} />
));

export const MultiplicationRangeSheet: React.FC<
  MultiplicationRangeSheetProps
> = ({ visible, initialFrom, initialTo, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({ from: initialFrom, to: initialTo });

  // Reseed on open so a cancelled pick never rewrites the committed range.
  useEffect(() => {
    if (visible) {
      setDraft({ from: initialFrom, to: initialTo });
    }
  }, [visible, initialFrom, initialTo]);

  const handleFromChange = (from: number) => {
    setDraft((prev) =>
      from > prev.to ? { from, to: from } : { ...prev, from },
    );
  };

  const handleToChange = (to: number) => {
    setDraft((prev) => (to < prev.from ? { from: to, to } : { ...prev, to }));
  };

  const renderPicker = (value: number, onChange: (next: number) => void) => (
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={styles.picker}
        dropdownIconColor="black"
      >
        {FACTOR_ITEMS}
      </Picker>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('multiplication_quiz_name')}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('multiplication_range_from')}</Text>
            {renderPicker(draft.from, handleFromChange)}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('multiplication_range_to')}</Text>
            {renderPicker(draft.to, handleToChange)}
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.button}>
              <Text style={styles.buttonText}>{t('cancel', 'Abbrechen')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(draft.from, draft.to)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {t('multiplication_range_start')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: 'black',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    flex: 1,
    color: 'black',
    fontSize: 16,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  picker: {
    height: 40,
    color: 'black',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: 'rgb(86, 92, 99)',
    padding: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
