/**
 * WebProfileContent - Web version of the profile screen
 * Profile info, photo upload, name editing, account deletion
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { useWebHover } from "@/hooks/useWebHover";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";

type FieldConfig = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  editable: boolean;
  placeholder: string;
};

type DeleteModalState = "closed" | "confirm" | "password";

export const WebProfileContent: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState>("closed");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const parts = (user?.displayName || "").split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
  }, [user?.displayName]);

  useEffect(() => {
    const parts = (user?.displayName || "").split(" ");
    const origFirst = parts[0] || "";
    const origLast = parts.slice(1).join(" ") || "";
    setHasChanges(
      firstName.trim() !== origFirst || lastName.trim() !== origLast
    );
  }, [firstName, lastName, user?.displayName]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = setTimeout(() => setSaveMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const handleSave = async () => {
    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      setSaveMessage({ type: "error", text: "First name cannot be empty." });
      return;
    }
    const fullName = lastName.trim()
      ? `${trimmedFirst} ${lastName.trim()}`
      : trimmedFirst;

    setSaving(true);
    try {
      await updateProfile({ displayName: fullName });
      setSaveMessage({ type: "success", text: "Profile updated successfully." });
      setHasChanges(false);
    } catch (error: any) {
      setSaveMessage({
        type: "error",
        text: error?.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePickPhoto = useCallback(() => {
    if (typeof document === "undefined") return;

    let input = fileInputRef.current;
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      document.body.appendChild(input);
      (fileInputRef as React.MutableRefObject<HTMLInputElement>).current = input;
    }

    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setUploadingPhoto(true);
      try {
        const uri = URL.createObjectURL(file);
        const photoURL = await authService.uploadProfilePhoto(uri);
        await updateProfile({ photoURL });
        URL.revokeObjectURL(uri);
        setSaveMessage({
          type: "success",
          text: "Profile photo updated successfully.",
        });
      } catch (error: any) {
        setSaveMessage({
          type: "error",
          text: error?.message || "Failed to upload photo.",
        });
      } finally {
        setUploadingPhoto(false);
        if (input) input.value = "";
      }
    };

    input.click();
  }, [updateProfile]);

  const handleDeleteAccount = useCallback(async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Password is required.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(deletePassword.trim());
    } catch (error: any) {
      setDeleting(false);
      const msg =
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/invalid-credential"
          ? "Incorrect password. Please try again."
          : error?.message || "Failed to delete account.";
      setDeleteError(msg);
    }
  }, [deleteAccount, deletePassword]);

  const handleCloseDeleteModal = () => {
    setDeleteModal("closed");
    setDeletePassword("");
    setDeleteError("");
    setDeleting(false);
  };

  const displayName = user?.displayName || "Muslim User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  const fields: FieldConfig[] = [
    {
      key: "firstName",
      label: "First Name",
      icon: "person-outline",
      value: firstName,
      editable: true,
      placeholder: "Enter your first name",
    },
    {
      key: "lastName",
      label: "Last Name",
      icon: "people-outline",
      value: lastName,
      editable: true,
      placeholder: "Enter your last name",
    },
    {
      key: "email",
      label: "Email",
      icon: "mail-outline",
      value: user?.email || "",
      editable: false,
      placeholder: "",
    },
    {
      key: "uid",
      label: "User ID",
      icon: "finger-print-outline",
      value: user?.uid || "",
      editable: false,
      placeholder: "",
    },
  ];

  const handleFieldChange = (key: string, value: string) => {
    if (key === "firstName") setFirstName(value);
    if (key === "lastName") setLastName(value);
  };

  const saveHover = useWebHover({
    hoverStyle: { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(27, 67, 50, 0.3)" },
    transition: "all 0.2s ease-out",
  });

  const photoHover = useWebHover({
    hoverStyle: { transform: "scale(1.05)", boxShadow: "0 12px 40px rgba(27, 67, 50, 0.2)" },
    transition: "all 0.3s ease-out",
  });

  const deleteHover = useWebHover({
    hoverStyle: { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(198, 40, 40, 0.15)" },
    transition: "all 0.2s ease-out",
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerGradientWrap}>
          <LinearGradient
            colors={["#0D2818", "#1B4332", "#2D6A4F"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerPattern} />
          <View style={styles.headerContent}>
            <View style={styles.headerTextArea}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <Text style={styles.headerSubtitle}>
                Manage your personal information and account settings
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Profile Card with Avatar */}
      <View style={styles.profileCard}>
        <View style={styles.avatarArea}>
          <TouchableOpacity
            onPress={handlePickPhoto}
            activeOpacity={0.9}
            disabled={uploadingPhoto}
            // @ts-ignore
            onMouseEnter={photoHover.handlers.onMouseEnter}
            onMouseLeave={photoHover.handlers.onMouseLeave}
            style={[styles.avatarRing, photoHover.style]}
          >
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
            <View style={styles.editPhotoBadge}>
              <Ionicons name="camera" size={14} color={colors.text.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{displayName}</Text>
            {user?.email && (
              <Text style={styles.avatarEmail}>{user.email}</Text>
            )}
            {memberSince ? (
              <View style={styles.memberRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.text.tertiary}
                />
                <Text style={styles.memberText}>
                  Member since {memberSince}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Save Message Toast */}
      {saveMessage && (
        <View
          style={[
            styles.toast,
            saveMessage.type === "success"
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <Ionicons
            name={
              saveMessage.type === "success"
                ? "checkmark-circle"
                : "alert-circle"
            }
            size={18}
            color={
              saveMessage.type === "success" ? colors.success : colors.error
            }
          />
          <Text
            style={[
              styles.toastText,
              {
                color:
                  saveMessage.type === "success" ? colors.success : colors.error,
              },
            ]}
          >
            {saveMessage.text}
          </Text>
        </View>
      )}

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.fieldsGrid}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldCard}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons
                    name={field.icon}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {!field.editable && (
                  <View style={styles.readOnlyBadge}>
                    <Ionicons
                      name="lock-closed"
                      size={11}
                      color={colors.text.tertiary}
                    />
                    <Text style={styles.readOnlyText}>Read only</Text>
                  </View>
                )}
              </View>
              {field.editable ? (
                <TextInput
                  style={styles.fieldInput}
                  value={field.value}
                  onChangeText={(v) => handleFieldChange(field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.text.disabled}
                  // @ts-ignore
                  autoCapitalize="words"
                />
              ) : (
                <Text style={styles.fieldValueReadonly} numberOfLines={1}>
                  {field.value || "\u2014"}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.9}
            disabled={saving}
            // @ts-ignore
            onMouseEnter={saveHover.handlers.onMouseEnter}
            onMouseLeave={saveHover.handlers.onMouseLeave}
            style={[styles.saveButton, saveHover.style]}
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
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.text.white}
                  />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.fieldsGrid}>
          <View style={styles.fieldCard}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.fieldLabel}>Account Status</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons
                  name="key-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.fieldLabel}>Authentication</Text>
            </View>
            <Text style={styles.fieldValueReadonly}>Email & Password</Text>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleDanger}>Danger Zone</Text>
        <TouchableOpacity
          onPress={() => setDeleteModal("confirm")}
          activeOpacity={0.9}
          // @ts-ignore
          onMouseEnter={deleteHover.handlers.onMouseEnter}
          onMouseLeave={deleteHover.handlers.onMouseLeave}
          style={[styles.deleteCard, deleteHover.style]}
        >
          <View style={styles.deleteIconWrap}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </View>
          <View style={styles.deleteTextWrap}>
            <Text style={styles.deleteTitle}>Delete Account</Text>
            <Text style={styles.deleteSub}>
              Permanently remove your account and all data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Delete Account Modal Overlay */}
      {deleteModal !== "closed" && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseDeleteModal}
          />
          <View style={styles.modalCard}>
            {deleteModal === "confirm" ? (
              <>
                <View style={styles.modalIconWrap}>
                  <Ionicons
                    name="warning-outline"
                    size={32}
                    color={colors.error}
                  />
                </View>
                <Text style={styles.modalTitle}>Delete Account?</Text>
                <Text style={styles.modalDescription}>
                  Are you sure you want to permanently delete your account? This
                  action cannot be undone and all your data will be lost.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={handleCloseDeleteModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => setDeleteModal("password")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalDeleteText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalIconWrap}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={32}
                    color={colors.error}
                  />
                </View>
                <Text style={styles.modalTitle}>Confirm Deletion</Text>
                <Text style={styles.modalDescription}>
                  Please enter your password to confirm account deletion.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.text.disabled}
                  secureTextEntry
                  autoFocus
                />
                {deleteError ? (
                  <View style={styles.modalErrorRow}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                    <Text style={styles.modalErrorText}>{deleteError}</Text>
                  </View>
                ) : null}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={handleCloseDeleteModal}
                    activeOpacity={0.8}
                    disabled={deleting}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalDeleteBtn,
                      deleting && styles.modalBtnDisabled,
                    ]}
                    onPress={handleDeleteAccount}
                    activeOpacity={0.8}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator
                        color={colors.text.white}
                        size="small"
                      />
                    ) : (
                      <Text style={styles.modalDeleteText}>Delete Forever</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 60,
  },
  headerSection: {
    marginBottom: 32,
  },
  headerGradientWrap: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    // @ts-ignore
    boxShadow: "0 16px 48px rgba(27, 67, 50, 0.2)",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='none' stroke='%23D4A373' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: "80px 80px",
  },
  headerContent: {
    padding: 48,
    paddingVertical: 40,
  },
  headerTextArea: {
    maxWidth: 600,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: colors.text.white,
    letterSpacing: -0.5,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
    // @ts-ignore
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
  },
  avatarArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: `${colors.primary}30`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    // @ts-ignore
    cursor: "pointer",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 55,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  editPhotoBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  avatarEmail: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberText: {
    fontSize: 13,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  toastSuccess: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  toastError: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "500",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  sectionTitleDanger: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.error,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  fieldCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    flex: 1,
    // @ts-ignore
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  fieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    flex: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  readOnlyText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: "500",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    outlineColor: colors.primary,
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s ease",
  },
  fieldValueReadonly: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    paddingVertical: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 20,
    alignSelf: "flex-start",
    // @ts-ignore
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(27, 67, 50, 0.2)",
  },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 10,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  deleteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
    // @ts-ignore
    cursor: "pointer",
  },
  deleteIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.error}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  deleteTextWrap: {
    flex: 1,
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.error,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  deleteSub: {
    fontSize: 13,
    color: colors.error,
    opacity: 0.7,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  modalOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    // @ts-ignore
    backdropFilter: "blur(4px)",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 40,
    width: 440,
    maxWidth: "90%",
    alignItems: "center",
    // @ts-ignore
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.2)",
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  modalDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  modalInput: {
    width: "100%",
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    // @ts-ignore
    outlineColor: colors.error,
    fontFamily: "'DM Sans', sans-serif",
  },
  modalErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  modalErrorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: "500",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    // @ts-ignore
    cursor: "pointer",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.error,
    alignItems: "center",
    // @ts-ignore
    cursor: "pointer",
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },
  modalDeleteText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  spacer: {
    height: 40,
  },
});
