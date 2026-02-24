import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { Header } from '@/components';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type FieldConfig = {
  key: string;
  label: string;
  icon: IoniconName;
  value: string;
  editable: boolean;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, deleteAccount } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const saveBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const parts = (user?.displayName || '').split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
  }, [user?.displayName]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, avatarScale]);

  useEffect(() => {
    const parts = (user?.displayName || '').split(' ');
    const origFirst = parts[0] || '';
    const origLast = parts.slice(1).join(' ') || '';
    const changed = firstName.trim() !== origFirst || lastName.trim() !== origLast;
    setHasChanges(changed);

    Animated.timing(saveBarAnim, {
      toValue: changed ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [firstName, lastName, user?.displayName, saveBarAnim]);

  const handleSave = async () => {
    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      Alert.alert('Required', 'First name cannot be empty.');
      return;
    }
    const fullName = lastName.trim() ? `${trimmedFirst} ${lastName.trim()}` : trimmedFirst;

    setSaving(true);
    try {
      await updateProfile({ displayName: fullName });
      Alert.alert('Saved', 'Your profile has been updated.');
      setHasChanges(false);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings to change your profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      const photoURL = await authService.uploadProfilePhoto(result.assets[0].uri);
      await updateProfile({ photoURL });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [updateProfile]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Please enter your password to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async (password) => {
                    if (!password?.trim()) {
                      Alert.alert('Error', 'Password is required.');
                      return;
                    }
                    setDeleting(true);
                    try {
                      await deleteAccount(password.trim());
                    } catch (error: any) {
                      setDeleting(false);
                      const msg = error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential'
                        ? 'Incorrect password. Please try again.'
                        : error?.message || 'Failed to delete account.';
                      Alert.alert('Error', msg);
                    }
                  },
                },
              ],
              'secure-text',
            );
          },
        },
      ],
    );
  }, [deleteAccount]);

  const displayName = user?.displayName || 'Muslim User';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const fields: FieldConfig[] = [
    {
      key: 'firstName',
      label: 'First Name',
      icon: 'person-outline',
      value: firstName,
      editable: true,
      placeholder: 'Enter your first name',
      autoCapitalize: 'words',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      icon: 'people-outline',
      value: lastName,
      editable: true,
      placeholder: 'Enter your last name',
      autoCapitalize: 'words',
    },
    {
      key: 'email',
      label: 'Email',
      icon: 'mail-outline',
      value: user?.email || '',
      editable: false,
      placeholder: '',
      keyboardType: 'email-address',
    },
    {
      key: 'uid',
      label: 'User ID',
      icon: 'finger-print-outline',
      value: user?.uid || '',
      editable: false,
      placeholder: '',
    },
  ];

  const handleFieldChange = (key: string, value: string) => {
    if (key === 'firstName') setFirstName(value);
    if (key === 'lastName') setLastName(value);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, colors.secondaryLight]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Header
          title="My Profile"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          dark
        />

        <Animated.View style={[styles.avatarSection, { opacity: fadeAnim, transform: [{ scale: avatarScale }] }]}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.text.white} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.editPhotoBtn}
              onPress={handlePickPhoto}
              activeOpacity={0.8}
              disabled={uploadingPhoto}
            >
              <Ionicons name="pencil" size={14} color={colors.text.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{displayName}</Text>
          {user?.email && <Text style={styles.avatarEmail}>{user.email}</Text>}
          {memberSince ? (
            <View style={styles.memberRow}>
              <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.memberText}>Member since {memberSince}</Text>
            </View>
          ) : null}
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.sectionLabel}>Personal Information</Text>

            {fields.map(field => (
              <View key={field.key} style={styles.fieldCard}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name={field.icon} size={16} color={colors.primary} />
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  {!field.editable && (
                    <View style={styles.readOnlyBadge}>
                      <Ionicons name="lock-closed" size={10} color={colors.text.tertiary} />
                    </View>
                  )}
                </View>
                {field.editable ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={field.value}
                    onChangeText={v => handleFieldChange(field.key, v)}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.text.disabled}
                    autoCapitalize={field.autoCapitalize || 'none'}
                    keyboardType={field.keyboardType || 'default'}
                  />
                ) : (
                  <Text style={styles.fieldValueReadonly} numberOfLines={1}>
                    {field.value || '—'}
                  </Text>
                )}
              </View>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Account</Text>

            <View style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.fieldLabel}>Account Status</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            <View style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="key-outline" size={16} color={colors.primary} />
                <Text style={styles.fieldLabel}>Authentication</Text>
              </View>
              <Text style={styles.fieldValueReadonly}>Email & Password</Text>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Danger Zone</Text>

            <TouchableOpacity
              style={styles.deleteCard}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <View style={styles.deleteTextWrap}>
                <Text style={styles.deleteTitle}>Delete Account</Text>
                <Text style={styles.deleteSub}>Permanently remove your account and all data</Text>
              </View>
              {deleting ? (
                <ActivityIndicator color={colors.error} size="small" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.error} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        <Animated.View
          style={[
            styles.saveBar,
            {
              opacity: saveBarAnim,
              transform: [{ translateY: saveBarAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
          pointerEvents={hasChanges ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator color={colors.text.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.text.white} />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  avatarWrapper: {
    marginBottom: spacing.sm,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  avatarPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text.white,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 2,
  },
  avatarEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
    flex: 1,
  },
  readOnlyBadge: {
    padding: 2,
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldValueReadonly: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.success,
  },
  deleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  deleteTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  deleteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  deleteSub: {
    ...typography.caption,
    color: colors.error,
    opacity: 0.7,
    marginTop: 1,
  },
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
  },
});
