import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { type MobileProposalInput } from '@/api/proposals';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hapticFeedback } from '@/utils/haptics';

export interface ProposalSheetProps {
  visible: boolean;
  postId: string;
  budgetMax?: number;
  hasApplied: boolean;
  isProvider: boolean;
  submitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: MobileProposalInput) => void;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProposalSheetModalContent({
  budgetMax,
  hasApplied,
  isProvider,
  submitting,
  error,
  onClose,
  onSubmit,
}: ProposalSheetProps) {
  const theme = useTheme();

  const [price, setPrice] = React.useState('');
  const [days, setDays] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleSubmit = () => {
    setValidationError(null);

    if (!isProvider) {
      setValidationError('Chỉ tài khoản Đối tác được gửi báo giá');
      void hapticFeedback.error();
      return;
    }

    if (hasApplied) {
      setValidationError('Bạn đã gửi đề xuất cho bài đăng này');
      void hapticFeedback.error();
      return;
    }

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      setValidationError('Giá báo phải lớn hơn 0');
      void hapticFeedback.error();
      return;
    }

    if (budgetMax !== undefined && budgetMax > 0 && numPrice > budgetMax) {
      setValidationError(`Giá báo không được vượt quá ngân sách tối đa (${formatVND(budgetMax)})`);
      void hapticFeedback.error();
      return;
    }

    const numDays = Number(days);
    if (!days || isNaN(numDays) || !Number.isInteger(numDays) || numDays < 1) {
      setValidationError('Thời gian thực hiện tối thiểu 1 ngày (số nguyên)');
      void hapticFeedback.error();
      return;
    }

    if (!message || message.trim().length < 20) {
      setValidationError('Lời nhắn và giải pháp phải có tối thiểu 20 ký tự');
      void hapticFeedback.error();
      return;
    }

    onSubmit({
      price: numPrice,
      estimatedDays: numDays,
      message: message.trim(),
    });
  };

  const activeError = validationError || error;

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <ThemedText style={styles.headerTitle}>Gửi báo giá & đề xuất</ThemedText>
              {budgetMax !== undefined && budgetMax > 0 && (
                <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]}>
                  Ngân sách tối đa của khách: {formatVND(budgetMax)}
                </ThemedText>
              )}
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Đóng biểu mẫu đề xuất"
              accessibilityHint="Đóng cửa sổ báo giá và quay lại màn hình chi tiết"
              style={styles.closeBtn}
              onPress={onClose}
            >
              <ThemedText style={[styles.closeBtnText, { color: theme.textSecondary }]}>
                ✕
              </ThemedText>
            </PressableScale>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error banner */}
            {activeError && (
              <View
                style={styles.errorBanner}
                accessibilityRole="alert"
                accessibilityLabel={activeError}
              >
                <ThemedText style={styles.errorBannerText}>{activeError}</ThemedText>
              </View>
            )}

            {/* Non-provider notice */}
            {!isProvider && (
              <View
                style={styles.warningBox}
                accessibilityRole="alert"
              >
                <ThemedText style={styles.warningText}>
                  ⚠️ Bạn đang đăng nhập bằng tài khoản Khách hàng. Chỉ tài khoản Đối tác (Provider) mới có quyền nộp báo giá.
                </ThemedText>
              </View>
            )}

            {/* Has applied notice */}
            {hasApplied && (
              <View
                style={styles.infoBox}
                accessibilityRole="alert"
              >
                <ThemedText style={styles.infoText}>
                  ✓ Bạn đã gửi đề xuất cho bài đăng này. Không thể gửi thêm đề xuất mới.
                </ThemedText>
              </View>
            )}

            {/* Field: Price */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>Giá đề xuất (VNĐ) *</ThemedText>
              <TextInput
                accessible={true}
                accessibilityLabel="Giá đề xuất bằng Việt Nam Đồng"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Ví dụ: 1000000"
                placeholderTextColor={theme.textSecondary}
                editable={!hasApplied && isProvider && !submitting}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Field: Estimated Days */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>Thời gian hoàn thành (ngày) *</ThemedText>
              <TextInput
                accessible={true}
                accessibilityLabel="Thời gian hoàn thành tính theo ngày"
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
                placeholder="Ví dụ: 3"
                placeholderTextColor={theme.textSecondary}
                editable={!hasApplied && isProvider && !submitting}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Field: Cover Letter / Message */}
            <View style={styles.field}>
              <ThemedText style={styles.label}>Lời nhắn & Cam kết (tối thiểu 20 ký tự) *</ThemedText>
              <TextInput
                accessible={true}
                accessibilityLabel="Lời nhắn và cam kết giải pháp"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholder="Mô tả kỹ năng, giải pháp và kế hoạch thực hiện của bạn..."
                placeholderTextColor={theme.textSecondary}
                editable={!hasApplied && isProvider && !submitting}
                style={[
                  styles.textarea,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
              <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
                {message.trim().length}/20 ký tự
              </ThemedText>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Hủy bỏ"
              accessibilityHint="Đóng biểu mẫu đề xuất"
              style={[
                styles.cancelBtn,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              onPress={onClose}
              disabled={submitting}
            >
              <ThemedText style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                Hủy bỏ
              </ThemedText>
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={submitting ? 'Đang gửi đề xuất' : hasApplied ? 'Đã gửi đề xuất' : 'Gửi đề xuất'}
              accessibilityHint="Xác nhận nộp báo giá đề xuất cho khách hàng"
              style={[
                styles.submitBtn,
                {
                  backgroundColor: !isProvider || hasApplied ? theme.border : theme.primary,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={submitting || !isProvider || hasApplied}
            >
              <ThemedText
                style={[
                  styles.submitBtnText,
                  { color: !isProvider || hasApplied ? theme.textSecondary : '#FFFFFF' },
                ]}
              >
                {submitting ? 'Đang gửi...' : hasApplied ? 'Đã gửi đề xuất' : 'Gửi đề xuất'}
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function ProposalSheet(props: ProposalSheetProps) {
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent={true}
      onRequestClose={props.onClose}
    >
      {props.visible && <ProposalSheetModalContent {...props} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '88%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Radius.control,
    padding: Spacing.three,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: Radius.control,
    padding: Spacing.three,
  },
  warningText: {
    color: '#B45309',
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: Radius.control,
    padding: Spacing.three,
  },
  infoText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '500',
  },
  field: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  textarea: {
    minHeight: 96,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.four,
    gap: Spacing.three,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
