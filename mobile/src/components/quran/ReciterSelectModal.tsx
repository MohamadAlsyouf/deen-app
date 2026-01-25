import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import type { NormalizedReciter } from '@/types/quran';

type ReciterSelectModalProps = {
  visible: boolean;
  onClose: () => void;
};

type ReciterItemProps = {
  reciter: NormalizedReciter;
  isSelected: boolean;
  onPress: () => void;
};

const ReciterItem: React.FC<ReciterItemProps> = ({
  reciter,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.reciterItem, isSelected && styles.reciterItemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.reciterContent}>
        <Text style={[styles.reciterName, isSelected && styles.reciterNameSelected]}>
          {reciter.name}
        </Text>
        {reciter.arabic_name && (
          <Text style={styles.reciterArabicName}>{reciter.arabic_name}</Text>
        )}
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
};

export const ReciterSelectModal: React.FC<ReciterSelectModalProps> = ({
  visible,
  onClose,
}) => {
  const { reciters, selectedReciter, isLoadingReciters, selectReciter } =
    useAudioPlayer();

  const handleSelectReciter = useCallback(
    (reciter: NormalizedReciter) => {
      selectReciter(reciter);
      onClose();
    },
    [selectReciter, onClose]
  );

  const renderReciter = useCallback(
    ({ item }: { item: NormalizedReciter }) => (
      <ReciterItem
        reciter={item}
        isSelected={selectedReciter?.id === item.id}
        onPress={() => handleSelectReciter(item)}
      />
    ),
    [selectedReciter, handleSelectReciter]
  );

  const keyExtractor = useCallback(
    (item: NormalizedReciter) => item.id.toString(),
    []
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Reciter</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoadingReciters ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading reciters…</Text>
            </View>
          ) : (
            <FlatList
              data={reciters}
              renderItem={renderReciter}
              keyExtractor={keyExtractor}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    minHeight: '50%',
    maxHeight: '70%',
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reciterItemSelected: {
    backgroundColor: colors.surface,
  },
  reciterContent: {
    flex: 1,
  },
  reciterName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  reciterNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  reciterArabicName: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'left',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});

