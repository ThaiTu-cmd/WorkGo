import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '@/auth/AuthProvider';
import {newIdempotencyKey} from '@/features/payment/payment';
import {getDocumentAsync,type DocumentPickerAsset} from 'expo-document-picker';
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

export function JobPostScreen(props:{onSuccess?:(jobId:string)=>void}={}){
  const {claims,status}=useAuth();
  return <JobPostContent key={status+':'+(claims?.userId??'')} {...props}/>;
}

function JobPostContent({
  onSuccess,
}: {
  onSuccess?: (jobId: string) => void;
} = {}) {
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {claims}=useAuth();const userId=claims?.userId??'';const storageKey='workgo.job.pending:'+userId;
  const pending=React.useRef<{key:string;identity:string;body:JobCreateRequest;files?:{name:string;size:number|null;type:string}[]}|null>(null);
  const [files,setFiles]=React.useState<DocumentPickerAsset[]>([]);
  const [fileNotice,setFileNotice]=React.useState('');
  const [uploading,setUploading]=React.useState(false);
  const cancelled=React.useRef(false),uploadAbort=React.useRef<AbortController|null>(null);
  const flight=React.useRef(false),mounted=React.useRef(true);
  const [restoring,setRestoring]=React.useState(true);
  React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;uploadAbort.current?.abort();};},[]);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [budgetMinRaw, setBudgetMinRaw] = React.useState('');
  const [budgetMaxRaw, setBudgetMaxRaw] = React.useState('');
  const [type, setType] = React.useState<JobExecutionType>('DIGITAL');
  const [categoryId, setCategoryId] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [deadline, setDeadline] = React.useState('');

  React.useEffect(()=>{let active=true;
    AsyncStorage.getItem(storageKey).then(raw=>{
      if(!active||!raw)return;const saved=JSON.parse(raw);
      if(typeof saved?.key!=='string'||typeof saved?.identity!=='string'||!saved?.body?.title)return;
      pending.current=saved;const b=saved.body as JobCreateRequest;
      if(saved.files?.length)setFileNotice('Chọn lại các tệp gốc nếu tin vẫn là bản nháp. Tin đã đăng sẽ được lấy lại từ server.');
      setTitle(b.title);setDescription(b.description);setCategoryId(b.categoryId);setBudgetMinRaw(String(b.budgetMin));
      setBudgetMaxRaw(String(b.budgetMax));setType(b.executionType);setLocation(b.locationSnapshot??'');setDeadline(b.deadlineAt??'');
    }).catch(()=>{/* Stored input is never accepted as a server receipt. */}).finally(()=>{if(active)setRestoring(false);});
    return()=>{active=false;};
  },[storageKey]);

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
  const isLocationValid = !['ONSITE','DELIVERY'].includes(type) || location.trim().length >= 5;

  const isAllValid = isTitleValid && isDescValid && isCategoryValid && isBudgetValid && isLocationValid;

  const createMutation = useMutation({
    mutationFn: async (payload: JobCreateRequest) => {
      if(!userId||restoring||!mounted.current)throw new Error('Vui lòng đăng nhập và chờ khôi phục lệnh.');
      const descriptors=files.map(f=>({name:f.name,size:f.size??null,type:f.mimeType??'application/octet-stream'}));
      const identity=files.length?JSON.stringify({body:payload,files:descriptors}):JSON.stringify(payload);
      if(pending.current&&JSON.stringify(pending.current.body)!==JSON.stringify(payload))throw new Error('Khôi phục đúng nội dung lệnh đang chờ trước khi thử lại.');
      pending.current??={key:newIdempotencyKey(),identity,body:payload,files:descriptors};
      await AsyncStorage.setItem(storageKey,JSON.stringify(pending.current));
      let res;
      try{res=await jobApi.getCreationReceipt(pending.current.key);}catch(error){if((error as {status?:number}).status!==404)throw error;}
      if(!mounted.current)throw new Error('Session changed');
      if(res?.result?.status!=='OPEN'){
        if(pending.current.identity!==identity)throw new Error('Chọn lại đúng các tệp gốc để tiếp tục bản nháp đang chờ.');
        if(files.length){
          res??=await jobApi.createDraft(payload,pending.current.key);
          if(!res?.result?.jobId||res.result.clientId!==userId)throw new Error('Missing owner draft receipt');
          if(res.result.status!=='OPEN'){
            if(res.result.status!=='PAUSED')throw new Error('Bản nháp không còn cho phép đăng. Tải lại dữ liệu server.');
            const id=res.result.jobId;
            setUploading(true);
            try{
            for(const f of files){
              if(!mounted.current||cancelled.current)throw new Error('Đã dừng tải; bản nháp được giữ để thử lại.');
              const form=new FormData();if(f.file)form.append('file',f.file,f.name);
              else form.append('file',{uri:f.uri,name:f.name,type:f.mimeType??'application/octet-stream'} as unknown as Blob);
              uploadAbort.current=new AbortController();
              const uploaded=await jobApi.uploadAttachment(id,form,uploadAbort.current.signal);
              if(uploaded?.result?.status!=='READY'||!(uploaded.result.attachmentId??uploaded.result.id))throw new Error('Server chưa xác nhận tệp READY.');
            }
            }finally{uploadAbort.current=null;if(mounted.current)setUploading(false);}
            if(!mounted.current||cancelled.current)throw new Error('Đã dừng tải; bản nháp được giữ để thử lại.');
            res=await jobApi.publishJob(id);
          }
        }else res??=await jobApi.createJob(payload,pending.current.key);
      }
      if(!res?.result?.jobId||res.result.status!=='OPEN'||res.result.clientId!==userId)throw new Error('Server chưa xác nhận tin việc của tài khoản hiện tại.');
      if(!mounted.current)throw new Error('Session changed');
      await AsyncStorage.removeItem(storageKey).catch(()=>{});pending.current=null;
      return res.result;
    },
    onSuccess: (created) => {
      if(!mounted.current)return;
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Alert.alert('Thành công', 'Đã đăng tin việc làm mới!');
      if (onSuccess) {
        onSuccess(created.jobId);
      } else {
        router.back();
      }
    },
    onError: (err: any) => {
      if(!mounted.current)return;
      Alert.alert('Lỗi đăng việc', err?.message || 'Không thể đăng tin việc làm. Vui lòng thử lại.');
    },
    onSettled:()=>{flight.current=false;uploadAbort.current=null;},
  });

  const handleSubmit = () => {
    if(flight.current||restoring||!userId)return;
    if (!isAllValid) {
      Alert.alert('Thông tin chưa hợp lệ', 'Vui lòng kiểm tra lại các mục trong danh sách kiểm tra.');
      return;
    }

    cancelled.current=false;flight.current=true;createMutation.mutate({
      title: cleanTitle,
      description: cleanDesc,
      categoryId: selectedCategoryId,
      budgetMin: minBudget,
      budgetMax: maxBudget,
      currency: 'VND',
      executionType: type,
      locationSnapshot: ['ONSITE','DELIVERY'].includes(type) ? location.trim() : undefined,
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

            {['ONSITE','DELIVERY'].includes(type) ? (
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
          <TextField editable={!createMutation.isPending}
            label="Tiêu đề việc làm *"
            placeholder="Ví dụ: Thiết kế bộ logo nhận diện thương hiệu"
            value={title}
            onChangeText={setTitle}
            maxLength={TITLE_MAX}
          />

          <TextField editable={!createMutation.isPending}
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
              <Chip label="Trực tuyến (DIGITAL)" selected={type === 'DIGITAL'} onPress={() => {if(!createMutation.isPending)setType('DIGITAL');}} />
              <Chip label="Tại chỗ (ONSITE)" selected={type === 'ONSITE'} onPress={() => {if(!createMutation.isPending)setType('ONSITE');}} />
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
                    onPress={() => {if(!createMutation.isPending)setCategoryId(cat.categoryId);}}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextField editable={!createMutation.isPending}
                label="Ngân sách tối thiểu *"
                placeholder="2500000"
                keyboardType="numeric"
                value={budgetMinRaw}
                onChangeText={setBudgetMinRaw}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField editable={!createMutation.isPending}
                label="Tối đa (tuỳ chọn)"
                placeholder="5000000"
                keyboardType="numeric"
                value={budgetMaxRaw}
                onChangeText={setBudgetMaxRaw}
              />
            </View>
          </View>

          {['ONSITE','DELIVERY'].includes(type) ? (
            <TextField editable={!createMutation.isPending}
              label="Địa điểm thực hiện tại chỗ *"
              placeholder="Nhập địa chỉ quận/huyện, tỉnh/thành phố..."
              value={location}
              onChangeText={setLocation}
            />
          ) : null}

          <TextField editable={!createMutation.isPending}
            label="Hạn chót hoàn thành (YYYY-MM-DD, tuỳ chọn)"
            placeholder="Ví dụ: 2026-12-31"
            value={deadline}
            onChangeText={setDeadline}
          />

          <Button
            title="Chọn tệp đính kèm"
            disabled={createMutation.isPending||restoring}
            onPress={async()=>{try{
              const selection=await getDocumentAsync({copyToCacheDirectory:true,multiple:true});
              if(selection.canceled||!mounted.current)return;
              const selected=selection.assets;
              if(selected.length>10||selected.some(f=>(f.size??0)>20*1024*1024)||selected.reduce((n,f)=>n+(f.size??0),0)>100*1024*1024)throw new Error('Tối đa 10 tệp, 20 MB/tệp và 100 MB/tin.');
              setFiles(selected);setFileNotice('');
            }catch(error){if(mounted.current)setFileNotice(error instanceof Error?error.message:'Không chọn được tệp.');}}}
          />
          {fileNotice?<Text>{fileNotice}</Text>:null}
          {files.map((f,index)=><Text key={f.uri+index}>{f.name}</Text>)}
          {uploading?<Button title="Dừng tải tệp" onPress={()=>{cancelled.current=true;uploadAbort.current?.abort();}}/>:null}
          <Button
            title="Đăng Tin Việc Làm"
            loading={createMutation.isPending}
            disabled={!isAllValid || createMutation.isPending || restoring || !userId}
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
