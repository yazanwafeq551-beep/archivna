import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, Clock3, FolderTree, KeyRound, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { catalogApi, flattenUnits, type ArchivalUnit } from '@/api/catalog';
import { governanceApi, type PlatformRole, type WorkflowAction } from '@/api/governance';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roleLabels: Record<PlatformRole, [string, string]> = {
  researcher: ['باحث', 'Researcher'], depositor: ['مودع', 'Depositor'], cataloger: ['مفهرس', 'Cataloger'], reviewer: ['مراجع', 'Reviewer'],
  institution_admin: ['مدير مؤسسة', 'Institution admin'], system_admin: ['مدير النظام', 'System admin'], sovereignty_custodian: ['وصي سيادي', 'Sovereignty custodian'],
};
const statusLabels: Record<string, [string, string]> = {
  draft: ['مسودة', 'Draft'], processing: ['قيد المعالجة', 'Processing'], cataloging: ['قيد الفهرسة', 'Cataloging'], inReview: ['قيد المراجعة', 'In review'], in_review: ['قيد المراجعة', 'In review'], approved: ['معتمد', 'Approved'], published: ['منشور', 'Published'],
};
const levelLabels: Record<string, [string, string]> = { fonds: ['رصيد', 'Fonds'], collection: ['مجموعة', 'Collection'], series: ['سلسلة', 'Series'], file: ['ملف', 'File'] };

export function ArchiveManagementPage() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const roleSet = useMemo(() => new Set((user?.roleAssignments || []).map((assignment) => assignment.role)), [user]);
  const isStaff = [...roleSet].some((role) => role !== 'researcher');
  const canCatalog = ['system_admin', 'institution_admin', 'cataloger'].some((role) => roleSet.has(role));
  const canManageRoles = ['system_admin', 'institution_admin'].some((role) => roleSet.has(role));

  const { data: institutions = [] } = useQuery({ queryKey: ['institutions'], queryFn: catalogApi.institutions });
  const pilot = institutions.find((institution) => institution.slug === 'palestinian-archival-collective');
  const [selectedInstitution, setSelectedInstitution] = useState(user?.institutionId || '');
  const institutionId = selectedInstitution || user?.institutionId || pilot?.id || institutions[0]?.id || '';

  const { data: hierarchy } = useQuery({ queryKey: ['archive-hierarchy', institutionId], queryFn: () => catalogApi.hierarchy(institutionId), enabled: Boolean(institutionId) });
  const { data: workflow = [] } = useQuery({ queryKey: ['workflow-queue'], queryFn: governanceApi.workflowQueue, enabled: isStaff });
  const { data: reviewRequests = [] } = useQuery({ queryKey: ['access-review'], queryFn: governanceApi.reviewRequests, enabled: isStaff });
  const { data: myRequests = [] } = useQuery({ queryKey: ['my-access-requests'], queryFn: governanceApi.myRequests });
  const { data: users = [] } = useQuery({ queryKey: ['governance-users', institutionId], queryFn: () => governanceApi.users(institutionId || undefined), enabled: canManageRoles && Boolean(institutionId) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['workflow-queue'] });
    queryClient.invalidateQueries({ queryKey: ['access-review'] });
    queryClient.invalidateQueries({ queryKey: ['my-access-requests'] });
    queryClient.invalidateQueries({ queryKey: ['archive-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['governance-users'] });
  };
  const transition = useMutation({
    mutationFn: ({ id, action }: { id: string; action: WorkflowAction }) => governanceApi.transition(id, action),
    onSuccess: () => { refresh(); toast.success(tr('تم تحديث حالة السجل', 'Record status updated')); },
    onError: () => toast.error(tr('لا تملك الصلاحية لهذا الانتقال', 'You do not have permission for this transition')),
  });
  const decision = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 'approved' | 'rejected' }) => governanceApi.decideRequest(id, { decision: value, grantHours: value === 'approved' ? 72 : undefined }),
    onSuccess: () => { refresh(); toast.success(tr('تم تسجيل قرار الوصول', 'Access decision recorded')); },
    onError: () => toast.error(tr('تعذر تسجيل القرار', 'Could not record the decision')),
  });

  const [unitForm, setUnitForm] = useState({ parentId: '', level: 'fonds' as ArchivalUnit['level'], titleAr: '', titleEn: '', referenceCode: '' });
  const createUnit = useMutation({
    mutationFn: () => catalogApi.createUnit({ institutionId, ...unitForm, parentId: unitForm.parentId || undefined }),
    onSuccess: () => { setUnitForm({ parentId: '', level: 'fonds', titleAr: '', titleEn: '', referenceCode: '' }); refresh(); toast.success(tr('تمت إضافة الوحدة الأرشيفية', 'Archival unit added')); },
    onError: () => toast.error(tr('تحقق من ترتيب المستوى والصلاحيات', 'Check the hierarchy level and permissions')),
  });
  const [roleForm, setRoleForm] = useState({ userId: '', role: 'depositor' as PlatformRole });
  const assignRole = useMutation({
    mutationFn: () => governanceApi.assignRole({ ...roleForm, institutionId: ['system_admin', 'sovereignty_custodian'].includes(roleForm.role) ? undefined : institutionId }),
    onSuccess: () => { refresh(); toast.success(tr('تم تعيين الدور', 'Role assigned')); },
    onError: () => toast.error(tr('تعذر تعيين الدور', 'Could not assign role')),
  });

  const nextActions = (status: string): Array<{ action: WorkflowAction; label: string; primary?: boolean }> => {
    if (status === 'processing') return [{ action: 'start_cataloging', label: tr('بدء الفهرسة', 'Start cataloging'), primary: true }, { action: 'return_changes', label: tr('إرجاع', 'Return') }];
    if (status === 'cataloging') return [{ action: 'request_review', label: tr('إرسال للمراجعة', 'Request review'), primary: true }, { action: 'return_changes', label: tr('إرجاع', 'Return') }];
    if (status === 'inReview' || status === 'in_review') return [{ action: 'approve', label: tr('اعتماد', 'Approve'), primary: true }, { action: 'return_changes', label: tr('طلب تعديلات', 'Request changes') }];
    if (status === 'approved') return [{ action: 'publish', label: tr('نشر', 'Publish'), primary: true }, { action: 'return_changes', label: tr('إرجاع', 'Return') }];
    return [];
  };
  const flatUnits = flattenUnits(hierarchy?.units || []);

  return (
    <div className="mx-auto max-w-7xl space-y-6" dir={ar ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl bg-primary px-6 py-7 text-white shadow-lg">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 p-3"><ShieldCheck className="h-7 w-7 text-gold" /></div><div><h1 className="text-2xl font-bold">{tr('إدارة الأرشيف والوصول', 'Archive governance and access')}</h1><p className="mt-1 text-sm text-white/75">{tr('الفهرسة المؤسسية، المراجعة، الصلاحيات وطلبات المواد المقيّدة.', 'Institutional cataloging, review, roles, and restricted-access requests.')}</p></div></div>
      </div>

      {institutions.length > 0 && isStaff && <div className="max-w-md"><Select value={institutionId} onValueChange={setSelectedInstitution}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{institutions.map((institution) => <SelectItem value={institution.id} key={institution.id}>{ar ? institution.nameAr : institution.nameEn || institution.nameAr}</SelectItem>)}</SelectContent></Select></div>}

      <Tabs defaultValue={isStaff ? 'workflow' : 'mine'}>
        <TabsList className="h-auto flex-wrap justify-start">
          {isStaff && <TabsTrigger value="workflow">{tr('سير المراجعة', 'Review workflow')}</TabsTrigger>}
          {isStaff && <TabsTrigger value="access"><KeyRound className="me-2 h-4 w-4" />{tr('طلبات الوصول', 'Access requests')}</TabsTrigger>}
          <TabsTrigger value="mine">{tr('طلباتي', 'My requests')}</TabsTrigger>
          {canCatalog && <TabsTrigger value="hierarchy"><FolderTree className="me-2 h-4 w-4" />{tr('الهيكل الأرشيفي', 'Archive hierarchy')}</TabsTrigger>}
          {canManageRoles && <TabsTrigger value="roles"><Users className="me-2 h-4 w-4" />{tr('الفريق والأدوار', 'Team and roles')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="workflow" className="space-y-3 pt-4">
          {workflow.length === 0 ? <Empty text={tr('لا توجد مواد تنتظر إجراءً حالياً.', 'No records currently require action.')} /> : workflow.map((record) => <Card key={record.id}><CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{ar ? record.titleAr : record.titleEn || record.titleAr}</h3><Badge variant="secondary">{(statusLabels[record.status] || [record.status, record.status])[ar ? 0 : 1]}</Badge></div><p className="mt-1 text-sm text-muted">{record.referenceNumber || '—'} · {record.institution?.nameAr || record.institutionName}</p></div><div className="flex flex-wrap gap-2">{nextActions(record.status).map((item) => <Button key={item.action} variant={item.primary ? 'default' : 'outline'} size="sm" onClick={() => transition.mutate({ id: record.id, action: item.action })}>{item.primary ? <Check className="me-1 h-4 w-4" /> : <RotateCcw className="me-1 h-4 w-4" />}{item.label}</Button>)}</div></CardContent></Card>)}
        </TabsContent>

        <TabsContent value="access" className="space-y-3 pt-4">
          {reviewRequests.length === 0 ? <Empty text={tr('لا توجد طلبات وصول معلقة.', 'No pending access requests.')} /> : reviewRequests.map((request) => <Card key={request.id}><CardContent className="space-y-4 p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start"><div className="flex-1"><h3 className="font-semibold">{ar ? request.archiveRecord.titleAr : request.archiveRecord.titleEn || request.archiveRecord.titleAr}</h3><p className="mt-1 text-sm text-muted">{request.requester?.fullName} · {request.requester?.email}</p><p className="mt-3 rounded-lg bg-muted-bg p-3 text-sm">{request.reason}</p></div><Badge>{request.archiveRecord.accessLevel}</Badge></div><div className="flex gap-2"><Button size="sm" onClick={() => decision.mutate({ id: request.id, value: 'approved' })}>{tr('موافقة لمدة 72 ساعة', 'Approve for 72 hours')}</Button><Button size="sm" variant="outline" onClick={() => decision.mutate({ id: request.id, value: 'rejected' })}>{tr('رفض', 'Reject')}</Button></div></CardContent></Card>)}
        </TabsContent>

        <TabsContent value="mine" className="space-y-3 pt-4">
          {myRequests.length === 0 ? <Empty text={tr('لم ترسل طلبات وصول بعد.', 'You have not submitted access requests yet.')} /> : myRequests.map((request) => <Card key={request.id}><CardContent className="flex items-center gap-4 p-5"><Clock3 className="h-5 w-5 text-gold" /><div className="flex-1"><h3 className="font-semibold">{ar ? request.archiveRecord.titleAr : request.archiveRecord.titleEn || request.archiveRecord.titleAr}</h3><p className="mt-1 text-sm text-muted">{request.reason}</p>{request.expiresAt && <p className="mt-1 text-xs text-primary">{tr('الوصول متاح حتى', 'Access available until')} {new Date(request.expiresAt).toLocaleString(ar ? 'ar-PS' : 'en')}</p>}</div><Badge variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'destructive' : 'secondary'}>{request.status}</Badge></CardContent></Card>)}
        </TabsContent>

        <TabsContent value="hierarchy" className="grid gap-6 pt-4 lg:grid-cols-[.8fr_1.2fr]">
          <Card><CardHeader><CardTitle>{tr('إضافة وحدة أرشيفية', 'Add archival unit')}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); createUnit.mutate(); }}><Select value={unitForm.level} onValueChange={(value: ArchivalUnit['level']) => setUnitForm({ ...unitForm, level: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(levelLabels).map(([value, labels]) => <SelectItem key={value} value={value}>{labels[ar ? 0 : 1]}</SelectItem>)}</SelectContent></Select><Select value={unitForm.parentId || 'root'} onValueChange={(value) => setUnitForm({ ...unitForm, parentId: value === 'root' ? '' : value })}><SelectTrigger><SelectValue placeholder={tr('الوحدة الأب', 'Parent unit')} /></SelectTrigger><SelectContent><SelectItem value="root">{tr('مستوى جذري', 'Root level')}</SelectItem>{flatUnits.map((unit) => <SelectItem key={unit.id} value={unit.id}>{'—'.repeat(unit.depth)} {ar ? unit.titleAr : unit.titleEn || unit.titleAr}</SelectItem>)}</SelectContent></Select><Input label={tr('العنوان بالعربية *', 'Arabic title *')} value={unitForm.titleAr} onChange={(e) => setUnitForm({ ...unitForm, titleAr: e.target.value })} required /><Input label={tr('العنوان بالإنجليزية', 'English title')} value={unitForm.titleEn} onChange={(e) => setUnitForm({ ...unitForm, titleEn: e.target.value })} /><Input label={tr('الرمز المرجعي', 'Reference code')} value={unitForm.referenceCode} onChange={(e) => setUnitForm({ ...unitForm, referenceCode: e.target.value })} /><Button type="submit" disabled={!unitForm.titleAr || createUnit.isPending}>{tr('إضافة الوحدة', 'Add unit')}</Button></form></CardContent></Card>
          <Card><CardHeader><CardTitle>{tr('التسلسل الحالي', 'Current hierarchy')}</CardTitle></CardHeader><CardContent className="space-y-2">{flatUnits.map((unit) => <div key={unit.id} style={{ paddingInlineStart: `${unit.depth * 24}px` }} className="flex items-center gap-2 rounded-lg border border-border p-3"><ChevronLeft className="h-4 w-4 text-gold" /><div><p className="font-medium">{ar ? unit.titleAr : unit.titleEn || unit.titleAr}</p><p className="text-xs text-muted">{(levelLabels[unit.level] || [unit.level, unit.level])[ar ? 0 : 1]} · {unit.referenceCode || '—'} · {unit._count?.records || 0} {tr('مادة', 'items')}</p></div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="roles" className="grid gap-6 pt-4 lg:grid-cols-[.8fr_1.2fr]">
          <Card><CardHeader><CardTitle>{tr('تعيين دور', 'Assign a role')}</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); assignRole.mutate(); }}><Select value={roleForm.userId} onValueChange={(value) => setRoleForm({ ...roleForm, userId: value })}><SelectTrigger><SelectValue placeholder={tr('اختر المستخدم', 'Select user')} /></SelectTrigger><SelectContent>{users.map((item) => <SelectItem key={item.id} value={item.id}>{item.fullName} · {item.email}</SelectItem>)}</SelectContent></Select><Select value={roleForm.role} onValueChange={(value: PlatformRole) => setRoleForm({ ...roleForm, role: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(roleLabels) as PlatformRole[]).map((role) => <SelectItem key={role} value={role}>{roleLabels[role][ar ? 0 : 1]}</SelectItem>)}</SelectContent></Select><Button type="submit" disabled={!roleForm.userId || assignRole.isPending}>{tr('حفظ الدور', 'Save role')}</Button></form></CardContent></Card>
          <Card><CardHeader><CardTitle>{tr('فريق المؤسسة', 'Institution team')}</CardTitle></CardHeader><CardContent className="space-y-3">{users.map((item) => <div key={item.id} className="rounded-lg border border-border p-4"><p className="font-semibold">{item.fullName}</p><p className="text-sm text-muted">{item.email}</p><div className="mt-2 flex flex-wrap gap-1">{item.roleAssignments.map((assignment) => <Badge key={assignment.id} variant="secondary">{roleLabels[assignment.role]?.[ar ? 0 : 1] || assignment.role}</Badge>)}</div></div>)}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="p-10 text-center text-muted">{text}</CardContent></Card>;
}
