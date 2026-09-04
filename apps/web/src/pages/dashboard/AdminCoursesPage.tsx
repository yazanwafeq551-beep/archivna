import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { lmsApi, type Course, type CreateCourseInput } from "@/api/lms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const initialForm: CreateCourseInput = {
  titleAr: "", titleEn: "", instructorName: "", shortDescAr: "", fullDescAr: "",
  thumbnailUrl: "", difficulty: "beginner", duration: 60, isFeatured: false,
  lessonTitleAr: "", lessonTitleEn: "", lessonContentAr: "", lessonSummaryAr: "", lessonVideoUrl: "",
};

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCourseInput>(initialForm);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const { data: courses = [], isLoading } = useQuery({ queryKey: ["admin-courses"], queryFn: lmsApi.getAdminCourses });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };
  const createCourse = useMutation({
    mutationFn: lmsApi.createAdminCourse,
    onSuccess: () => { refresh(); setForm(initialForm); toast.success("تم نشر الدورة وإضافة الدرس الأول"); },
    onError: () => toast.error("تعذر إنشاء الدورة. تحقق من الحقول وحاول مجددًا."),
  });
  const deleteCourse = useMutation({
    mutationFn: lmsApi.deleteAdminCourse,
    onSuccess: () => { refresh(); setCourseToDelete(null); toast.success("تم حذف الدورة"); },
    onError: () => toast.error("تعذر حذف الدورة"),
  });
  const setField = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); createCourse.mutate(form); };

  return (
    <div className="mx-auto max-w-7xl space-y-6" dir="rtl">
      <div className="rounded-2xl bg-primary px-6 py-7 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-3"><BookOpenCheck className="h-7 w-7 text-gold" /></div>
          <div><h1 className="text-2xl font-bold">إدارة دورات بناء القدرات</h1><p className="mt-1 text-sm text-white/75">أضف دورة منشورة مع درسها الأول، أو احذف دورة موجودة.</p></div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-gold" />إضافة دورة جديدة</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="اسم الدورة بالعربية *" value={form.titleAr} onChange={(e) => setField("titleAr", e.target.value)} required />
                <Input label="اسم الدورة بالإنجليزية" value={form.titleEn} onChange={(e) => setField("titleEn", e.target.value)} dir="ltr" />
                <Input label="اسم المدرب أو الجهة *" value={form.instructorName} onChange={(e) => setField("instructorName", e.target.value)} required />
                <Input label="مدة الدورة بالدقائق" type="number" min={1} value={form.duration} onChange={(e) => setField("duration", Number(e.target.value))} />
              </div>
              <Textarea label="وصف مختصر" value={form.shortDescAr} onChange={(e) => setField("shortDescAr", e.target.value)} />
              <Textarea label="وصف الدورة الكامل" value={form.fullDescAr} onChange={(e) => setField("fullDescAr", e.target.value)} className="min-h-28" />
              <Input label="رابط صورة الغلاف" value={form.thumbnailUrl} onChange={(e) => setField("thumbnailUrl", e.target.value)} placeholder="/uploads/... أو https://..." dir="ltr" />
              <div className="rounded-xl border border-gold/25 bg-gold-light/15 p-4">
                <h2 className="mb-4 flex items-center gap-2 font-semibold"><Video className="h-5 w-5 text-primary" />الدرس الأول</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="عنوان الدرس بالعربية *" value={form.lessonTitleAr} onChange={(e) => setField("lessonTitleAr", e.target.value)} required />
                  <Input label="عنوان الدرس بالإنجليزية" value={form.lessonTitleEn} onChange={(e) => setField("lessonTitleEn", e.target.value)} dir="ltr" />
                </div>
                <Textarea label="محتوى الدرس" value={form.lessonContentAr} onChange={(e) => setField("lessonContentAr", e.target.value)} className="mt-4 min-h-32" />
                <Textarea label="ملخص الدرس" value={form.lessonSummaryAr} onChange={(e) => setField("lessonSummaryAr", e.target.value)} className="mt-4" />
                <Input label="رابط فيديو مباشر (MP4 أو WebM)" value={form.lessonVideoUrl} onChange={(e) => setField("lessonVideoUrl", e.target.value)} className="mt-4" placeholder="/uploads/.../video.webm" dir="ltr" />
              </div>
              <Button type="submit" className="w-full sm:w-auto" isLoading={createCourse.isPending}>نشر الدورة</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>الدورات المنشورة <Badge variant="secondary" className="me-2">{courses.length}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <p className="text-muted">جارٍ تحميل الدورات…</p> : courses.map((course) => (
              <div key={course.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="h-16 w-20 rounded-lg object-cover" /> : <div className="grid h-16 w-20 place-items-center rounded-lg bg-primary/10"><BookOpenCheck className="h-6 w-6 text-primary" /></div>}
                <div className="min-w-0 flex-1"><h3 className="font-semibold text-foreground">{course.titleAr}</h3><p className="mt-1 text-sm text-muted">{course.instructorName} · {course._count?.lessons ?? 0} دروس</p></div>
                <Button variant="ghost" size="icon" className="text-destructive" aria-label="حذف الدورة" onClick={() => setCourseToDelete(course)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)} title="حذف الدورة؟" description={`سيتم حذف «${courseToDelete?.titleAr ?? ""}» ودروسها وبيانات التسجيل المرتبطة بها نهائيًا.`} confirmLabel="حذف الدورة" variant="destructive" isLoading={deleteCourse.isPending} onConfirm={() => courseToDelete && deleteCourse.mutate(courseToDelete.id)} />
    </div>
  );
}
