import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  REPORT_ABUSE_CATEGORIES,
  type ReportAbuseCategory,
  type ReportAbuseFieldErrors,
} from '../../types/settings';
import SettingsModalShell from './SettingsModalShell';

type Props = {
  visible: boolean;
  category: ReportAbuseCategory;
  description: string;
  onChangeCategory: (value: ReportAbuseCategory) => void;
  onChangeDescription: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  fieldErrors?: ReportAbuseFieldErrors;
};

const CATEGORY_LABELS: Record<ReportAbuseCategory, string> = {
  spam: 'Spam',
  hate: 'Odio',
  violence: 'Violencia',
  nudity: 'Nudez',
  other: 'Outro',
};

export default function SettingsReportAbuseModal({
  visible,
  category,
  description,
  onChangeCategory,
  onChangeDescription,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage = null,
  successMessage = null,
  fieldErrors = {},
}: Props) {
  const { isDark } = useTheme();
  const textColor = isDark ? '#f5fbf6' : '#171d1a';
  const subTextColor = isDark ? '#bccac2' : '#56645e';
  const inputBackground = isDark ? '#232323' : '#eaefea';

  return (
    <SettingsModalShell visible={visible} onClose={onCancel} title="Denunciar abuso">
      <View>
        <Text style={[styles.title, { color: textColor }]}>
          DENUNCIAR ABUSO
        </Text>

        <Text style={[styles.label, { color: subTextColor }]}>CATEGORIA</Text>
        <View style={styles.categoryGrid}>
          {REPORT_ABUSE_CATEGORIES.map((option) => {
            const selected = option === category;

            return (
              <Pressable
                key={option}
                testID={`settings-report-abuse-category-${option}`}
                accessibilityLabel={`Categoria ${CATEGORY_LABELS[option]}`}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => onChangeCategory(option)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selected ? '#527B5D' : inputBackground,
                    borderColor: selected
                      ? '#527B5D'
                      : isDark
                        ? '#333735'
                        : '#d7ddd9',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selected ? '#ffffff' : textColor },
                  ]}
                >
                  {CATEGORY_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.category ? (
          <Text testID="settings-report-abuse-category-error" style={styles.fieldErrorText}>
            {fieldErrors.category}
          </Text>
        ) : null}

        <Text style={[styles.label, styles.descriptionLabel, { color: subTextColor }]}>
          DESCRICAO
        </Text>
        <TextInput
          testID="settings-report-abuse-description-input"
          accessibilityLabel="Descricao da denuncia"
          value={description}
          onChangeText={onChangeDescription}
          placeholder="Conte o que aconteceu"
          multiline
          textAlignVertical="top"
          editable={!isSubmitting}
          style={[
            styles.descriptionInput,
            {
              backgroundColor: inputBackground,
              color: textColor,
            },
          ]}
          placeholderTextColor={isDark ? '#aabbb3' : '#56645e'}
        />
        {fieldErrors.description ? (
          <Text testID="settings-report-abuse-description-error" style={styles.fieldErrorText}>
            {fieldErrors.description}
          </Text>
        ) : null}

        {successMessage ? (
          <Text testID="settings-report-abuse-success" style={styles.successText}>
            {successMessage}
          </Text>
        ) : null}

        {errorMessage ? (
          <Text testID="settings-report-abuse-error" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Enviar denuncia"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            isSubmitting && styles.primaryButtonDisabled,
          ]}
          onPress={onSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator
              testID="settings-report-abuse-loading"
              color="#ffffff"
            />
          ) : (
            <Text style={styles.primaryText}>ENVIAR DENUNCIA</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Voltar para suporte"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
            isSubmitting && styles.secondaryButtonDisabled,
          ]}
        >
          <Text style={[styles.secondaryText, { color: subTextColor }]}>
            VOLTAR
          </Text>
        </Pressable>
      </View>
    </SettingsModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  descriptionLabel: {
    marginTop: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '900',
  },
  descriptionInput: {
    minHeight: 112,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  fieldErrorText: {
    marginTop: 7,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  successText: {
    marginTop: 12,
    color: '#059669',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 12,
    color: '#D70015',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#527B5D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.68,
  },
  primaryButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
});
