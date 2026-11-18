import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { catalogApi } from '@/api/catalogApi';
import { jobApi, type JobCreateRequest, type JobExecutionType } from '@/api/jobApi';
import { qk } from '@/api/queryKeys';
import type { CategoryDto } from '@/api/types';
import { Button, Card, Chip, font, makeStyles, radius, spacing, TextField } from '@/ui';

export const TITLE_MIN = 15;
export const TITLE_MAX = 100;
export const DESC_MIN = 20;
export const PRICE_MIN = 50_000;
export const PRICE_MAX = 100_000_000;

export function JobPostScreen({
  onSuccess,
}: {
  onSuccess?: (jobId: string) => void;
} = {}) {
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [budgetMinRaw, setBudgetMinRaw] = React.useState('');
  const [budgetMaxRaw, setBudgetMaxRaw] = React.useState('');
  const [type, setType] = React.useState<JobExecutionType>('DIGITAL');
  const [categoryId, setCategoryId] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [deadline, setDeadline] = React.useState('');

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: qk.categories(),
    queryFn: async () => {
      const res = await catalogApi.getRootCategories();
      return res.result?.data ?? [];
    },
  });

  const categories: CategoryDto[] = categoriesQuery.data ?? [];
  const selectedCategoryId = categoryId || categories[0]?.categoryId || '';

  // Real-time Checklist Calculation
  const cleanTitle = title.trim();
  const cleanDesc = description.trim();
  const minBudget = Number(budgetMinRaw.replace(/[^\d]/g, ''));
  const maxBudget = budgetMaxRaw ? Number(budgetMaxRaw.replace(/[^\d]/g, '')) : minBudget;

  const isTitleValid = cleanTitle.length >= TITLE_MIN && cleanTitle.length <= TITLE_MAX;
  const isDescValid = cleanDesc.length >= DESC_MIN;
  const isCategoryValid = Boolean(selectedCategoryId);
  const isBudgetValid =
    Number.isFinite(minBudget) &&
    minBudget >= PRICE_MIN &&
    minBudget <= PRICE_MAX &&
    (!budgetMaxRaw || (Number.isFinite(maxBudget) && maxBudget >= minBudget && maxBudget <= PRICE_MAX));
  const isLocationValid = type !== 'ONSITE' || location.trim().length >= 5;

  const isAllValid = isTitleValid && isDescValid && isCategoryValid && isBudgetValid && isLocationValid;

  const createMutation = useMutation({
    mutationFn: async (payload: JobCreateRequest) => {
      const res = await jobApi.createJob(payload);
      return res.result;
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Alert.alert('Thành công', 'Đã đăng tin việc làm mới!');
      if (onSuccess) {
        onSuccess(created.jobId);
      } else {
        router.back();
      }
    },
    onError: (err: any) => {
      Alert.alert('Lỗi đăng việc', err?.message || 'Không thể đăng tin việc làm. Vui lòng thử lại.');
    },
  });

  const handleSubmit = () => {
    if (!isAllValid) {
      Alert.alert('Thông tin chưa hợp lệ', 'Vui lòng kiểm tra lại các mục trong danh sách kiểm tra.');
      return;
    }

    createMutation.mutate({
      title: cleanTitle,
      description: cleanDesc,
      categoryId: selectedCategoryId || '00000000-0000-0000-0000-000000000001',
      budgetMin: minBudget,
      budgetMax: maxBudget,
      currency: 'VND',
      executionType: type,
      locationSnapshot: type === 'ONSITE' ? location.trim() : undefined,
      deadlineAt: deadline.trim() ? deadline.trim() : undefined,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.headerTitle}>Đăng Việc Làm Mới</Text>
          <Text style={styles.headerSub}>Mô tả công việc chi tiết để chuyên gia gửi báo giá phù hợp nhất.</Text>

          {/* Interactive Input Checklist Widget */}
          <Card style={styles.checklistCard}>
            <View style={styles.checklistTitleRow}>
              <Ionicons name="checkbox-outline" size={18} color="#0284c7" />
              <Text style={styles.checklistTitle}>Tiêu chuẩn đăng việc</Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons
                name={isTitleValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isTitleValid ? '#16a34a' : '#94a3b8'}
              />
              <Text style={isTitleValid ? styles.checkTextValid : styles.checkText}>
                Tiêu đề từ 15 đến 100 ký tự ({cleanTitle.length}/100)
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={isDescValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isDescValid ? '#16a34a' : '#94a3b8'}
              />
              <Text style={isDescValid ? styles.checkTextValid : styles.checkText}>
                Mô tả chi tiết ít nhất 20 ký tự ({cleanDesc.length})
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={isCategoryValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isCategoryValid ? '#16a34a' : '#94a3b8'}
              />
              <Text style={isCategoryValid ? styles.checkTextValid : styles.checkText}>
                Đã chọn ngành nghề phù hợp
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={isBudgetValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isBudgetValid ? '#16a34a' : '#94a3b8'}
              />
              <Text style={isBudgetValid ? styles.checkTextValid : styles.checkText}>
                Ngân sách từ 50.000 ₫ đến 100.000.000 ₫
              </Text>
            </View>

            {type === 'ONSITE' ? (
              <View style={styles.checkItem}>
                <Ionicons
                  name={isLocationValid ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={isLocationValid ? '#16a34a' : '#94a3b8'}
                />
                <Text style={isLocationValid ? styles.checkTextValid : styles.checkText}>
                  Địa chỉ thực hiện tại chỗ
                </Text>
              </View>
            ) : null}
          </Card>

          {/* Form Fields */}
          <TextField
            label="Tiêu đề việc làm *"
            placeholder="Ví dụ: Thiết kế bộ logo nhận diện thương hiệu"
            value={title}
            onChangeText={setTitle}
            maxLength={TITLE_MAX}
          />

          <TextField
            label="Mô tả chi tiết *"
            placeholder="Mô tả cụ thể yêu cầu công việc, phạm vi bàn giao..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Hình thức thực hiện</Text>
            <View style={styles.chipRow}>
              <Chip label="Trực tuyến (DIGITAL)" selected={type === 'DIGITAL'} onPress={() => setType('DIGITAL')} />
              <Chip label="Tại chỗ (ONSITE)" selected={type === 'ONSITE'} onPress={() => setType('ONSITE')} />
            </View>
          </View>

          {categories.length > 0 ? (
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Chọn ngành nghề *</Text>
              <View style={styles.chipRow}>
                {categories.map((cat) => (
                  <Chip
                    key={cat.categoryId}
                    label={cat.name}
                    selected={selectedCategoryId === cat.categoryId}
                    onPress={() => setCategoryId(cat.categoryId)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Ngân sách tối thiểu *"
                placeholder="2500000"
                keyboardType="numeric"
                value={budgetMinRaw}
                onChangeText={setBudgetMinRaw}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Tối đa (tuỳ chọn)"
                placeholder="5000000"
                keyboardType="numeric"
                value={budgetMaxRaw}
                onChangeText={setBudgetMaxRaw}
              />
            </View>
          </View>

          {type === 'ONSITE' ? (
            <TextField
              label="Địa điểm thực hiện tại chỗ *"
              placeholder="Nhập địa chỉ quận/huyện, tỉnh/thành phố..."
              value={location}
              onChangeText={setLocation}
            />
          ) : null}

          <TextField
            label="Hạn chót hoàn thành (YYYY-MM-DD, tuỳ chọn)"
            placeholder="Ví dụ: 2026-12-31"
            value={deadline}
            onChangeText={setDeadline}
          />

          <Button
            title="Đăng Tin Việc Làm"
            loading={createMutation.isPending}
            disabled={!isAllValid || createMutation.isPending}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, gap: spacing.md },
  headerTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: font.small, color: colors.muted, marginTop: -spacing.xs },
  checklistCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  checklistTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  checklistTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checkText: { fontSize: font.small, color: colors.muted },
  checkTextValid: { fontSize: font.small, color: '#16a34a', fontWeight: '600' },
  fieldSection: { gap: spacing.xs },
  fieldLabel: { fontSize: font.small, fontWeight: '700', color: colors.text },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  row: { flexDirection: 'row', gap: spacing.sm },
}));
