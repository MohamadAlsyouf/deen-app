import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

const SIDEBAR_WIDTH = 300;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Buffer to skip residual audio from previous verse when seeking
// The API timestamps tend to be significantly early, so we need a larger buffer
const VERSE_START_BUFFER_MS = 700;

type VerseRangeSidebarProps = {
  visible: boolean;
  onClose: () => void;
  totalVerses: number;
  chapterId: number;
  onScrollToVerse?: (verseNumber: number) => void;
};

export const VerseRangeSidebar: React.FC<VerseRangeSidebarProps> = ({
  visible,
  onClose,
  totalVerses,
  chapterId,
  onScrollToVerse,
}) => {
  const insets = useSafeAreaInsets();
  const { 
    verseRange, 
    setVerseRange, 
    clearVerseRange, 
    loopSettings,
    setLoopSettings,
    clearLoopSettings,
    seekTo, 
    audioFile 
  } = useAudioPlayer();
  
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [loopCountInput, setLoopCountInput] = useState('');
  const [isInfiniteLoop, setIsInfiniteLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slideAnim = useState(new Animated.Value(SIDEBAR_WIDTH))[0];
  const overlayAnim = useState(new Animated.Value(0))[0];
  
  // Track which verse field was edited last (for auto-correction when start > end)
  const [lastEditedField, setLastEditedField] = useState<'start' | 'end' | null>(null);
  
  // Track which input is currently focused (for keyboard toolbar)
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | 'loop' | null>(null);
  
  // Refs for TextInputs to enable "Next" functionality
  const startInputRef = useRef<TextInput>(null);
  const endInputRef = useRef<TextInput>(null);
  const loopInputRef = useRef<TextInput>(null);

  // Auto-correct start input when it loses focus
  const handleStartBlur = () => {
    if (startInput.trim() === '') return;
    
    let value = parseInt(startInput, 10);
    if (isNaN(value) || value < 1) {
      setStartInput('1');
      value = 1;
    } else if (value > totalVerses) {
      // Cap at totalVerses
      setStartInput(totalVerses.toString());
      value = totalVerses;
    }
    
    // If start > end and start was edited last, adjust start to match end
    const endValue = endInput.trim() === '' ? null : parseInt(endInput, 10);
    if (endValue !== null && !isNaN(endValue) && value > endValue) {
      if (lastEditedField === 'start') {
        // Start was edited last, so adjust start to match end
        setStartInput(endValue.toString());
      } else {
        // End was edited first, so adjust end to match start
        setEndInput(value.toString());
      }
    }
  };

  // Auto-correct end input when it loses focus
  const handleEndBlur = () => {
    if (endInput.trim() === '') return;
    
    let value = parseInt(endInput, 10);
    if (isNaN(value) || value < 1) {
      setEndInput('1');
      value = 1;
    } else if (value > totalVerses) {
      // Cap at totalVerses
      setEndInput(totalVerses.toString());
      value = totalVerses;
    }
    
    // If start > end and end was edited last, adjust end to match start
    const startValue = startInput.trim() === '' ? null : parseInt(startInput, 10);
    if (startValue !== null && !isNaN(startValue) && startValue > value) {
      if (lastEditedField === 'end') {
        // End was edited last, so adjust end to match start
        setEndInput(startValue.toString());
      } else {
        // Start was edited first, so adjust start to match end
        setStartInput(value.toString());
      }
    }
  };

  // Handle start input change
  const handleStartChange = (text: string) => {
    setStartInput(text);
    setLastEditedField('start');
  };

  // Handle end input change
  const handleEndChange = (text: string) => {
    setEndInput(text);
    setLastEditedField('end');
  };

  // Initialize inputs from current settings
  useEffect(() => {
    if (visible) {
      setStartInput(verseRange.startVerse?.toString() ?? '');
      setEndInput(verseRange.endVerse?.toString() ?? '');
      setLoopCountInput(loopSettings.loopCount?.toString() ?? '');
      setIsInfiniteLoop(loopSettings.isInfiniteLoop);
      setError(null);
      setLastEditedField(null);
      // Animate in - both overlay and sidebar together
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, verseRange.startVerse, verseRange.endVerse, loopSettings.loopCount, loopSettings.isInfiniteLoop, slideAnim, overlayAnim]);

  const handleClose = () => {
    // Animate out - both overlay and sidebar together
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const validateAndApply = () => {
    setError(null);

    // Run blur handlers to ensure any pending corrections are applied
    handleStartBlur();
    handleEndBlur();

    const start = startInput.trim() === '' ? null : parseInt(startInput, 10);
    const end = endInput.trim() === '' ? null : parseInt(endInput, 10);
    const loopCount = loopCountInput.trim() === '' ? null : parseInt(loopCountInput, 10);

    // Loop count validation (verse range is auto-corrected)
    if (loopCount !== null && !isInfiniteLoop) {
      if (isNaN(loopCount) || loopCount < 1) {
        setError('Loop count must be at least 1');
        return;
      }
      if (loopCount > 100) {
        setError('Loop count cannot exceed 100');
        return;
      }
    }

    // Apply the verse range
    setVerseRange(start, end);

    // Apply loop settings
    if (isInfiniteLoop) {
      setLoopSettings(null, true);
    } else if (loopCount !== null && loopCount > 1) {
      setLoopSettings(loopCount, false);
    } else {
      clearLoopSettings();
    }

    // If we have a start verse, seek to it
    if (start !== null && audioFile?.verse_timings) {
      // If start verse is > 1, use timestamp_to of the PREVIOUS verse (more accurate)
      if (start > 1) {
        const prevVerseKey = `${chapterId}:${start - 1}`;
        const prevTiming = audioFile.verse_timings.find((t) => t.verse_key === prevVerseKey);
        if (prevTiming) {
          seekTo(prevTiming.timestamp_to + 250);
        }
      } else {
        // First verse - just use timestamp_from
        const verseKey = `${chapterId}:${start}`;
        const timing = audioFile.verse_timings.find((t) => t.verse_key === verseKey);
        if (timing) {
          seekTo(timing.timestamp_from);
        }
      }
    }

    // Scroll to start verse (will load more pages if needed)
    if (start !== null && start > 1 && onScrollToVerse) {
      onScrollToVerse(start);
    }

    handleClose();
  };

  const handleReset = () => {
    clearVerseRange();
    clearLoopSettings();
    setStartInput('');
    setEndInput('');
    setLoopCountInput('');
    setIsInfiniteLoop(false);
    setError(null);
    // Seek to beginning
    seekTo(0);
    handleClose();
  };

  const hasRange = verseRange.startVerse !== null || verseRange.endVerse !== null;
  const hasLooping = loopSettings.isInfiniteLoop || (loopSettings.loopCount !== null && loopSettings.loopCount > 1);
  const hasCustomSettings = hasRange || hasLooping;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        {/* Animated Overlay */}
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Playback Settings</Text>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Current Settings Display */}
            {hasCustomSettings && (
              <View style={styles.currentSettings}>
                <Ionicons name="settings" size={18} color={colors.primary} />
                <View style={styles.currentSettingsContent}>
                  {hasRange && (
                    <Text style={styles.currentSettingsText}>
                      Verses {verseRange.startVerse ?? 1} - {verseRange.endVerse ?? totalVerses}
                    </Text>
                  )}
                  {hasLooping && (
                    <Text style={styles.currentSettingsText}>
                      {loopSettings.isInfiniteLoop 
                        ? '∞ Infinite loop' 
                        : `🔁 Loop ${loopSettings.loopCount}x (${loopSettings.currentIteration}/${loopSettings.loopCount})`}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Verse Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verse Range</Text>
              <Text style={styles.sectionDescription}>
                Select start and end verses to play a portion of the chapter.
              </Text>

              <View style={styles.inputsContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Start</Text>
                  <TextInput
                    ref={startInputRef}
                    style={styles.input}
                    placeholder={`1`}
                    placeholderTextColor={colors.text.disabled}
                    value={startInput}
                    onChangeText={handleStartChange}
                    onBlur={() => {
                      handleStartBlur();
                      setFocusedInput(null);
                    }}
                    onFocus={() => setFocusedInput('start')}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                <View style={styles.inputDivider}>
                  <Text style={styles.toText}>to</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>End</Text>
                  <TextInput
                    ref={endInputRef}
                    style={styles.input}
                    placeholder={`${totalVerses}`}
                    placeholderTextColor={colors.text.disabled}
                    value={endInput}
                    onChangeText={handleEndChange}
                    onBlur={() => {
                      handleEndBlur();
                      setFocusedInput(null);
                    }}
                    onFocus={() => setFocusedInput('end')}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <Text style={styles.hint}>
                This chapter has {totalVerses} verses
              </Text>
            </View>

            {/* Loop Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Looping</Text>
              <Text style={styles.sectionDescription}>
                Repeat the recitation multiple times or continuously.
              </Text>

              {/* Infinite Loop Toggle */}
              <View style={[styles.toggleRow, isInfiniteLoop && styles.toggleRowActive]}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="infinite" size={20} color={isInfiniteLoop ? colors.primary : colors.text.secondary} />
                  <Text style={[styles.toggleLabel, isInfiniteLoop && styles.toggleLabelActive]}>Loop infinitely</Text>
                </View>
                <Switch
                  value={isInfiniteLoop}
                  onValueChange={(value) => {
                    setIsInfiniteLoop(value);
                    if (value) {
                      setLoopCountInput('');
                    }
                  }}
                  trackColor={{ false: '#B0B0B0', true: colors.primaryLight }}
                  thumbColor={isInfiniteLoop ? colors.primary : '#FFFFFF'}
                  ios_backgroundColor="#B0B0B0"
                />
              </View>

              {/* Loop Count Input */}
              {!isInfiniteLoop && (
                <View style={styles.loopCountContainer}>
                  <Text style={styles.label}>Number of loops</Text>
                  <View style={styles.loopCountInputRow}>
                    <TextInput
                      ref={loopInputRef}
                      style={[styles.input, styles.loopCountInput]}
                      placeholder="1"
                      placeholderTextColor={colors.text.disabled}
                      value={loopCountInput}
                      onChangeText={setLoopCountInput}
                      onFocus={() => setFocusedInput('loop')}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={styles.loopCountHint}>
                      {loopCountInput && parseInt(loopCountInput, 10) > 1
                        ? `Will play ${loopCountInput} times`
                        : 'Leave empty for no loop'}
                    </Text>
                  </View>
                </View>
              )}

              {isInfiniteLoop && (
                <Text style={styles.infiniteHint}>
                  Playback will continue until you pause, exit the page, or reset settings.
                </Text>
              )}
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={validateAndApply}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={20} color={colors.text.white} />
                <Text style={styles.applyButtonText}>Apply Settings</Text>
              </TouchableOpacity>

              {hasCustomSettings && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.resetButtonText}>Reset All Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Keyboard Toolbar - simple Done button */}
          {focusedInput !== null && (
            <View style={styles.keyboardToolbar}>
              <TouchableOpacity
                style={styles.keyboardToolbarDoneButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setFocusedInput(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.keyboardToolbarDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.background,
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  currentSettings: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  currentSettingsContent: {
    flex: 1,
  },
  currentSettingsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  inputsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    color: colors.text.primary,
    textAlign: 'center',
    fontSize: 18,
  },
  inputDivider: {
    paddingBottom: spacing.md,
  },
  toText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRowActive: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.primary,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  loopCountContainer: {
    marginTop: spacing.sm,
  },
  loopCountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loopCountInput: {
    width: 80,
    flex: 0,
  },
  loopCountHint: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  infiniteHint: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  buttonsContainer: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.small,
  },
  applyButtonText: {
    ...typography.button,
    color: colors.text.white,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  // Keyboard toolbar styles - simple Done button
  keyboardToolbar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardToolbarDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardToolbarDoneText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
