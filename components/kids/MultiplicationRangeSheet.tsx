import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import {
  MAX_MULTIPLICATION_FACTOR,
  setRangeBound,
} from '@/services/multiplicationProblems';
import { DEFAULT_ROUND_MINUTES } from '@/services/timedRound';
import type { RoundMode } from '@/services/timedRound';

export type MultiplicationRoundSelection = {
  from: number;
  to: number;
  mode: RoundMode;
  minutes: number;
};

type MultiplicationRangeSheetProps = {
  initialFrom: number;
  initialTo: number;
  onCancel: () => void;
  onConfirm: (selection: MultiplicationRoundSelection) => void;
};

const FACTOR_ITEMS = Array.from(
  { length: MAX_MULTIPLICATION_FACTOR },
  (_, index) => (
    <Picker.Item key={index + 1} label={String(index + 1)} value={index + 1} />
  ),
);

const DURATION_MINUTES = [1, 2, 3, 5, 10];

const MODE_OPTIONS: { mode: RoundMode; labelKey: string }[] = [
  { mode: 'count', labelKey: 'multiplication_mode_count' },
  { mode: 'timed', labelKey: 'multiplication_mode_timed' },
];

export const MultiplicationRangeSheet: React.FC<
  MultiplicationRangeSheetProps
> = ({ initialFrom, initialTo, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  // The sheet is mounted per open, so the draft starts from the committed range.
  const [draft, setDraft] = useState<MultiplicationRoundSelection>({
    from: initialFrom,
    to: initialTo,
    mode: 'count',
    minutes: DEFAULT_ROUND_MINUTES,
  });

  // The web picker emits strings (e.target.value), so both handlers accept
  // number | string and let setRangeBound do the coercion. setRangeBound returns
  // a fresh { from, to }, so the spread keeps mode and minutes alive.
  const handleFromChange = (value: number | string) => {
    setDraft((prev) => ({ ...prev, ...setRangeBound(prev, 'from', value) }));
  };

  const handleToChange = (value: number | string) => {
    setDraft((prev) => ({ ...prev, ...setRangeBound(prev, 'to', value) }));
  };

  const handleMinutesChange = (value: number | string) => {
    setDraft((prev) => ({ ...prev, minutes: Number(value) }));
  };

  const durationItems = DURATION_MINUTES.map((minutes) => (
    <Picker.Item
      key={minutes}
      label={`${minutes} ${t('minutes')}`}
      value={minutes}
    />
  ));

  const renderPicker = (
    value: number,
    onChange: (next: number | string) => void,
    items = FACTOR_ITEMS,
  ) => (
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={styles.picker}
        dropdownIconColor="black"
      >
        {items}
      </Picker>
    </View>
  );

  return (
    <Modal transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('multiplication_quiz_name')}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('multiplication_mode')}</Text>
            <View style={styles.modeOptions}>
              {MODE_OPTIONS.map(({ mode, labelKey }) => {
                const selected = draft.mode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setDraft((prev) => ({ ...prev, mode }))}
                    style={[
                      styles.button,
                      styles.modeOption,
                      !selected && styles.modeOptionInactive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        !selected && styles.modeTextInactive,
                      ]}
                    >
                      {t(labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {draft.mode === 'timed' && (
            <View style={styles.row}>
              <Text style={styles.label}>{t('multiplication_duration')}</Text>
              {renderPicker(draft.minutes, handleMinutesChange, durationItems)}
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>{t('multiplication_range_from')}</Text>
            {renderPicker(draft.from, handleFromChange)}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('multiplication_range_to')}</Text>
            {renderPicker(draft.to, handleToChange)}
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={styles.button}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>{t('cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm({ ...draft })}
              style={styles.button}
              accessibilityRole="button"
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
  modeOptions: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  modeOption: {
    flex: 1,
    marginVertical: 0,
    borderWidth: 2,
    borderColor: 'rgb(86, 92, 99)',
  },
  modeOptionInactive: {
    backgroundColor: 'white',
  },
  modeTextInactive: {
    color: 'rgb(86, 92, 99)',
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
