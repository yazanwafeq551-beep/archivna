import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

type LessonSeed = {
  lessonNumber: number;
  titleAr: string;
  titleEn: string;
  slug: string;
  videoUrl?: string;
  videoDuration?: number;
  contentAr: string;
  contentEn: string;
  summaryAr: string;
  summaryEn: string;
  estimatedReadingTime: number;
  isAssessment?: boolean;
  attachments?: {
    type: string;
    titleAr: string;
    titleEn?: string;
    url: string;
    mimeType?: string;
    fileSize?: number;
  }[];
};

type CourseSeed = {
  titleAr: string;
  titleEn: string;
  slug: string;
  shortDescAr: string;
  shortDescEn: string;
  fullDescAr: string;
  fullDescEn: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  categorySlug: string;
  tagSlugs: string[];
  difficulty: string;
  duration: number;
  estimatedStudyTime: number;
  language: string;
  instructorName: string;
  instructorBio: string;
  archiveTopic?: string;
  region?: string;
  historicalPeriod?: string;
  targetAudience: string;
  learningObjectives: string[];
  prerequisites?: string;
  isFeatured: boolean;
  isPopular: boolean;
  isFree: boolean;
  publishedAt: string;
  lessons: LessonSeed[];
};

const PASSWORD = 'password123';

const COURSE_CATEGORIES = [
  {
    slug: 'archival-science',
    nameAr: 'علوم الأرشيف وإدارته',
    nameEn: 'Archival Science & Administration',
    description: 'أساسيات علم الأرشيف وأنواع الأرشيفات وأدوار الأرشفة في المؤسسات | Fundamentals of archival science, types of archives, and the role of archiving in institutions',
    icon: 'archive',
    sortOrder: 1,
  },
  {
    slug: 'digital-preservation',
    nameAr: 'الحفظ الرقمي',
    nameEn: 'Digital Preservation',
    description: 'استراتيجيات الحفظ الرقمي طويلة الأمد للمواد الأرشيفية | Long-term digital preservation strategies for archival materials',
    icon: 'hard-drive',
    sortOrder: 2,
  },
  {
    slug: 'cataloging-standards',
    nameAr: 'المعايير والفهرسة',
    nameEn: 'Cataloging & Standards',
    description: 'معايير الوصف الأرشيفي الدولية مثل ISAD(G) وDublin Core | International archival description standards such as ISAD(G) and Dublin Core',
    icon: 'list-ordered',
    sortOrder: 3,
  },
  {
    slug: 'records-management',
    nameAr: 'إدارة السجلات',
    nameEn: 'Records Management',
    description: 'دورة حياة السجلات وإدارة الوثائق في المؤسسات الحكومية والخاصة | Records lifecycle and document management in public and private institutions',
    icon: 'folder-open',
    sortOrder: 4,
  },
  {
    slug: 'oral-history',
    nameAr: 'التاريخ الشفوي',
    nameEn: 'Oral History',
    description: 'منهجيات جمع المقابلات الشفوية وتوثيق الذاكرة الشعبية | Methodologies for collecting oral interviews and documenting collective memory',
    icon: 'mic',
    sortOrder: 5,
  },
  {
    slug: 'digitization',
    nameAr: 'الرقمنة والتصوير',
    nameEn: 'Digitization & Imaging',
    description: 'الأسس الفنية للرقمنة وتصوير الوثائق والمخطوطات | Technical foundations for digitizing and imaging documents and manuscripts',
    icon: 'camera',
    sortOrder: 6,
  },
  {
    slug: 'audiovisual-archives',
    nameAr: 'الأرشيف السمعي البصري',
    nameEn: 'Audiovisual Archives',
    description: 'حفظ وإتاحة المواد السمعية والبصرية والحفاظ عليها | Preservation, access and care of audiovisual materials',
    icon: 'video',
    sortOrder: 7,
  },
];

const COURSE_TAGS = [
  { name: 'أرشيف', slug: 'archives' },
  { name: 'توثيق', slug: 'documentation' },
  { name: 'حفظ رقمي', slug: 'digital-preservation' },
  { name: 'تراث', slug: 'heritage' },
  { name: 'تدريب', slug: 'training' },
  { name: 'بحث', slug: 'research' },
];

const ACHIEVEMENTS = [
  {
    titleAr: 'الخطوة الأولى',
    titleEn: 'First Step',
    descriptionAr: 'إكمال أول درس في المنصة',
    descriptionEn: 'Complete your first lesson on the platform',
    badgeColor: '#0a7a78',
    criteriaType: 'first_lesson',
    criteriaValue: 1,
  },
  {
    titleAr: 'متعلم دؤوب',
    titleEn: 'Diligent Learner',
    descriptionAr: 'إكمال 10 دروس في المنصة',
    descriptionEn: 'Complete 10 lessons on the platform',
    badgeColor: '#D39A35',
    criteriaType: 'lessons_completed',
    criteriaValue: 10,
  },
  {
    titleAr: 'أرشيفي معتمد',
    titleEn: 'Certified Archivist',
    descriptionAr: 'إكمال دورة كاملة في المنصة',
    descriptionEn: 'Complete a full course on the platform',
    badgeColor: '#064E4D',
    criteriaType: 'first_course',
    criteriaValue: 1,
  },
  {
    titleAr: 'متابع متواصل',
    titleEn: 'Dedicated Watcher',
    descriptionAr: 'قضاء ساعة كاملة في مشاهدة دروس المنصة',
    descriptionEn: 'Spend a full hour watching platform lessons',
    badgeColor: '#7c3aed',
    criteriaType: 'watch_time',
    criteriaValue: 3600,
  },
];

const COURSES: CourseSeed[] = [
  {
    titleAr: 'أساسيات علم الأرشيف',
    titleEn: 'Fundamentals of Archival Science',
    slug: 'fundamentals-of-archival-science',
    shortDescAr: 'مدخل شامل إلى علم الأرشيف وأنواع الأرشيفات وأهميته في حفظ الذاكرة',
    shortDescEn: 'A comprehensive introduction to archival science, types of archives, and its importance in preserving memory',
    fullDescAr:
      'هذه الدورة التأسيسية تقدم للدارس تعريفاً شاملاً بعلم الأرشيف، نشأته وتطوره، أنواع الأرشيفات (المركزية، الوطنية، المؤسسية، الشعبية)، والمفاهيم الأساسية مثل الوثيقة، السجل، والمجموعة الأرشيفية. كما تتناول مبادئ التقييم والفرز والممارسات الأخلاقية في مهنة الأرشيف، مع أمثلة واقعية من الواقع الفلسطيني والعربي.',
    fullDescEn:
      'This foundational course provides learners with a comprehensive definition of archival science, its origins and evolution, types of archives (national, institutional, community), and core concepts such as document, record, and archival fonds. It also covers appraisal and disposal principles and ethical practices in the archival profession, with real-world examples from Palestine and the Arab world.',
    categorySlug: 'archival-science',
    tagSlugs: ['archives', 'training'],
    difficulty: 'beginner',
    duration: 120,
    estimatedStudyTime: 8,
    language: 'ar',
    instructorName: 'د. خالد المصري',
    instructorBio: 'أستاذ علم الأرشيف في جامعة القدس، وباحث متخصص في الذاكرة الفلسطينية، ومؤلف عدة دراسات في حفظ التراث الوثائقي.',
    archiveTopic: 'الذاكرة الفلسطينية',
    region: 'فلسطين',
    historicalPeriod: 'فترة الانتداب - اليوم',
    targetAudience: 'طلاب علم المعلومات، موظفو الأرشيف، الباحثون في التاريخ',
    prerequisites: 'لا توجد متطلبات مسبقة',
    learningObjectives: [
      'تعريف علم الأرشيف ومفاهيمه الأساسية',
      'التمييز بين أنواع الأرشيفات المختلفة',
      'فهم مبادئ التقييم والفرز الأرشيفي',
      'إدراك الأخلاقيات المهنية في مهنة الأرشيف',
    ],
    isFeatured: true,
    isPopular: true,
    isFree: true,
    publishedAt: '2024-01-10',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'ما هو علم الأرشيف؟',
        titleEn: 'What is Archival Science?',
        slug: 'what-is-archival-science',
        videoUrl: 'https://www.youtube.com/watch?v=7Pq-S557XQU',
        videoDuration: 540,
        contentAr:
          '<p>علم الأرشيف هو العلم الذي يهتم بدراسة المبادئ والنظريات والطرق الفنية اللازمة لحفظ الوثائق والسجلات وإدارتها وتنظيمها وتيسير استخدامها. إنه يختلف عن علم المكتبات في أن مواد الأرشيف تعد فريدة وغير قابلة للاستبدال، وتنتج عن النشاط الإداري والقانوني للأفراد والمؤسسات.</p><p>بدأ علم الأرشيف كممارسة إدارية في الحضارات القديمة، حيث كان الأرشفة أداة لتدوين المعاملات والقوانين. ومع تطور الدولة الحديثة تطورت النظرية الأرشيفية، حتى تبلورت قواعده العلمية في القرن التاسع عشر على يد الأرشفيين الفرنسيين والبريطانيين.</p>',
        contentEn:
          '<p>Archival science is the discipline concerned with the principles, theories and technical methods needed to preserve, manage, organize and make accessible records and documents. It differs from library science in that archival materials are unique and irreplaceable, produced by the administrative and legal activity of individuals and institutions.</p><p>Archiving began as an administrative practice in ancient civilizations, serving as a tool to record transactions and laws. As the modern state evolved, archival theory developed, and its scientific principles crystallized in the nineteenth century at the hands of French and British archivists.</p>',
        summaryAr: 'تعريف علم الأرشيف، نشأته وتطوره، والفرق بينه وبين علم المكتبات',
        summaryEn: 'Definition of archival science, its origins and development, and the difference from library science',
        estimatedReadingTime: 8,
        attachments: [
          {
            type: 'presentation',
            titleAr: 'عرض تقديمي: مقدمة في علم الأرشيف',
            titleEn: 'Presentation: Introduction to Archival Science',
            url: '/uploads/courses/fundamentals/lesson-1-intro.pptx',
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            fileSize: 2_400_000,
          },
          {
            type: 'pdf',
            titleAr: 'ملف قراءة: نشأة علم الأرشيف',
            titleEn: 'Reading: The Origins of Archival Science',
            url: '/uploads/courses/fundamentals/lesson-1-origins.pdf',
            mimeType: 'application/pdf',
            fileSize: 1_100_000,
          },
        ],
      },
      {
        lessonNumber: 2,
        titleAr: 'أنواع الأرشيفات',
        titleEn: 'Types of Archives',
        slug: 'types-of-archives',
        videoUrl: 'https://www.youtube.com/watch?v=N4zQKx2lJXY',
        videoDuration: 620,
        contentAr:
          '<p>تتنوع الأرشيفات بتنوع الجهات التي أنشأتها وأهدافها. فالأرشيف الوطني يضم وثائق الدولة الرسمية، أما الأرشيفات المؤسسية فترتبط بمؤسسة محددة كالجامعات والبنوك والشركات، فيما تجمع الأرشيفات الشعبية والمدنية مواد الذاكرة الجمعية للمجتمعات المحلية.</p><p>من المهم أن يميز الأرشفي بين هذه الأنواع لأنها تحدد أساليب الفرز والتقييم والحفظ، كما تحدد سياسات الإتاحة والخصوصية. فمثلاً تتبع الأرشيفات الطبية قوانين خصوصية صارمة تختلف عن الأرشيفات العامة.</p>',
        contentEn:
          '<p>Archives vary according to the body that created them and their purposes. The national archive holds official state documents, institutional archives are linked to a specific organization such as universities, banks and companies, while community and civic archives gather the collective memory materials of local communities.</p><p>It is important for the archivist to distinguish between these types because they determine appraisal, disposal and preservation methods, as well as access and privacy policies. Medical archives, for example, follow strict privacy laws that differ from public archives.</p>',
        summaryAr: 'التصنيف الرئيسي للأرشيفات: الوطنية، المؤسسية، الشعبية، وخصائص كل منها',
        summaryEn: 'Main classification of archives: national, institutional, community, and the characteristics of each',
        estimatedReadingTime: 10,
      },
      {
        lessonNumber: 3,
        titleAr: 'التقييم والفرز الأرشيفي',
        titleEn: 'Archival Appraisal and Disposal',
        slug: 'appraisal-and-disposal',
        videoUrl: 'https://www.youtube.com/watch?v=Y8O8y3g0eWY',
        videoDuration: 700,
        contentAr:
          '<p>التقييم الأرشيفي هو العملية التي تُحدد من خلالها القيمة الأرشيفية الدائمة للوثائق والسجلات. وتعتمد القيمة الأرشيفية على معايير منها القيمة الإدارية والقانونية والمالية والتاريخية والبحثية، كما تزداد أهمية الوثيقة إذا كانت تقدم معلومات لا تتوفر في مصادر أخرى.</p><p>يتم الفرز بعد التقييم، وقد يكون الحفظ الدائم أو الإتلاف وفق جداول الاحتفاظ المحددة قانونياً. من الممارسات الهامة الاحتفاظ بسجلات تتبع قرارات الفرز لتوثيق مسار العملية وضمان الشفافية.</p>',
        contentEn:
          '<p>Archival appraisal is the process through which the permanent archival value of records and documents is determined. Archival value depends on criteria including administrative, legal, financial, historical and research value, and a document becomes more important if it provides information not available from other sources.</p><p>Disposal follows appraisal and may result in permanent retention or destruction according to legally defined retention schedules. An important practice is keeping records that track disposal decisions to document the process and ensure transparency.</p>',
        summaryAr: 'معايير تقييم الوثائق، جداول الاحتفاظ، واتخاذ قرارات الفرز والإتلاف',
        summaryEn: 'Document appraisal criteria, retention schedules, and making disposal decisions',
        estimatedReadingTime: 12,
        isAssessment: true,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'نموذج جدول احتفاظ',
            titleEn: 'Sample Retention Schedule',
            url: '/uploads/courses/fundamentals/retention-schedule.pdf',
            mimeType: 'application/pdf',
            fileSize: 850_000,
          },
        ],
      },
    ],
  },
  {
    titleAr: 'الحفظ الرقمي والاستمرارية',
    titleEn: 'Digital Preservation & Sustainability',
    slug: 'digital-preservation-sustainability',
    shortDescAr: 'استراتيجيات الحفظ الرقمي طويلة الأمد لضمان بقاء المواد الأرشيفية قابلة للوصول',
    shortDescEn: 'Long-term digital preservation strategies to ensure archival materials remain accessible',
    fullDescAr:
      'تعالج هذه الدورة أحد أخطر التحديات في العصر الرقمي: كيف نحافظ على المعلومات الرقمية قابلة للقراءة والوصول لعقود قادمة؟ يتناول البرنامج نموذج المرجعية المفتوحة للمعلومات النظامية OAIS، استراتيجيات التحويل والتغليف والتجديد الدوري، إدارة الوسائط والتخزين، وأهمية الفحص الدوري للبيانات لمنع التلف الصامت.',
    fullDescEn:
      'This course addresses one of the most serious challenges of the digital age: how to keep digital information readable and accessible for decades to come. The program covers the Open Archival Information System (OAIS) reference model, migration, encapsulation and periodic refresh strategies, media and storage management, and the importance of regular data integrity checks to prevent silent corruption.',
    categorySlug: 'digital-preservation',
    tagSlugs: ['digital-preservation', 'documentation'],
    difficulty: 'intermediate',
    duration: 150,
    estimatedStudyTime: 10,
    language: 'ar',
    instructorName: 'د. خالد المصري',
    instructorBio: 'أستاذ علم الأرشيف في جامعة القدس، وباحث متخصص في الذاكرة الفلسطينية.',
    archiveTopic: 'الرقمنة',
    region: 'الوطن العربي',
    historicalPeriod: 'العصر الرقمي',
    targetAudience: 'أمناء الأرشيف، مبرمجو المؤسسات الثقافية، مدراء المشاريع الرقمية',
    prerequisites: 'دورة أساسيات علم الأرشيف (موصى بها)',
    learningObjectives: [
      'فهم نموذج OAIS المرجعي',
      'إتقان استراتيجيات الحفظ الرقمي',
      'إدارة المخاطر والتلف الرقمي الصامت',
      'تصميم خطة حفظ رقمية لمؤسسة',
    ],
    isFeatured: false,
    isPopular: true,
    isFree: true,
    publishedAt: '2024-02-15',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'التحديات في الحفظ الرقمي',
        titleEn: 'Challenges in Digital Preservation',
        slug: 'digital-preservation-challenges',
        videoUrl: 'https://www.youtube.com/watch?v=cD5_4J8Z5L0',
        videoDuration: 480,
        contentAr:
          '<p>تواجه المواد الرقمية تهديدات لا تطال نظيرتها الورقية: تقادم الأجهزة والبرمجيات، تلف الوسائط (الأقراص والأشرطة)، والتلف الصامت للبيانات بسبب التغيرات الفيزيائية في وحدات التخزين. تشير الدراسات إلى أن بعض صيغ الملفات لم تعد قابلة للفتح بعد عقد واحد فقط.</p><p>الحفظ الرقمي ليس مهمة لمرة واحدة بل عملية مستمرة تتطلب التخطيط والموارد والإرادة المؤسسية. الفشل في التخطيط المبكر يعني خسارة محتوى لا يمكن تعويضه، وخاصة في الدول التي تعاني من نقص الموارد والبنية التحتية.</p>',
        contentEn:
          '<p>Digital materials face threats that their paper counterparts do not: hardware and software obsolescence, media decay (discs and tapes), and silent data corruption caused by physical changes in storage units. Studies indicate that some file formats are no longer openable after just one decade.</p><p>Digital preservation is not a one-time task but an ongoing process that requires planning, resources and institutional will. Failure to plan early means the loss of irreplaceable content, especially in countries facing resource and infrastructure shortages.</p>',
        summaryAr: 'أنواع التهديدات التي تواجه المواد الرقمية وأهمية التخطيط المبكر',
        summaryEn: 'Types of threats facing digital materials and the importance of early planning',
        estimatedReadingTime: 9,
      },
      {
        lessonNumber: 2,
        titleAr: 'نموذج OAIS المرجعي',
        titleEn: 'The OAIS Reference Model',
        slug: 'oais-reference-model',
        videoUrl: 'https://www.youtube.com/watch?v=BoI0aX1mLpQ',
        videoDuration: 600,
        contentAr:
          '<p>نموذج المرجعية المفتوحة للمعلومات النظامية OAIS هو المعيار الدولي ISO 14721 الذي يصف بنية نظام الأرشيف الرقمي ووظائفه. يحدد النموذج مفاهيم مثل حزمة المعلومات المودعة SIP وحزمة الأرشيف AIP وحزمة النشر DIP، ويصنف الوظائف الأساسية: الاستيعاب، التخزين، الإدارة، الحفظ، الوصول، والإدارة الشاملة.</p><p>اعتماد نموذج OAIS يساعد المؤسسات على تصميم أنظمتها وفق منهجية موحدة، ويمنح الثقة للممولين والشركاء بأن المادة ستبقى محفوظة وفق أفضل الممارسات العالمية.</p>',
        contentEn:
          '<p>The Open Archival Information System (OAIS) reference model is the international standard ISO 14721 that describes the structure and functions of a digital archive system. It defines concepts such as the Submission Information Package (SIP), the Archival Information Package (AIP) and the Dissemination Information Package (DIP), and classifies core functions: ingest, storage, administration, preservation, access, and overall management.</p><p>Adopting the OAIS model helps institutions design their systems according to a unified methodology and gives funders and partners confidence that material will remain preserved according to global best practices.</p>',
        summaryAr: 'المفاهيم الأساسية في OAIS: SIP وAIP وDIP والوظائف الرئيسية',
        summaryEn: 'Core OAIS concepts: SIP, AIP, DIP and the main functions',
        estimatedReadingTime: 12,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'ملخص معيار OAIS',
            titleEn: 'OAIS Standard Summary',
            url: '/uploads/courses/digital-preservation/oais-summary.pdf',
            mimeType: 'application/pdf',
            fileSize: 1_500_000,
          },
        ],
      },
      {
        lessonNumber: 3,
        titleAr: 'استراتيجيات الحفظ: الترحيل والتغليف',
        titleEn: 'Preservation Strategies: Migration and Encapsulation',
        slug: 'migration-and-encapsulation',
        videoUrl: 'https://www.youtube.com/watch?v=3v6kk9vTf9I',
        videoDuration: 550,
        contentAr:
          '<p>الترحيل هو نقل البيانات من صيغة أو وسيط تقادم إلى صيغة أو وسيط أحدث، مثل تحويل ملفات DOC القديمة إلى PDF/A. أما التغليف فيتضمن حفظ الملف مع كل البيانات الوصفية والبرمجيات اللازمة لتشغيله داخل حزمة واحدة. كما توجد استراتيجية المحاكاة التي تحاكي البيئة البرمجية الأصلية.</p><p>أفضل الممارسات تقتضي اعتماد صيغ مفتوحة وقياسية وموثقة مثل PDF/A وTIFF وWAV، مع تجنب الصيغ الاحتكارية، والاحتفاظ بنسخة الحفظ الأصلية منفصلة عن نسخ الاستخدام.</p>',
        contentEn:
          '<p>Migration is moving data from an obsolete format or medium to a newer one, such as converting old DOC files to PDF/A. Encapsulation involves keeping a file together with all the metadata and software needed to operate it inside a single package. There is also an emulation strategy that mimics the original software environment.</p><p>Best practices require adopting open, standard and well-documented formats such as PDF/A, TIFF and WAV, avoiding proprietary formats, and keeping the master preservation copy separate from access copies.</p>',
        summaryAr: 'الترحيل، التغليف، والمحاكاة + أهمية الصيغ المفتوحة القياسية',
        summaryEn: 'Migration, encapsulation and emulation, plus the importance of open standard formats',
        estimatedReadingTime: 11,
      },
      {
        lessonNumber: 4,
        titleAr: 'فحص التكامل ومنع التلف الصامت',
        titleEn: 'Integrity Checks and Preventing Silent Corruption',
        slug: 'integrity-checks',
        videoUrl: 'https://www.youtube.com/watch?v=sJ70bT5e9hg',
        videoDuration: 500,
        contentAr:
          '<p>التلف الصامت يحدث عندما تتغير بتات الملف دون أن يلاحظ أحد، وقد لا يظهر أثره إلا بعد سنوات عند محاولة فتح الملف. الحل المعياري هو توليد قيم تجزئة (checksum) مثل SHA-256 لكل ملف عند الحفظ، ثم إعادة الفحص دورياً ومقارنة القيم لاكتشاف أي اختلاف.</p><p>تنصح الممارسات الدولية بإجراء فحوصات دورية مجدولة، وتخزين نسخ متعددة في مواقع مختلفة (قاعدة 3-2-1)، واختبار استعادة النسخ الاحتياطية بانتظام بدلاً من الافتراض أنها تعمل.</p>',
        contentEn:
          '<p>Silent corruption occurs when the bits of a file change without anyone noticing, and its effect may not appear until years later when attempting to open the file. The standard solution is to generate hash values (checksums) such as SHA-256 for each file at ingest time, then periodically re-run checks and compare values to detect any discrepancy.</p><p>International practice recommends scheduled periodic checks, storing multiple copies in different locations (the 3-2-1 rule), and regularly testing restoration of backups rather than assuming they work.</p>',
        summaryAr: 'قيم التجزئة، قاعدة 3-2-1، واختبار استعادة النسخ الاحتياطية',
        summaryEn: 'Checksums, the 3-2-1 rule, and testing backup restoration',
        estimatedReadingTime: 8,
        isAssessment: true,
      },
    ],
  },
  {
    titleAr: 'معايير الوصف الأرشيفي ISAD(G)',
    titleEn: 'Archival Description Standards ISAD(G)',
    slug: 'archival-description-isadg',
    shortDescAr: 'تطبيق المعيار الدولي للوصف الأرشيفي وبناء التسلسل الهرمي للوصف',
    shortDescEn: 'Applying the international archival description standard and building the description hierarchy',
    fullDescAr:
      'يعد معيار ISAD(G) الأساس الذي يبنى عليه الوصف الأرشيفي الحديث. في هذه الدورة يتعلم الدارس بنية الوصف متعدد المستويات، وعناصر الوصف الستة والعشرين مقسمة على سبعة مجالات: الهوية، السياق، المحتوى، الإتاحة، المواد المتصلة، الملاحظات، وضبط الوصف. كما نستعرض صيغ الوصف المترابطة مثل EAD وDublin Core وتطبيقاتها العملية.',
    fullDescEn:
      'ISAD(G) is the foundation upon which modern archival description is built. In this course, learners study the multi-level description structure and the twenty-six description elements across seven areas: identity, context, content, access, related materials, notes, and description control. We also review related description formats such as EAD and Dublin Core and their practical applications.',
    categorySlug: 'cataloging-standards',
    tagSlugs: ['archives', 'documentation'],
    difficulty: 'intermediate',
    duration: 135,
    estimatedStudyTime: 9,
    language: 'ar',
    instructorName: 'أ. ريم العلي',
    instructorBio: 'أخصائية الفهرسة والوصف الأرشيفي في المكتبة الوطنية الفلسطينية، ومدربة معتمدة في معايير ISAD(G) وDublin Core.',
    archiveTopic: 'الفهرسة',
    region: 'الوطن العربي',
    historicalPeriod: 'العصر الحديث',
    targetAudience: 'أمناء الأرشيف، المفهرسون، العاملون في المكتبات والمتاحف',
    prerequisites: 'دورة أساسيات علم الأرشيف',
    learningObjectives: [
      'فهم بنية الوصف متعدد المستويات',
      'إتقان مجالات وعناصر ISAD(G) السبعة والعشرين',
      'تطبيق قواعد الوصف حسب قواعد المحتوى',
      'الربط بين ISAD(G) وEAD وDublin Core',
    ],
    isFeatured: false,
    isPopular: false,
    isFree: true,
    publishedAt: '2024-03-05',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'مقدمة إلى معيار ISAD(G)',
        titleEn: 'Introduction to ISAD(G)',
        slug: 'introduction-to-isadg',
        videoUrl: 'https://www.youtube.com/watch?v=UZq8aX2h0VE',
        videoDuration: 520,
        contentAr:
          '<p>صدر معيار الوصف الأرشيفي العام ISAD(G) لأول مرة عام 1994 وحدّث عام 2000 عن المجلس الدولي للأرشيف ICA. يهدف المعيار إلى توحيد طريقة وصف الوثائق الأرشيفية في كل العالم، بما يسمح بتبادل المعلومات والبيانات الوصفية بين المؤسسات والأنظمة المختلفة.</p><p>تتضمن فلسفة المعيار مبدأ الوصف من العام إلى الخاص، والتدرج الهرمي من المقتنى الكامل (fonds) حتى مستوى الوثيقة المفردة، مع مراعاة ربط كل مستوى بمستوياته الأعلى والأدنى.</p>',
        contentEn:
          '<p>The General International Standard Archival Description ISAD(G) was first issued in 1994 and updated in 2000 by the International Council on Archives (ICA). The standard aims to unify the way archival documents are described around the world, allowing the exchange of information and descriptive metadata between different institutions and systems.</p><p>The philosophy of the standard embodies the principle of describing from the general to the specific, and the hierarchical progression from the full fonds down to the individual item level, linking each level to its higher and lower levels.</p>',
        summaryAr: 'نشأة المعيار وأهدافه ومبدأ الوصف من العام إلى الخاص',
        summaryEn: 'Origin and goals of the standard and the general-to-specific description principle',
        estimatedReadingTime: 9,
      },
      {
        lessonNumber: 2,
        titleAr: 'مجالات الوصف وعناصره',
        titleEn: 'Description Areas and Elements',
        slug: 'description-areas-and-elements',
        videoUrl: 'https://www.youtube.com/watch?v=m5yYqkZT1Ls',
        videoDuration: 650,
        contentAr:
          '<p>يقسم المعيار الوصف إلى سبعة مجالات رئيسية: منطقة الهوية (تتضمن العنوان والمختصر والمرجعية والرصيد التواريخي)، منطقة السياق (تاريخ المقتنى وأصله وبيانات استلامه)، منطقة المحتوى والبنية، منطقة الإتاحة والاستخدام، منطقة المواد ذات الصلة، منطقة الملاحظات، ومنطقة ضبط الوصف.</p><p>بعض العناصر أساسية إلزامية وبعضها اختياري، ويلزم التمييز بينها لضمان اكتمال الوصف دون إغراق المستخدم بمعلومات زائدة.</p>',
        contentEn:
          '<p>The standard divides description into seven main areas: the identity area (title, creator, reference code and date range), the context area (history of the fonds, its origin and acquisition information), the content and structure area, the conditions of access and use area, the allied materials area, the notes area, and the description control area.</p><p>Some elements are mandatory and others optional, and it is necessary to distinguish between them to ensure the completeness of the description without overwhelming the user with excessive information.</p>',
        summaryAr: 'المجالات السبعة للوصف والفرق بين العناصر الإلزامية والاختيارية',
        summaryEn: 'The seven description areas and the difference between mandatory and optional elements',
        estimatedReadingTime: 12,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'مصفوفة عناصر ISAD(G)',
            titleEn: 'ISAD(G) Elements Matrix',
            url: '/uploads/courses/isadg/elements-matrix.pdf',
            mimeType: 'application/pdf',
            fileSize: 980_000,
          },
        ],
      },
      {
        lessonNumber: 3,
        titleAr: 'الوصف متعدد المستويات',
        titleEn: 'Multi-level Description',
        slug: 'multi-level-description',
        videoUrl: 'https://www.youtube.com/watch?v=JlQWtWqBCPE',
        videoDuration: 580,
        contentAr:
          '<p>يقوم الوصف الأرشيفي على أربعة قواعد رئيسية: (1) الوصف من العام إلى الخاص، (2) توفير المعلومات ذات الصلة بالمستوى الموصوف فقط، (3) ربط الوصف كل مستوى بمستوى أعلى، و(4) عدم تكرار المعلومات المذكورة في مستويات أعلى.</p><p>يمثل هذا التدرج أهمية كبيرة لتفاهم المستخدمين، حيث يبدأ الباحث من مستوى المقتنى الكامل ثم ينزل تدريجياً إلى السلسلة والملف والوثيقة، مستنداً إلى علاقات الترابط الموثقة في نظام الفهرسة.</p>',
        contentEn:
          '<p>Archival description rests on four main rules: (1) description from the general to the specific, (2) providing only the information relevant to the level being described, (3) linking each description to its next higher level, and (4) not repeating information already given at higher levels.</p><p>This hierarchy is of great importance for user understanding, as the researcher begins at the fonds level and gradually descends to the series, file and item, guided by the documented hierarchical relations in the cataloging system.</p>',
        summaryAr: 'القواعد الأربع للوصف الهرمي وكيفية تنقل الباحث بين المستويات',
        summaryEn: 'The four rules of hierarchical description and how researchers navigate between levels',
        estimatedReadingTime: 10,
        isAssessment: true,
      },
    ],
  },
  {
    titleAr: 'إدارة السجلات في المؤسسات',
    titleEn: 'Records Management in Institutions',
    slug: 'records-management-institutions',
    shortDescAr: 'دورة حياة السجلات من الإنشاء إلى الإتلاف أو الحفظ الدائم',
    shortDescEn: 'The records lifecycle from creation to disposal or permanent retention',
    fullDescAr:
      'تُعنى إدارة السجلات بالسيطرة المنتظمة على إنشاء السجلات واستخدامها وحفظها وإتاحتها من لحظة إنشائها حتى إتلافها أو نقلها إلى الأرشيف الدائم. تغطي الدورة عناصر نظام إدارة السجلات: السياسات، جداول الاحتفاظ، التصنيف، السيطرة على الإصدارات، السجلات الإلكترونية، والحوكمة والامتثال. تتضمن الدورة تطبيقات عملية على إدارة السجلات المالية والإدارية والموارد البشرية.',
    fullDescEn:
      'Records management is concerned with the systematic control over the creation, use, maintenance and disposition of records from the moment of their creation until their disposal or transfer to the permanent archive. The course covers the elements of a records management system: policies, retention schedules, classification, version control, electronic records, and governance and compliance. It includes practical applications for managing financial, administrative and human resources records.',
    categorySlug: 'records-management',
    tagSlugs: ['archives', 'documentation'],
    difficulty: 'beginner',
    duration: 110,
    estimatedStudyTime: 7,
    language: 'ar',
    instructorName: 'أ. ريم العلي',
    instructorBio: 'أخصائية الفهرسة والوصف الأرشيفي في المكتبة الوطنية الفلسطينية.',
    targetAudience: 'مدراء المكاتب، موظفو السكرتارية، مسؤولو الأرشيف الجاري',
    prerequisites: 'لا توجد متطلبات مسبقة',
    learningObjectives: [
      'فهم دورة حياة السجلات',
      'إعداد جداول الاحتفاظ والتصنيف',
      'إدارة السجلات الإلكترونية',
      'تطبيق سياسات الحوكمة والامتثال',
    ],
    isFeatured: false,
    isPopular: false,
    isFree: true,
    publishedAt: '2024-04-12',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'دورة حياة السجلات',
        titleEn: 'The Records Lifecycle',
        slug: 'records-lifecycle',
        videoUrl: 'https://www.youtube.com/watch?v=9wvQmBvLhE8',
        videoDuration: 560,
        contentAr:
          '<p>تمر السجلات بمراحل محددة تعرف بدورة الحياة: الإنشاء أو الاستلام، الاستخدام النشط، الحفظ شبه النشط، ثم إما الإتلاف أو النقل إلى الأرشيف الدائم. لكل مرحلة متطلبات مختلفة من حيث سرعة الوصول وطرق الحفظ ومستوى الأمان.</p><p>النظرية الحديثة تفيد بأن التخطيط لنهاية حياة السجل يجب أن يبدأ في مرحلة التصميم نفسها، وهذا ما يعرف بالتقييم المسبق الذي يضمن أن السجلات المهمة لا تُتلف وأن السجلات عديمة القيمة لا تستهلك الموارد.</p>',
        contentEn:
          '<p>Records pass through defined stages known as the lifecycle: creation or receipt, active use, semi-active retention, and then either disposal or transfer to the permanent archive. Each stage has different requirements in terms of access speed, preservation methods and security levels.</p><p>Modern theory holds that planning for the end of a record\u2019s life should begin at the design stage itself, known as pre-appraisal, ensuring important records are not destroyed and worthless records do not consume resources.</p>',
        summaryAr: 'مراحل دورة حياة السجل والتقييم المسبق لضمان سلامة القرارات',
        summaryEn: 'Stages of the records lifecycle and pre-appraisal to ensure sound decisions',
        estimatedReadingTime: 10,
      },
      {
        lessonNumber: 2,
        titleAr: 'جداول الاحتفاظ والتصنيف',
        titleEn: 'Retention Schedules and Classification',
        slug: 'retention-schedules',
        videoUrl: 'https://www.youtube.com/watch?v=xn7TZ0uM01Q',
        videoDuration: 600,
        contentAr:
          '<p>جدول الاحتفاظ هو الوثيقة التي تحدد مدة الاحتفاظ بكل نوع من أنواع السجلات والإجراء المتبع بعد انتهاء المدة: الإتلاف أو النقل للأرشيف الدائم. يبني جدول الاحتفاظ على تحليل عمليات المؤسسة وقيمها الإدارية والقانونية والمالية.</p><p>نظام التصنيف يحدد ترتيب السجلات وتنظيمها في مجموعات منطقية وفق مهام المؤسسة، ويسهل استرجاعها. الأنظمة الحديثة تستخدم أنظمة تصنيف وظيفية قائمة على مهام المؤسسة وليس على هيكلها التنظيمي، مما يجعلها مستقرة عبر التغييرات الإدارية.</p>',
        contentEn:
          '<p>A retention schedule is the document that determines how long each type of record is kept and the action taken after the period ends: destruction or transfer to the permanent archive. The schedule is built on an analysis of the institution\u2019s operations and their administrative, legal and financial values.</p><p>The classification system determines the arrangement and organization of records into logical groups according to the institution\u2019s functions, facilitating retrieval. Modern systems use functional classification based on the institution\u2019s functions rather than its organizational structure, making them stable across administrative changes.</p>',
        summaryAr: 'بناء جداول الاحتفاظ وأنظمة التصنيف الوظيفية',
        summaryEn: 'Building retention schedules and functional classification systems',
        estimatedReadingTime: 11,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'قالب جدول احتفاظ قابل للتعديل',
            titleEn: 'Editable Retention Schedule Template',
            url: '/uploads/courses/records-management/retention-template.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            fileSize: 420_000,
          },
        ],
      },
      {
        lessonNumber: 3,
        titleAr: 'السجلات الإلكترونية والحوكمة',
        titleEn: 'Electronic Records and Governance',
        slug: 'electronic-records-governance',
        videoUrl: 'https://www.youtube.com/watch?v=hYg9r8DpV4A',
        videoDuration: 640,
        contentAr:
          '<p>مع تحول المؤسسات إلى العمل الرقمي ظهرت حاجة ملحة لإدارة السجلات الإلكترونية بنفس الدقة المطبقة على الورقية: إثبات الصحة، والسيطرة على الإصدارات، وضمان عدم التحوير. المعيار الدولي ISO 15489 يضع الأسس المفاهيمية لإدارة السجلات بأنواعها.</p><p>الحوكمة تعني وجود ملكية واضحة للسجلات، ومحاسبة على القرارات، والامتثال للتشريعات مثل قوانين حماية البيانات والخصوصية. المؤسسات التي تهمل إدارة سجلاتها الإلكترونية تعرض نفسها لمخاطر قانونية ومالية كبيرة.</p>',
        contentEn:
          '<p>With institutions shifting to digital work, there is an urgent need to manage electronic records with the same rigor applied to paper: authenticity, version control, and ensuring non-tampering. The international standard ISO 15489 lays the conceptual foundations for managing records of all kinds.</p><p>Governance means clear ownership of records, accountability for decisions, and compliance with legislation such as data protection and privacy laws. Institutions that neglect managing their electronic records expose themselves to significant legal and financial risks.</p>',
        summaryAr: 'إدارة السجلات الإلكترونية وفق ISO 15489 ومتطلبات الحوكمة والامتثال',
        summaryEn: 'Managing electronic records per ISO 15489 and governance and compliance requirements',
        estimatedReadingTime: 12,
        isAssessment: true,
      },
    ],
  },
  {
    titleAr: 'جمع التاريخ الشفوي',
    titleEn: 'Collecting Oral History',
    slug: 'collecting-oral-history',
    shortDescAr: 'منهجيات إعداد المقابلات الشفوية وتوثيق ذاكرة المجتمع الفلسطيني',
    shortDescEn: 'Methodologies for preparing oral interviews and documenting Palestinian community memory',
    fullDescAr:
      'التاريخ الشفوي هو منهجية بحثية وأرشيفية تهدف إلى تسجيل الذاكرة الحية للأفراد والجماعات. تشرح الدورة مراحل المشروع: اختيار الموضوع، البحث الأولي، تحضير أسئلة المقابلة، مهارات إجراء المقابلة وتوجيه الأسئلة، التسجيل عالي الجودة، التفريغ والمعالجة، والمتطلبات الأخلاقية للموافقة المسبقة وحقوق النشر. الدورة مزودة بنماذج تطبيقية من مشاريع توثيق النكبة والشتات الفلسطيني.',
    fullDescEn:
      'Oral history is a research and archival methodology aimed at recording the living memory of individuals and communities. The course explains the stages of a project: choosing the topic, preliminary research, preparing interview questions, interview and questioning skills, high-quality recording, transcription and processing, and the ethical requirements of informed consent and copyright. The course is equipped with applied examples from Palestinian Nakba and diaspora documentation projects.',
    categorySlug: 'oral-history',
    tagSlugs: ['documentation', 'heritage'],
    difficulty: 'beginner',
    duration: 140,
    estimatedStudyTime: 9,
    language: 'ar',
    instructorName: 'أ. ريم العلي',
    instructorBio: 'أخصائية الفهرسة والوصف الأرشيفي في المكتبة الوطنية الفلسطينية، ومدربة في مشاريع التاريخ الشفوي.',
    archiveTopic: 'التاريخ الشفوي',
    region: 'فلسطين',
    historicalPeriod: 'النكبة - اليوم',
    targetAudience: 'باحثو التاريخ الشفهي، الصحفيون، العاملون في مؤسسات التراث',
    prerequisites: 'لا توجد متطلبات مسبقة',
    learningObjectives: [
      'تصميم مشروع تاريخ شفوي متكامل',
      'إعداد دليل أسئلة مقابلة فعّال',
      'إجراء المقابلات وتسجيلها بجودة عالية',
      'الالتزام بالمعايير الأخلاقية والقانونية',
    ],
    isFeatured: true,
    isPopular: false,
    isFree: true,
    publishedAt: '2024-05-20',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'أساسيات التاريخ الشفوي',
        titleEn: 'Fundamentals of Oral History',
        slug: 'oral-history-fundamentals',
        videoUrl: 'https://www.youtube.com/watch?v=1pB7djbF0hA',
        videoDuration: 590,
        contentAr:
          '<p>التاريخ الشفوي ليس مجرد تسجيل لحكايات، بل منهجية علمية تهدف إلى إنشاء وثيقة أرشيفية جديدة من خلال الحوار المخطط. تختلف قيمة التاريخ الشفوي في توثيق تجارب المجموعات التي لا تترك أثراً وثائقياً، مثل النساء والفئات المهمشة وشهادات النكبة.</p><p>منذ الثمانينيات أصبح التاريخ الشفوي جزءاً من منهجية البحث التاريخي الحديث، وتطورت قواعده الأخلاقية عبر جمعية التاريخ الشفوي OHA والمجلس الدولي للأرشيف.</p>',
        contentEn:
          '<p>Oral history is not merely recording stories but a scientific methodology aimed at creating a new archival document through planned dialogue. The value of oral history lies in documenting the experiences of groups that leave no documentary trace, such as women, marginalized groups and Nakba testimonies.</p><p>Since the 1980s, oral history has become part of modern historical research methodology, and its ethical rules have evolved through the Oral History Association (OHA) and the International Council on Archives.</p>',
        summaryAr: 'التاريخ الشفوي كمنهجية علمية وأهميته في توثيق الذاكرة الفلسطينية',
        summaryEn: 'Oral history as a scientific methodology and its importance in documenting Palestinian memory',
        estimatedReadingTime: 10,
      },
      {
        lessonNumber: 2,
        titleAr: 'تحضير المقابلة ودليل الأسئلة',
        titleEn: 'Preparing the Interview and Question Guide',
        slug: 'preparing-interview-guide',
        videoUrl: 'https://www.youtube.com/watch?v=9O3P7j5YbrM',
        videoDuration: 630,
        contentAr:
          '<p>التحضير الجيد هو نصف نجاح المقابلة: يبدأ بالبحث الأولي في المصادر المتاحة حول الموضوع والشخص، ثم إعداد دليل أسئلة مفتوحة يبدأ من الأسئلة العامة نحو الأسئلة الأعمق. يجب تجنب الأسئلة الموجهة أو الثنائية التي تختصر الإجابة بنعم أو لا.</p><p>ترتيب الأسئلة يتبع التسلسل الزمني غالباً لأنه يساعد الراوي على استرجاع الذكريات بشكل طبيعي. من المستحسن تجهيز مواد مساعدة كالصور والخرائط لتحفيز الذاكرة أثناء المقابلة.</p>',
        contentEn:
          '<p>Good preparation is half the success of the interview: it begins with preliminary research into available sources about the topic and the person, then preparing an open-question guide moving from general questions to deeper ones. Leading or closed questions that shorten answers to yes or no must be avoided.</p><p>Question ordering often follows chronology because it helps the narrator recall memories naturally. It is advisable to prepare supporting materials such as photographs and maps to stimulate memory during the interview.</p>',
        summaryAr: 'البحث الأولي، بناء دليل أسئلة مفتوحة، واستخدام المواد المساعدة',
        summaryEn: 'Preliminary research, building an open-question guide, and using supporting materials',
        estimatedReadingTime: 11,
      },
      {
        lessonNumber: 3,
        titleAr: 'مهارات إجراء المقابلة',
        titleEn: 'Interview Conducting Skills',
        slug: 'interview-conducting-skills',
        videoUrl: 'https://www.youtube.com/watch?v=kH3f5bZq0Fk',
        videoDuration: 610,
        contentAr:
          '<p>نجاح المقابلة يعتمد على بناء الثقة: البدء بمحادثة ودية، وشرح هدف المقابلة وكيفية استخدامها، والتأكد من الموافقة المسبقة. أثناء المقابلة يعتمد الباحث على الاستماع الفعال، وطرح أسئلة متابعة مبنية على إجابات الراوي، وإتاحة لحظات الصمت للتفكير.</p><p>يجب مراقبة جودة التسجيل طوال الوقت، وتسجيل ملاحظات ميدانية عن سياق المقابلة وحالة الراوي، لأن هذه الملاحظات تشكل جزءاً من البيانات الوصفية للوثيقة.</p>',
        contentEn:
          '<p>The success of the interview depends on building trust: starting with a friendly conversation, explaining the purpose of the interview and how it will be used, and ensuring informed consent. During the interview, the researcher relies on active listening, asking follow-up questions built on the narrator\u2019s answers, and allowing moments of silence for reflection.</p><p>Recording quality must be monitored throughout, and field notes taken about the interview context and the narrator\u2019s state, as these notes form part of the document\u2019s descriptive metadata.</p>',
        summaryAr: 'بناء الثقة، الاستماع الفعال، أسئلة المتابعة، والتوثيق الميداني',
        summaryEn: 'Building trust, active listening, follow-up questions, and field documentation',
        estimatedReadingTime: 11,
      },
      {
        lessonNumber: 4,
        titleAr: 'الأخلاقيات والتفريغ والنشر',
        titleEn: 'Ethics, Transcription and Publication',
        slug: 'ethics-transcription',
        videoUrl: 'https://www.youtube.com/watch?v=Bb8b5jYb0rI',
        videoDuration: 570,
        contentAr:
          '<p>التزام الأمانة في التاريخ الشفوي يبدأ قبل التسجيل: الحصول على موافقة مسبقة واضحة، وشرح حقوق الراوي في مراجعة المواد وتعديلها أو الانسحاب. يجب توقيع نماذج نقل الحقوق التي تحدد كيفية استخدام المادة ونشرها.</p><p>التفريغ يتم حرفياً قدر الإمكان ثم يُراجع بعناية، ويضاف إلى الملف الوصفي معلومات عن مكان وتاريخ المقابلة وشروط الإتاحة. تتبنى مؤسسات كثيرة سياسات إتاحة تحمي الراوي بينما تتيح المادة للباحثين.</p>',
        contentEn:
          '<p>Commitment to integrity in oral history begins before recording: obtaining clear informed consent, and explaining the narrator\u2019s rights to review, amend or withdraw materials. Deed of gift forms defining how the material may be used and published must be signed.</p><p>Transcription is done as literally as possible then carefully reviewed, and descriptive file information is added about the place and date of the interview and access conditions. Many institutions adopt access policies that protect the narrator while making the material available to researchers.</p>',
        summaryAr: 'الموافقة المسبقة، نماذج نقل الحقوق، ومعايير التفريغ والإتاحة',
        summaryEn: 'Informed consent, deed of gift forms, and transcription and access standards',
        estimatedReadingTime: 10,
        isAssessment: true,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'نموذج موافقة مسبقة',
            titleEn: 'Informed Consent Template',
            url: '/uploads/courses/oral-history/consent-form.pdf',
            mimeType: 'application/pdf',
            fileSize: 640_000,
          },
          {
            type: 'pdf',
            titleAr: 'دليل التفريغ',
            titleEn: 'Transcription Guide',
            url: '/uploads/courses/oral-history/transcription-guide.pdf',
            mimeType: 'application/pdf',
            fileSize: 720_000,
          },
        ],
      },
    ],
  },
  {
    titleAr: 'الرقمنة وتصوير الوثائق',
    titleEn: 'Digitization & Document Imaging',
    slug: 'digitization-document-imaging',
    shortDescAr: 'الأسس التقنية والعملية لتحويل الوثائق الورقية إلى مواد رقمية عالية الجودة',
    shortDescEn: 'Technical and practical foundations for converting paper documents into high-quality digital materials',
    fullDescAr:
      'تُعد الرقمنة الخطوة الأولى نحو الحفظ الرقمي. تقدم هذه الدورة التدريب العملي على تخطيط مشاريع الرقمنة: تحديد الأولويات، تجهيز الوثائق وتنظيفها، اختيار المعدات (الماسحات الضوئية والكاميرات)، ضبط إعدادات الدقة والألوان وفق معايير FADGI، تسمية الملفات، ومعايير الجودة والمراجعة. الدورة تستعرض أيضاً الخيارات بين الرقمنة داخل المؤسسة أو عبر شركات خارجية ومقارنة التكاليف.',
    fullDescEn:
      'Digitization is the first step toward digital preservation. This course provides hands-on training on planning digitization projects: setting priorities, preparing and cleaning documents, choosing equipment (scanners and cameras), adjusting resolution and color settings according to FADGI standards, file naming, and quality review standards. The course also reviews options between in-house digitization and outsourcing, with cost comparisons.',
    categorySlug: 'digitization',
    tagSlugs: ['digital-preservation', 'documentation'],
    difficulty: 'intermediate',
    duration: 160,
    estimatedStudyTime: 10,
    language: 'ar',
    instructorName: 'د. خالد المصري',
    instructorBio: 'أستاذ علم الأرشيف في جامعة القدس، ومشرف على مشاريع رقمنة الأرشيف الفلسطيني.',
    archiveTopic: 'الرقمنة',
    region: 'الوطن العربي',
    historicalPeriod: 'العصر الرقمي',
    targetAudience: 'فنيو التصوير، مسؤولو المشاريع، أمناء الأرشيف',
    prerequisites: 'دورة أساسيات علم الأرشيف',
    learningObjectives: [
      'تخطيط مشروع رقمنة من الصفر',
      'تطبيق معايير FADGI للجودة',
      'إدارة تسمية الملفات والبيانات الوصفية',
      'مقارنة الرقمنة الداخلية والتعاقد الخارجي',
    ],
    isFeatured: false,
    isPopular: false,
    isFree: true,
    publishedAt: '2024-06-08',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'تخطيط مشروع الرقمنة',
        titleEn: 'Planning the Digitization Project',
        slug: 'digitization-planning',
        videoUrl: 'https://www.youtube.com/watch?v=R6S1O3_1mWw',
        videoDuration: 540,
        contentAr:
          '<p>أي مشروع رقمنة ناجح يبدأ بتخطيط دقيق: تحديد الأهداف ولماذا نرقمن (الحفظ أم الإتاحة أم كلاهما)، واختيار المجموعات ذات الأولوية وفق قيمتها واستخدامها وحالتها المادية، ووضع ميزانية واقعية تشمل المعدات والقوى العاملة والتخزين.</p><p>من الخطأ الشائع البدء بشراء المعدات قبل تحديد الأهداف. المعايير الحديثة تفترض اعتماد ملف مواصفات المشروع يحدد الجودة المستهدفة وعدد الوحدات المتوقع معالجتها يومياً.</p>',
        contentEn:
          '<p>Any successful digitization project begins with careful planning: defining goals and why we digitize (preservation, access, or both), selecting priority collections according to their value, use and physical condition, and building a realistic budget covering equipment, labor and storage.</p><p>A common mistake is buying equipment before defining goals. Modern standards assume adopting a project specification document that defines the target quality and the expected number of units processed daily.</p>',
        summaryAr: 'تحديد الأهداف، الأولويات، والميزانية قبل شراء أي معدات',
        summaryEn: 'Defining goals, priorities and budget before buying any equipment',
        estimatedReadingTime: 9,
      },
      {
        lessonNumber: 2,
        titleAr: 'المعدات والإعدادات وفق FADGI',
        titleEn: 'Equipment and Settings per FADGI',
        slug: 'equipment-fadgi',
        videoUrl: 'https://www.youtube.com/watch?v=c5dZ0cZ5b3s',
        videoDuration: 680,
        contentAr:
          '<p>معيار FADGI الصادر عن مؤسسة المكتبات والمحفوظات الأمريكية يقسم جودة الرقمنة إلى أربعة مستويات (3 إلى 1) تحددها الدقة والعمق اللوني. الوثائق النصية عادة ترقمن بمعدل 300-400 نقطة بالبوصة، بينما المخطوطات الدقيقة والصور تحتاج 600 نقطة أو أكثر.</p><p>من عناصر الجودة الهامة: استخدام أهداف المعايرة اللونية، توحيد الإضاءة، الحفظ بصيغة TIFF غير مضغوطة كنسخة رئيسية، وإنتاج نسخة JPEG مشتقة للعرض السريع.</p>',
        contentEn:
          '<p>The FADGI standard issued by the US Federal Agencies Digital Guidelines Initiative divides digitization quality into four levels (3 to 1) defined by resolution and color depth. Text documents are typically digitized at 300-400 dpi, while fine manuscripts and photographs require 600 dpi or more.</p><p>Important quality elements include: using color calibration targets, standardizing lighting, saving in uncompressed TIFF as a master copy, and producing a derived JPEG for fast viewing.</p>',
        summaryAr: 'مستويات FADGI، الدقة المطلوبة، والمعايرة اللونية واختيار الصيغ',
        summaryEn: 'FADGI levels, required resolution, color calibration and format selection',
        estimatedReadingTime: 12,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'جدول إعدادات FADGI',
            titleEn: 'FADGI Settings Chart',
            url: '/uploads/courses/digitization/fadgi-chart.pdf',
            mimeType: 'application/pdf',
            fileSize: 890_000,
          },
        ],
      },
      {
        lessonNumber: 3,
        titleAr: 'تسمية الملفات والبيانات الوصفية',
        titleEn: 'File Naming and Metadata',
        slug: 'file-naming-metadata',
        videoUrl: 'https://www.youtube.com/watch?v=2y7J9B7hR4Q',
        videoDuration: 500,
        contentAr:
          '<p>تسمية الملفات المنتظمة أساس قابلية الاسترجاع: توظف بنية ثابتة تحدد المؤسسة والسلسلة والرقم الأرشيفي والنسخة، مع تجنب الأحرف غير الصالحة والمسافات. يُستخدم عادة تسلسل أرقام الصفر البادئة لتسهيل الفرز الآلي.</p><p>ترتبط كل صورة رقمية بسجل البيانات الوصفية الذي يربطها بالرقم الأرشيفي للوثيقة الأم. أفضل الممارسات توصي بتوليد ملف CSV أو استخدام معايير METS لنقل البيانات الوصفية مع الملفات عند التبادل بين الأنظمة.</p>',
        contentEn:
          '<p>Systematic file naming is the basis of retrievability: a fixed structure defining institution, series, archive number and version, while avoiding invalid characters and spaces. Zero-padded numeric sequences are commonly used to facilitate automatic sorting.</p><p>Each digital image is linked to a metadata record that connects it to the parent document\u2019s archive number. Best practice recommends generating a CSV file or using METS standards to transfer metadata with files when exchanging between systems.</p>',
        summaryAr: 'بنية تسمية الملفات وربطها بالبيانات الوصفية ومعايير التبادل',
        summaryEn: 'File naming structure and linking to metadata and exchange standards',
        estimatedReadingTime: 9,
      },
      {
        lessonNumber: 4,
        titleAr: 'الرقمنة داخل المؤسسة أم التعاقد الخارجي',
        titleEn: 'In-house Digitization vs Outsourcing',
        slug: 'inhouse-vs-outsourcing',
        videoUrl: 'https://www.youtube.com/watch?v=ZlZ8dIx5ROs',
        videoDuration: 480,
        contentAr:
          '<p>القرار بين الرقمنة داخل المؤسسة أو عبر شركة متخصصة يعتمد على حجم المجموعة والاستمرارية والميزانية. الرقمنة الداخلية تمنح تحكماً كاملاً وتنمية مهارات مستدامة لكنها تتطلب استثماراً في المعدات والتدريب، بينما يقلل التعاقد الخارجي الاستثمار الأولي لكنه يفرض سياسات صارمة لضمان سرية المواد وسلامتها أثناء نقلها.</p><p>يُنصح بالأساليب المختلطة: رقمنة المجموعات الحساسة داخلياً، والتعاقد الخارجي للمجموعات الكبيرة منخفضة الحساسية، مع عقد يحدد مواصفات الجودة وحقوق الصور المنتجة.</p>',
        contentEn:
          '<p>The decision between in-house digitization and a specialized contractor depends on collection size, continuity and budget. In-house digitization gives full control and sustainable skill development but requires investment in equipment and training, while outsourcing reduces initial investment but imposes strict policies to ensure the confidentiality and safety of materials during transport.</p><p>Hybrid approaches are recommended: digitizing sensitive collections in-house, and outsourcing large low-sensitivity collections, with a contract specifying quality specifications and rights over produced images.</p>',
        summaryAr: 'مقارنة التكاليف والمزايا والنهج المختلط وأحكام العقود',
        summaryEn: 'Cost and benefit comparison, hybrid approach and contract provisions',
        estimatedReadingTime: 8,
        isAssessment: true,
      },
    ],
  },
  {
    titleAr: 'الأرشيف السمعي البصري',
    titleEn: 'Audiovisual Archiving',
    slug: 'audiovisual-archiving',
    shortDescAr: 'حفظ وإدارة المواد السمعية والبصرية من التسجيل إلى الترميم الرقمي',
    shortDescEn: 'Preserving and managing audiovisual materials from recording to digital restoration',
    fullDescAr:
      'تشكل المواد السمعية والبصرية (أشرطة، أفلام، تسجيلات إذاعية وتلفزيونية) تحدياً خاصاً للأرشفيين بسبب تقادم الوسائط وتعقيد المعدات. تغطي الدورة أنواع الوسائط وخصائصها، علامات التحلل والكشف المبكر، ظروف التخزين البيئية، التحويل الرقمي للأشرطة، الترميم الصوتي والصوري الأساسي، وإدارة ملفات الفيديو الرقمية الضخمة بما يشمل الصيغ والتحويل البرمجي والنقل الذكي.',
    fullDescEn:
      'Audiovisual materials (tapes, films, radio and television recordings) present a special challenge to archivists due to media obsolescence and equipment complexity. The course covers media types and their characteristics, signs of degradation and early detection, environmental storage conditions, digital transfer of tapes, basic audio and video restoration, and managing massive digital video files including formats, transcoding and smart transfer.',
    categorySlug: 'audiovisual-archives',
    tagSlugs: ['archives', 'digital-preservation'],
    difficulty: 'advanced',
    duration: 180,
    estimatedStudyTime: 12,
    language: 'ar',
    instructorName: 'أ. ريم العلي',
    instructorBio: 'أخصائية الفهرسة والوصف الأرشيفي في المكتبة الوطنية الفلسطينية، ومهتمة بالأرشيف السمعي البصري.',
    archiveTopic: 'الوسائط المتعددة',
    region: 'الوطن العربي',
    historicalPeriod: 'القرن العشرين',
    targetAudience: 'محررو الوسائط، أمناء الأرشيف الإذاعي والتلفزيوني، مخرجون وثائقيون',
    prerequisites: 'دورة الحفظ الرقمي والاستمرارية',
    learningObjectives: [
      'تحديد أنواع الوسائط السمعية البصرية وخصائصها',
      'اكتشاف علامات التحلل المبكرة',
      'تنفيذ التحويل الرقمي للأشرطة',
      'إدارة ملفات الفيديو الكبيرة والصيغ',
    ],
    isFeatured: false,
    isPopular: false,
    isFree: true,
    publishedAt: '2024-07-15',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'أنواع الوسائط السمعية البصرية',
        titleEn: 'Types of Audiovisual Media',
        slug: 'audiovisual-media-types',
        videoUrl: 'https://www.youtube.com/watch?v=qM2O0jN8D9U',
        videoDuration: 620,
        contentAr:
          '<p>تنقسم الوسائط السمعية البصرية إلى أشرطة صوتية (بكرة، كاسيت)، وأشرطة فيديو (VHS، Betacam، U-matic)، وأفلام سينمائية (8 مم، 16 مم، 35 مم)، وأقراص بصرية (CD وDVD). لكل نوع خصائص فيزيائية وكيميائية تحدد سرعة تحلله وشروط حفظه.</p><p>الأشرطة المغناطيسية تعاني من تلاشي الإشارة المغناطيسية مع الزمن وخاصة بكرة الصوت، فيما تتعرض الأقراص البصرية للتأكسد وتقشر الطبقة العاكسة. معرفة خصائص كل وسيط تسمح بتقدير الأولوية في عمليات التحويل الرقمي.</p>',
        contentEn:
          '<p>Audiovisual media are divided into audio tapes (reel, cassette), video tapes (VHS, Betacam, U-matic), cinematic films (8mm, 16mm, 35mm), and optical discs (CD and DVD). Each type has physical and chemical characteristics that determine its decay rate and storage conditions.</p><p>Magnetic tapes suffer from magnetic signal fade over time, especially audio reels, while optical discs are subject to oxidation and delamination of the reflective layer. Knowing the characteristics of each medium allows estimating priority in digital transfer operations.</p>',
        summaryAr: 'تصنيف الوسائط وخصائصها الفيزيائية ومعدلات التحلل',
        summaryEn: 'Media classification, physical characteristics and decay rates',
        estimatedReadingTime: 11,
      },
      {
        lessonNumber: 2,
        titleAr: 'التخزين البيئي واكتشاف التحلل',
        titleEn: 'Environmental Storage and Degradation Detection',
        slug: 'environmental-storage-degradation',
        videoUrl: 'https://www.youtube.com/watch?v=5Yqf9s6dG0I',
        videoDuration: 580,
        contentAr:
          '<p>توصي المعايير الدولية (مثل تلك الصادرة عن مكتبة الكونغرس) بتخزين الوسائط السمعية البصرية في درجات حرارة منخفضة (2-10 درجات) ورطوبة 20-40%. كل ارتفاع في الحرارة أو الرطوبة يسرّع التفاعلات الكيميائية المؤدية للتحلل.</p><p>يُعرف التحلل من خلال أعراض واضحة: تغير لون البكرة إلى البني (تفاعل السرقة)، تسرب السائل، التصاق الأشرطة، وظهور بقع على الأفلام. الفحص الدوري المنتظم مع سجل حالة لكل عنصر هو أفضل وسيلة للحماية والكشف المبكر.</p>',
        contentEn:
          '<p>International standards (such as those issued by the Library of Congress) recommend storing audiovisual media at low temperatures (2-10\u00b0C) and humidity of 20-40%. Every rise in temperature or humidity accelerates the chemical reactions leading to decay.</p><p>Degradation is recognized through clear symptoms: the reel turning brown (vinegar syndrome), liquid leakage, tape sticking, and stains appearing on films. Regular periodic inspection with a condition log for each item is the best means of protection and early detection.</p>',
        summaryAr: 'ظروف التخزين المثالية وعلامات التحلل المرئية',
        summaryEn: 'Optimal storage conditions and visible degradation signs',
        estimatedReadingTime: 10,
      },
      {
        lessonNumber: 3,
        titleAr: 'التحويل الرقمي والترميم',
        titleEn: 'Digital Transfer and Restoration',
        slug: 'digital-transfer-restoration',
        videoUrl: 'https://www.youtube.com/watch?v=Sf9h6J0Lx_c',
        videoDuration: 650,
        contentAr:
          '<p>التحويل الرقمي للأشرطة عملية حساسة: تحتاج مشغلات سليمة معايرة، وجهاز استحواذ عالي الجودة، وضبط الإشارة قبل التسجيل الرقمي لتجنب تفاقم العيوب. يُنصح بالحفظ بصيغ غير مضغوطة أو مضغوطة بدون فقدان للنسخة الرئيسية.</p><p>الترميم يبدأ بتقليل الضوضاء وترميم اللون والتباين مع الحرص على عدم المبالغة التي قد تشوه المحتوى الأصلي. بعض المشاريع تقوم بترميم كامل والبعض يكتفي بالتحويل الآمن، حسب الميزانية وأهمية المادة.</p>',
        contentEn:
          '<p>Digital transfer of tapes is a delicate process: it requires calibrated working players, a high-quality capture device, and signal adjustment before digital recording to avoid aggravating defects. It is advisable to preserve in uncompressed or lossless formats for the master copy.</p><p>Restoration begins with noise reduction and restoring color and contrast, while being careful not to overdo it in ways that might distort the original content. Some projects carry out full restoration and others suffice with safe transfer, depending on budget and material importance.</p>',
        summaryAr: 'معايرة المشغلات، صيغ النسخة الرئيسية، وأسس الترميم',
        summaryEn: 'Player calibration, master copy formats, and restoration foundations',
        estimatedReadingTime: 12,
        isAssessment: true,
      },
    ],
  },
  {
    titleAr: 'توثيق التراث الفلسطيني المهدد',
    titleEn: 'Documenting Threatened Palestinian Heritage',
    slug: 'documenting-threatened-palestinian-heritage',
    shortDescAr: 'أدوات الطوارئ في توثيق التراث المهدد والحفاظ على الذاكرة في الأزمات',
    shortDescEn: 'Emergency tools for documenting threatened heritage and preserving memory in crises',
    fullDescAr:
      'دورة متخصصة في خطط الطوارئ وتوثيق التراث المهدد بالخطر في مناطق النزاع والكوارث. تشمل أولويات الاستجابة السريعة، تقييم الأضرار الأولي، إخلاء وحماية المقتنيات، التوثيق الرقمي الطارئ، التعاون مع المجتمع المحلي، وبناء الذاكرة الجماعية بعد الأزمات. تعتمد الدورة على خبرات أرشيفية فلسطينية وعربية في توثيق المدن والقرى التي تتعرض للتدمير والتهجير.',
    fullDescEn:
      'A specialized course on emergency plans and documenting heritage threatened by danger in conflict and disaster zones. It covers rapid response priorities, initial damage assessment, evacuation and protection of holdings, emergency digital documentation, cooperation with the local community, and building collective memory after crises. The course draws on Palestinian and Arab archival expertise in documenting cities and villages facing destruction and displacement.',
    categorySlug: 'archival-science',
    tagSlugs: ['heritage', 'documentation', 'archives'],
    difficulty: 'intermediate',
    duration: 150,
    estimatedStudyTime: 10,
    language: 'ar',
    instructorName: 'د. خالد المصري',
    instructorBio: 'أستاذ علم الأرشيف في جامعة القدس، وباحث متخصص في الذاكرة الفلسطينية.',
    archiveTopic: 'التراث الفلسطيني',
    region: 'فلسطين',
    historicalPeriod: 'النكبة - اليوم',
    targetAudience: 'المؤرخون، النشطاء الثقافيون، المؤسسات الأهلية، الصحفيون',
    prerequisites: 'دورة أساسيات علم الأرشيف (موصى بها)',
    learningObjectives: [
      'إعداد خطة طوارئ أرشيفية',
      'تطبيق الإسعاف الأولي للمواد المتضررة',
      'استخدام أدوات التوثيق الرقمي الطارئ',
      'بناء شبكات حفظ مجتمعية',
    ],
    isFeatured: true,
    isPopular: true,
    isFree: true,
    publishedAt: '2024-08-01',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'خطط الطوارئ الأرشيفية',
        titleEn: 'Archival Emergency Plans',
        slug: 'archival-emergency-plans',
        videoUrl: 'https://www.youtube.com/watch?v=I9F9r5n7qWk',
        videoDuration: 600,
        contentAr:
          '<p>خطة الطوارئ الأرشيفية وثيقة إجرائية تحدد التصرف المطلوب قبل وأثناء وبعد الكارثة: تقييم المخاطر، تحديد الأولويات في الإخلاء، تجهيز فريق الاستجابة ومهامه، وبروتوكولات التواصل مع الجهات المختصة.</p><p>المبدأ الأساسي هو حماية الأشخاص أولاً ثم المقتنيات، وتخصيص قائمة محددة بأهم الوثائق والمواد للإنقاذ العاجل (الصور العائلية، السجلات النادرة، المخطوطات). تدريب الفريق وتنفيذ تمارين دورية يضمنان الجاهزية الفعلية.</p>',
        contentEn:
          '<p>The archival emergency plan is a procedural document defining the required action before, during and after a disaster: risk assessment, evacuation priorities, preparing the response team and its tasks, and communication protocols with the relevant authorities.</p><p>The basic principle is protecting people first, then holdings, and allocating a defined list of the most important documents and materials for urgent rescue (family photographs, rare records, manuscripts). Team training and regular drills ensure real readiness.</p>',
        summaryAr: 'عناصر خطة الطوارئ، أولويات الإخلاء، وتدريب فرق الاستجابة',
        summaryEn: 'Emergency plan elements, evacuation priorities, and training response teams',
        estimatedReadingTime: 11,
        attachments: [
          {
            type: 'pdf',
            titleAr: 'قالب خطة طوارئ',
            titleEn: 'Emergency Plan Template',
            url: '/uploads/courses/heritage/emergency-plan-template.pdf',
            mimeType: 'application/pdf',
            fileSize: 780_000,
          },
        ],
      },
      {
        lessonNumber: 2,
        titleAr: 'الإسعاف الأولي للمواد الأرشيفية',
        titleEn: 'First Aid for Archival Materials',
        slug: 'first-aid-archival-materials',
        videoUrl: 'https://www.youtube.com/watch?v=Bh2T0f4YbS0',
        videoDuration: 640,
        contentAr:
          '<p>عند تعرض المواد للبلل أو الحريق أو الغبار، تختلف الإجراءات الفورية: المواد المبللة يجب تجفيفها بالتجميد أو التهوية، والمواد المحترقة تحفظ في صناديق معالجة مخصصة، والصور الملونة المبللة تُجمد فوراً لمنع التصاق الطبقات.</p><p>من الأخطاء الشائعة فصل الورق المبلل يدوياً أو تجفيفه بأجهزة حرارية. التدريب على الإسعاف الأولي يمنع تفاقم الأضرار ويحافظ على قابلية الترميم لاحقاً.</p>',
        contentEn:
          '<p>When materials are exposed to water, fire or dust, immediate procedures differ: wet materials must be dried by freezing or airing, burnt materials are kept in specialized treatment boxes, and wet color photographs are frozen immediately to prevent layer adhesion.</p><p>Common mistakes include manually separating wet paper or drying it with heat devices. First-aid training prevents aggravating damage and preserves the possibility of later restoration.</p>',
        summaryAr: 'الإجراءات الفورية للمواد المبللة والمحترقة وأخطاء شائعة يجب تجنبها',
        summaryEn: 'Immediate procedures for wet and burnt materials and common mistakes to avoid',
        estimatedReadingTime: 12,
      },
      {
        lessonNumber: 3,
        titleAr: 'التوثيق الرقمي الطارئ',
        titleEn: 'Emergency Digital Documentation',
        slug: 'emergency-digital-documentation',
        videoUrl: 'https://www.youtube.com/watch?v=vX5kH0b2e8A',
        videoDuration: 590,
        contentAr:
          '<p>في حالات النزاع، يتقدم التوثيق الرقمي السريع على الحفظ التقليدي: التصوير الفوتوغرافي والفيديو بدقة عالية، توثيق المباني قبل التدمير، تسجيل شهادات الشهود، وجمع البيانات الميدانية في قوالب موحدة تتيح دمجها لاحقاً.</p><p>الأساليب الحديثة تشمل الصور الجوية بالطائرات المسيرة (الدرون) والتصوير ثلاثي الأبعاد للمواقع الأثرية، مع الحرص على نسخ البيانات فورياً إلى مواقع متعددة بعيدة عن منطقة الخطر.</p>',
        contentEn:
          '<p>In conflict situations, rapid digital documentation precedes traditional preservation: high-resolution photography and video, documenting buildings before destruction, recording witness testimonies, and collecting field data in unified templates that allow later integration.</p><p>Modern methods include aerial photography by drones and three-dimensional imaging of archaeological sites, while ensuring data is copied immediately to multiple locations far from the danger zone.</p>',
        summaryAr: 'أدوات التوثيق السريع، التصوير الجوي والثلاثي الأبعاد، والتوزيع الآمن للبيانات',
        summaryEn: 'Rapid documentation tools, aerial and 3D imaging, and secure data distribution',
        estimatedReadingTime: 10,
      },
      {
        lessonNumber: 4,
        titleAr: 'بناء الذاكرة الجماعية بعد الأزمات',
        titleEn: 'Building Collective Memory After Crises',
        slug: 'collective-memory-after-crises',
        videoUrl: 'https://www.youtube.com/watch?v=dQwQ9h3kZ0o',
        videoDuration: 550,
        contentAr:
          '<p>بعد الأزمة يأتي دور إعادة بناء الذاكرة: جمع الشتات الوثائقي من الأفراد والمؤسسات، أرشفة الشهادات والصور العائلية، وبناء أرشيفات مجتمعية رقمية تفتح للناس إمكانية المشاركة في الحفظ.</p><p>الخبرة الفلسطينية في توثيق المدن المدمرة (يافا، اللد، الرملة) وقراها تبين أن الشراكة مع المجتمع المحلي وتمكينه من أدوات الحفظ هي مفتاح استمرارية الذاكرة ونقلها للأجيال.</p>',
        contentEn:
          '<p>After a crisis comes the role of rebuilding memory: gathering documentary diaspora from individuals and institutions, archiving testimonies and family photographs, and building community digital archives that open to people the possibility of participating in preservation.</p><p>Palestinian experience in documenting destroyed cities (Jaffa, Lydda, Ramleh) and their villages shows that partnership with the local community and empowering it with preservation tools is the key to the continuity of memory and its transmission to generations.</p>',
        summaryAr: 'جمع الشتات الوثائقي، الأرشيفات المجتمعية، والشراكة مع المجتمع المحلي',
        summaryEn: 'Gathering documentary diaspora, community archives, and partnership with the local community',
        estimatedReadingTime: 9,
        isAssessment: true,
      },
    ],
  },
];

const REAL_COURSES: CourseSeed[] = [
  {
    titleAr: 'التوثيق الرقمي للتراث الفلسطيني: من الالتقاط إلى الإتاحة',
    titleEn: 'Digital Documentation of Palestinian Heritage: From Capture to Access',
    slug: 'digital-documentation-palestinian-heritage',
    shortDescAr: 'دورة تطبيقية لبناء سجل رقمي موثوق للصور والفيديو والشهادات والمواد التراثية.',
    shortDescEn: 'A practical course for creating trustworthy digital records of photographs, video, testimony, and heritage materials.',
    fullDescAr: 'ترافق هذه الدورة المتعلم خلال مشروع توثيق صغير ومتكامل: تحديد الغرض وحقوق الاستخدام، التقاط نسخة رقمية سليمة، إنشاء البيانات الوصفية، حفظ النسخة الرئيسية، ثم إتاحة نسخة وصول. تتضمن مثالاً مرئياً حقيقياً للدبكة الفلسطينية محفوظاً داخل المنصة، وتمارين يمكن تطبيقها على مجموعات عائلية أو مؤسسية.',
    fullDescEn: 'This course guides learners through a complete small-scale documentation project: defining purpose and rights, creating a sound digital capture, recording metadata, preserving a master copy, and publishing an access copy. It includes an authentic Palestinian dabke video hosted by the platform and practical exercises for family or institutional collections.',
    thumbnailUrl: '/uploads/archives/real/jerusalem-1933.jpg',
    bannerUrl: '/uploads/archives/real/palestine-map-1946.jpg',
    categorySlug: 'digital-preservation',
    tagSlugs: ['archives', 'digital-preservation', 'heritage'],
    difficulty: 'beginner',
    duration: 95,
    estimatedStudyTime: 4,
    language: 'ar',
    instructorName: 'فريق أرشيفنا للتدريب',
    instructorBio: 'مادة تدريبية تطبيقية أعدها فريق المنصة بالاستناد إلى مبادئ الوصف الأرشيفي والحفظ الرقمي، مع توثيق مصدر المادة المرئية وحقوق استخدامها.',
    archiveTopic: 'التوثيق والحفظ الرقمي',
    region: 'فلسطين',
    historicalPeriod: 'القرن العشرون والحادي والعشرون',
    targetAudience: 'المبتدئون، طلبة التاريخ والإعلام، العاملون في المؤسسات الثقافية، وأصحاب المجموعات العائلية',
    learningObjectives: [
      'إعداد خطة توثيق تحدد النطاق والحقوق والمسؤوليات',
      'إنشاء نسخة رقمية رئيسية ونسخة مخصصة للإتاحة',
      'كتابة بيانات وصفية تساعد على الفهم والاسترجاع',
      'تنظيم الملفات والنسخ الاحتياطية بطريقة قابلة للاستمرار',
    ],
    prerequisites: 'لا توجد متطلبات سابقة',
    isFeatured: true,
    isPopular: false,
    isFree: true,
    publishedAt: '2026-09-03',
    lessons: [
      {
        lessonNumber: 1,
        titleAr: 'خطة التوثيق والحقوق قبل البدء',
        titleEn: 'Documentation Planning and Rights',
        slug: 'planning-and-rights',
        contentAr: '<p>يبدأ التوثيق الجيد قبل تشغيل الكاميرا أو الماسح. حدّد المادة التي ستوثقها، وصاحبها، والغرض من جمعها، ومن يحق له مشاهدتها أو إعادة استخدامها. سجّل موافقة واضحة عندما تتضمن المادة أشخاصاً أو شهادات شخصية، وافصل بين ملكية الأصل وحقوق النسخة الرقمية.</p><p>أنشئ رقماً مرجعياً فريداً لكل مادة، وسجل حالة الأصل ومكانه وتاريخ الالتقاط واسم المنفذ. هذه المعلومات تمنع ضياع السياق وتحول الملف من صورة مجهولة إلى سجل أرشيفي يمكن الوثوق به.</p>',
        contentEn: '<p>Good documentation begins before operating a camera or scanner. Define the material, its owner, the purpose of collection, and who may view or reuse it. Record clear consent for personal testimony and distinguish ownership of the original from rights in the digital copy.</p>',
        summaryAr: 'تحديد النطاق والملكية والموافقة والرقم المرجعي قبل الرقمنة.',
        summaryEn: 'Define scope, ownership, consent, and reference numbers before digitization.',
        estimatedReadingTime: 12,
      },
      {
        lessonNumber: 2,
        titleAr: 'توثيق الفيديو: الدبكة الفلسطينية نموذجاً',
        titleEn: 'Video Documentation: Palestinian Dabke as a Case Study',
        slug: 'video-documentation-dabke',
        videoUrl: '/uploads/archives/real/palestinian-dabke.webm',
        videoDuration: 76,
        contentAr: '<p>شاهد المقطع بوصفه مادة أرشيفية، لا مجرد فيديو. دوّن نوع الحدث، والمكان إن كان معروفاً، والأشخاص أو الفرقة، وتاريخ التسجيل، واسم المصور، واللغة، وحقوق الاستخدام. عند غياب معلومة لا تخمّنها؛ استخدم عبارة «غير معروف» واحتفظ بمصدر الملف.</p><p>احتفظ بالملف الأصلي كما استلمته، وأنشئ نسخة وصول أخف للعرض على الويب. مصدر هذا المثال هو Wikimedia Commons، والمؤلفة Sarah Canbel، والترخيص CC BY-SA 4.0.</p>',
        contentEn: '<p>Watch the clip as an archival record, not merely a video. Record the event type, known location, participants, date, creator, language, and reuse rights. Preserve the received original and create a smaller access copy for the web.</p>',
        summaryAr: 'تطبيق عملي على وصف فيديو تراثي وحفظ نسخته الرئيسية ونسخة الإتاحة.',
        summaryEn: 'A practical exercise in describing and preserving a heritage video.',
        estimatedReadingTime: 15,
      },
      {
        lessonNumber: 3,
        titleAr: 'البيانات الوصفية والحفظ طويل الأمد',
        titleEn: 'Metadata and Long-Term Preservation',
        slug: 'metadata-and-preservation',
        contentAr: '<p>اكتب عنواناً واضحاً ووصفاً موضوعياً، ثم أضف التاريخ والمكان والمنشئ والموضوع واللغة ونوع المادة والحقوق. استخدم أسماء ملفات ثابتة مثل PS-DABKE-0001_master.webm وتجنب كلمات مثل final أو new التي تفقد معناها مع الوقت.</p><p>طبّق قاعدة النسخ الثلاث: ثلاث نسخ على الأقل، في وسيطين مختلفين، وإحداها في موقع منفصل. افحص الملفات دورياً باستخدام قيمة تحقق رقمية، وسجل أي تحويل للصيغة حتى يبقى تاريخ المادة التقني قابلاً للتتبع.</p>',
        contentEn: '<p>Create a clear title and objective description, then record date, place, creator, subject, language, material type, and rights. Keep at least three copies on two media types, with one copy off-site, and verify integrity periodically using checksums.</p>',
        summaryAr: 'وصف المادة، تسمية الملفات، النسخ الاحتياطي، والتحقق الدوري من السلامة.',
        summaryEn: 'Description, file naming, backup, and periodic integrity checking.',
        estimatedReadingTime: 15,
        isAssessment: true,
      },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash(PASSWORD, 10);

  // Users (upsert by email)
  const users: Record<string, string> = {};
  const userSeeds: Prisma.UserCreateInput[] = [
    {
      full_name: 'أحمد خليل',
      email: 'ahmed@example.com',
      password_hash: password,
      phone: '+970-59-123-4567',
      institution_name: 'جامعة النجاح الوطنية',
      bio: 'باحث في التاريخ الفلسطيني',
    },
    {
      full_name: 'سارة موسى',
      email: 'sara@example.com',
      password_hash: password,
      institution_name: 'جامعة بيرزيت',
      bio: 'أخصائية في الحفظ والترميم',
    },
    {
      full_name: 'محمد داود',
      email: 'mohammed@example.com',
      password_hash: password,
      institution_name: 'المركز الفلسطيني للتراث الثقافي',
      bio: 'أمين أرشيف وثائقي',
    },
    {
      full_name: 'فاطمة حسن',
      email: 'fatma@example.com',
      password_hash: password,
      bio: 'مستندية ومحررة أرشيف',
    },
    {
      full_name: 'مدير النظام',
      email: 'admin@example.com',
      password_hash: password,
      bio: 'مسؤول منصة أرشيفنا',
      account_type: 'institution_representative',
    },
    {
      full_name: 'د. خالد المصري',
      email: 'khalid@example.com',
      password_hash: password,
      institution_name: 'جامعة القدس',
      bio: 'أستاذ علم الأرشيف وباحث في الذاكرة الفلسطينية',
    },
    {
      full_name: 'أ. ريم العلي',
      email: 'reem@example.com',
      password_hash: password,
      institution_name: 'المكتبة الوطنية الفلسطينية',
      bio: 'أخصائية الفهرسة والوصف الأرشيفي',
    },
  ];

  for (const seed of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { account_status: 'active' },
      create: { ...seed, account_status: 'active' },
    });
    users[seed.email] = user.id;
  }

  // Institutions (upsert by slug)
  const institutions: Record<string, string> = {};
  const institutionSeeds = [
    {
      name_ar: 'التجمع الأرشيفي الفلسطيني',
      name_en: 'Palestinian Archival Collective',
      slug: 'palestinian-archival-collective',
      institution_type: 'archival_collective',
      email: 'archive@arsheefna.ps',
      website: 'https://arsheefna.ps',
      city: 'فلسطين',
    },
    {
      name_ar: 'جامعة النجاح الوطنية',
      name_en: 'An-Najah National University',
      slug: 'an-najah',
      institution_type: 'university',
      email: 'info@najah.edu',
      website: 'https://www.najah.edu',
      city: 'نابلس',
    },
    {
      name_ar: 'جامعة بيرزيت',
      name_en: 'Birzeit University',
      slug: 'birzeit',
      institution_type: 'university',
      email: 'info@birzeit.edu',
      website: 'https://www.birzeit.edu',
      city: 'رام الله',
    },
    {
      name_ar: 'المركز الفلسطيني للتراث الثقافي',
      name_en: 'Palestinian Center for Cultural Heritage',
      slug: 'pcch',
      institution_type: 'cultural_center',
      email: 'info@pcch.org',
      website: 'https://www.pcch.org',
      city: 'القدس',
    },
    {
      name_ar: 'أرشيف القدس',
      name_en: 'Jerusalem Archive',
      slug: 'jerusalem-archive',
      institution_type: 'archive',
      email: 'contact@jerusalemarchive.org',
      website: 'https://www.jerusalemarchive.org',
      city: 'القدس',
    },
  ];

  for (const seed of institutionSeeds) {
    const inst = await prisma.institution.upsert({
      where: { slug: seed.slug },
      update: {},
      create: { ...seed, created_by: users['admin@example.com'] },
    });
    institutions[seed.slug] = inst.id;
  }

  const institutionByName = new Map(
    (await prisma.institution.findMany({ select: { id: true, name_ar: true } }))
      .map((institution) => [institution.name_ar, institution.id]),
  );
  for (const seed of userSeeds) {
    const institutionId = seed.institution_name
      ? institutionByName.get(seed.institution_name)
      : institutions['palestinian-archival-collective'];
    if (institutionId) {
      await prisma.user.update({ where: { email: seed.email }, data: { institution_id: institutionId } });
    }
  }

  const ensureRole = async (email: string, role: string, institutionId?: string) => {
    const userId = users[email];
    const existing = await prisma.roleAssignment.findFirst({
      where: { user_id: userId, role, institution_id: institutionId || null },
    });
    if (existing) {
      await prisma.roleAssignment.update({ where: { id: existing.id }, data: { is_active: true } });
    } else {
      await prisma.roleAssignment.create({ data: { user_id: userId, role, institution_id: institutionId } });
    }
  };
  for (const email of Object.keys(users)) await ensureRole(email, 'researcher');
  await ensureRole('admin@example.com', 'system_admin');
  await ensureRole('admin@example.com', 'sovereignty_custodian');
  await ensureRole('admin@example.com', 'institution_admin', institutions['palestinian-archival-collective']);
  await ensureRole('fatma@example.com', 'depositor', institutions['palestinian-archival-collective']);
  await ensureRole('mohammed@example.com', 'cataloger', institutions['pcch']);
  await ensureRole('sara@example.com', 'institution_admin', institutions['birzeit']);
  await ensureRole('reem@example.com', 'reviewer', institutions['palestinian-archival-collective']);

  // News categories (upsert by slug)
  const newsCategories: Record<string, string> = {};
  const newsCategorySeeds = [
    { name_ar: 'أخبار الأرشيف', name_en: 'Archive News', slug: 'archive-news' },
    { name_ar: 'إعلانات', name_en: 'Announcements', slug: 'announcements' },
    { name_ar: 'فعاليات', name_en: 'Events', slug: 'events' },
  ];
  for (const seed of newsCategorySeeds) {
    const cat = await prisma.newsCategory.upsert({
      where: { slug: seed.slug },
      update: {},
      create: seed,
    });
    newsCategories[seed.slug] = cat.id;
  }

  // Archive records (upsert by reference_number)
  const archiveSeeds: Prisma.ArchiveRecordUncheckedCreateInput[] = [
    {
      owner_id: users['ahmed@example.com'],
      title_ar: 'وثائق النكبة الفلسطينية - يافا 1948',
      title_en: 'Palestinian Nakba Documents - Jaffa 1948',
      reference_number: 'ARC-001',
      description_ar: 'مجموعة من الوثائق التاريخية المتعلقة بالنكبة الفلسطينية في مدينة يافا عام 1948. تشمل الوثائق رسائل وخطابات رسمية وصوراً فوتوغرافية توثق أحداث تلك الفترة.',
      description_en: 'A collection of historical documents related to the Palestinian Nakba in Jaffa in 1948. The documents include letters, official correspondence, and photographs documenting events of that period.',
      creator_name: 'أرشيف يافا التاريخي',
      institution_name: 'جامعة النجاح الوطنية',
      collection_name: 'أرشيف النكبة',
      subject_text: 'النكبة الفلسطينية',
      place: 'يافا',
      language: 'العربية',
      material_type: 'document',
      date_text: '1948',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-01-15'),
    },
    {
      owner_id: users['ahmed@example.com'],
      title_ar: 'صور تاريخية - القدس في ثلاثينيات القرن العشرين',
      title_en: 'Historical Photos - Jerusalem in the 1930s',
      reference_number: 'ARC-002',
      description_ar: 'مجموعة من الصور الفوتوغرافية النادرة التي تظهر المدينة القديمة في القدس خلال ثلاثينيات القرن العشرين.',
      description_en: 'A collection of rare photographs showing the Old City of Jerusalem during the 1930s.',
      creator_name: 'جامعة النجاح الوطنية',
      institution_name: 'جامعة النجاح الوطنية',
      collection_name: 'الصور التاريخية',
      subject_text: 'الصور التاريخية',
      place: 'القدس',
      language: 'العربية',
      material_type: 'image',
      date_text: '1930-1939',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-02-10'),
    },
    {
      owner_id: users['sara@example.com'],
      title_ar: 'سجلات التراث الشفوي - قصص نابلس',
      title_en: 'Oral Heritage Records - Stories of Nablus',
      reference_number: 'ARC-003',
      description_ar: 'تسجيلات صوتية لقصص وحكايات شعبية من مدينة نابلس، تجمع بين التراث الشفوي والذاكرة الجمعية.',
      description_en: 'Audio recordings of folk tales and stories from the city of Nablus, combining oral heritage and collective memory.',
      creator_name: 'سارة موسى',
      institution_name: 'جامعة بيرزيت',
      collection_name: 'التراث الشفوي',
      subject_text: 'التاريخ الشفوي',
      place: 'نابلس',
      language: 'العربية',
      material_type: 'audio',
      date_text: '2020-2023',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-03-05'),
    },
    {
      owner_id: users['sara@example.com'],
      title_ar: 'توثيق المواقع التراثية في رام الله',
      title_en: 'Documentation of Heritage Sites in Ramallah',
      reference_number: 'ARC-004',
      description_ar: 'فيديو وثائقي يعرض المواقع التراثية والثقافية في مدينة رام الله والمنطقة المحيطة بها.',
      description_en: 'A documentary video showcasing the heritage and cultural sites in Ramallah and the surrounding area.',
      creator_name: 'سارة موسى',
      institution_name: 'جامعة بيرزيت',
      collection_name: 'التراث المعماري',
      subject_text: 'التراث الفلسطيني',
      place: 'رام الله',
      language: 'العربية',
      material_type: 'video',
      date_text: '2022',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-04-20'),
    },
    {
      owner_id: users['mohammed@example.com'],
      title_ar: 'مخطوطات أحمد شوقي - مجموعة نادرة',
      title_en: 'Ahmed Shawqi Manuscripts - Rare Collection',
      reference_number: 'ARC-005',
      description_ar: 'مجموعة من المخطوطات الأدبية والشعرية تعود للشاعر أحمد شوقي، محفوظة في صندوق آمن.',
      description_en: 'A collection of literary and poetic manuscripts belonging to the poet Ahmed Shawqi, stored in a secure vault.',
      creator_name: 'محمد داود',
      collection_name: 'المخطوطات',
      subject_text: 'المخطوطات',
      place: 'القدس',
      language: 'العربية',
      material_type: 'document',
      date_text: '1920-1930',
      access_level: 'sensitive',
      status: 'published',
      published_at: new Date('2024-05-10'),
    },
    {
      owner_id: users['fatma@example.com'],
      title_ar: 'خرائط فلسطين الاستعمارية',
      title_en: 'Colonial Maps of Palestine',
      reference_number: 'ARC-006',
      description_ar: 'مجموعة من الخرائط الاستعمارية لفلسطين تعود للنصف الأول من القرن العشرين.',
      description_en: 'A collection of colonial maps of Palestine from the first half of the twentieth century.',
      creator_name: 'فاطمة حسن',
      institution_name: 'المركز الفلسطيني للتراث الثقافي',
      collection_name: 'الخرائط التاريخية',
      subject_text: 'التاريخ',
      place: 'فلسطين',
      language: 'الإنجليزية',
      material_type: 'image',
      date_text: '1920-1948',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-06-01'),
    },
    {
      owner_id: users['ahmed@example.com'],
      title_ar: 'سجلات المؤسسات الثقافية الفلسطينية',
      title_en: 'Records of Palestinian Cultural Institutions',
      reference_number: 'ARC-007',
      description_ar: 'وثائق وسجلات رسمية تتعلق بالمؤسسات الثقافية والتعليمية في فلسطين.',
      description_en: 'Official documents and records related to cultural and educational institutions in Palestine.',
      creator_name: 'أحمد خليل',
      institution_name: 'جامعة النجاح الوطنية',
      collection_name: 'المؤسسات الثقافية',
      subject_text: 'المؤسسات الثقافية',
      place: 'نابلس',
      language: 'العربية',
      material_type: 'document',
      date_text: '1950-1980',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-06-15'),
    },
    {
      owner_id: users['mohammed@example.com'],
      title_ar: 'أغاني تراثية من قطاع غزة',
      title_en: 'Heritage Songs from Gaza Strip',
      reference_number: 'ARC-008',
      description_ar: 'تسجيلات صوتية لأغاني تراثية فلسطينية من قطاع غزة.',
      description_en: 'Audio recordings of Palestinian heritage songs from the Gaza Strip.',
      creator_name: 'محمد داود',
      place: 'غزة',
      language: 'العربية',
      material_type: 'audio',
      date_text: '2019-2023',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-07-01'),
    },
    {
      owner_id: users['sara@example.com'],
      title_ar: 'مشروع توثيق الذاكرة الجماعية - يافا',
      title_en: 'Collective Memory Documentation Project - Jaffa',
      reference_number: 'ARC-009',
      description_ar: 'مشروع مشترك لتوثيق الذاكرة الجماعية لمدينة يافا من خلال مقابلات مع المغتربين.',
      description_en: 'A joint project to document the collective memory of Jaffa through interviews with diaspora residents.',
      creator_name: 'سارة موسى',
      institution_name: 'أرشيف القدس',
      collection_name: 'الذاكرة الجماعية',
      subject_text: 'الذاكرة الفلسطينية',
      place: 'يافا',
      language: 'العربية',
      material_type: 'video',
      date_text: '2021-2024',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-07-10'),
    },
    {
      owner_id: users['ahmed@example.com'],
      title_ar: 'مسودة - دراسة عن المطبخ الفلسطيني',
      title_en: 'Draft - Study of Palestinian Cuisine',
      reference_number: 'ARC-010',
      description_ar: 'دراسة أولية عن المطبخ الفلسطيني وتاريخه وتطوره عبر العصور.',
      description_en: 'A preliminary study on Palestinian cuisine, its history and evolution through the ages.',
      creator_name: 'أحمد خليل',
      place: 'فلسطين',
      language: 'العربية',
      material_type: 'document',
      date_text: '2024',
      access_level: 'public',
      status: 'draft',
    },
    {
      owner_id: users['fatma@example.com'],
      title_ar: 'لقطات سينمائية - المهرجانات التراثية',
      title_en: 'Film Footage - Heritage Festivals',
      reference_number: 'ARC-011',
      description_ar: 'لقطات من مهرجانات التراث الفلسطيني في مختلف المدن الفلسطينية.',
      description_en: 'Footage from Palestinian heritage festivals in various Palestinian cities.',
      creator_name: 'فاطمة حسن',
      place: 'فلسطين',
      language: 'العربية',
      material_type: 'video',
      date_text: '2023',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-08-01'),
    },
    {
      owner_id: users['mohammed@example.com'],
      title_ar: 'ملف حساس - وثائق مُصنّفة',
      title_en: 'Sensitive File - Classified Documents',
      reference_number: 'ARC-012',
      description_ar: 'وثائق حساسة تحتاج إلى صلاحيات خاصة للوصول إليها.',
      description_en: 'Sensitive documents that require special permissions to access.',
      creator_name: 'محمد داود',
      place: 'رام الله',
      language: 'العربية',
      material_type: 'document',
      date_text: '2020',
      access_level: 'sensitive',
      status: 'published',
      published_at: new Date('2024-08-15'),
    },
    {
      owner_id: users['ahmed@example.com'],
      title_ar: 'يوميات الحاج حسن - رحلة الحج 1935',
      title_en: 'Diaries of Hajj Hassan - The 1935 Pilgrimage',
      reference_number: 'ARC-013',
      description_ar: 'مذكرات مكتوبة بخط اليد توثق رحلة حج من فلسطين عام 1935 مع تفاصيل الحياة اليومية والمعاملات.',
      description_en: 'Handwritten memoirs documenting a pilgrimage journey from Palestine in 1935 with details of daily life and transactions.',
      creator_name: 'آل ناصر الدين',
      collection_name: 'المذكرات الشخصية',
      subject_text: 'الذاكرة الفلسطينية',
      place: 'الخليل',
      language: 'العربية',
      material_type: 'document',
      date_text: '1935',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-09-02'),
    },
    {
      owner_id: users['sara@example.com'],
      title_ar: 'أرشيف صوتي - إذاعة فلسطين 1940-1948',
      title_en: 'Audio Archive - Palestine Radio 1940-1948',
      reference_number: 'ARC-014',
      description_ar: 'تسجيلات إذاعية نادرة من إذاعة فلسطين تغطي فترات البث وأهم البرامج قبل النكبة.',
      description_en: 'Rare radio recordings from the Palestine Broadcasting Service covering broadcast periods and key programs before the Nakba.',
      creator_name: 'إذاعة فلسطين',
      institution_name: 'أرشيف القدس',
      collection_name: 'الإذاعة الفلسطينية',
      subject_text: 'الوسائط المتعددة',
      place: 'القدس',
      language: 'العربية',
      material_type: 'audio',
      date_text: '1940-1948',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-09-20'),
    },
    {
      owner_id: users['mohammed@example.com'],
      title_ar: 'تخطيط مدينة غزة - خرائط بلدية 1946',
      title_en: 'Gaza City Planning - Municipal Maps 1946',
      reference_number: 'ARC-015',
      description_ar: 'خرائط تخطيطية لمدينة غزة تعود لعام 1946 تبين الشوارع والأحياء والمباني العامة.',
      description_en: 'Planning maps of Gaza City dating to 1946 showing streets, neighborhoods and public buildings.',
      creator_name: 'بلدية غزة',
      collection_name: 'الخرائط التاريخية',
      subject_text: 'الخرائط',
      place: 'غزة',
      language: 'العربية',
      material_type: 'image',
      date_text: '1946',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-10-05'),
    },
    {
      owner_id: users['fatma@example.com'],
      title_ar: 'مجلة الأرض - أعداد نادرة 1936-1938',
      title_en: 'Al-Ard Magazine - Rare Issues 1936-1938',
      reference_number: 'ARC-016',
      description_ar: 'أعداد نادرة من مجلة الأرض الأدبية والثقافية الصادرة في يافا قبل النكبة.',
      description_en: 'Rare issues of the literary and cultural magazine Al-Ard published in Jaffa before the Nakba.',
      creator_name: 'مطبعة الأرض',
      collection_name: 'الدوريات',
      subject_text: 'الصحافة',
      place: 'يافا',
      language: 'العربية',
      material_type: 'document',
      date_text: '1936-1938',
      access_level: 'public',
      status: 'published',
      published_at: new Date('2024-11-01'),
    },
  ];

  for (const seed of archiveSeeds) {
    const { subject_text, ...rest } = seed;
    const existing = await prisma.archiveRecord.findFirst({
      where: { reference_number: seed.reference_number! },
    });
    if (existing) {
      await prisma.archiveRecord.update({
        where: { id: existing.id },
        data: rest,
      });
    } else {
      await prisma.archiveRecord.create({
        data: { ...rest, reference_number: seed.reference_number! },
      });
    }
  }

  // Rights-safe local demo media. Generated by scripts/generate_archive_demo_assets.py.
  const demoDir = path.resolve(__dirname, '../uploads/archives/demo');
  if (fs.existsSync(demoDir)) {
    const recordsByRef = new Map(
      (await prisma.archiveRecord.findMany({ where: { reference_number: { startsWith: 'ARC-' } } }))
        .map((record) => [record.reference_number, record]),
    );
    const extras: Record<string, string[]> = {
      'ARC-001': ['jaffa-collection-guide.pdf', 'archive-inventory.xlsx'],
      'ARC-003': ['oral-history-sample.wav', 'oral-history-interview-form.docx'],
      'ARC-004': ['community-archive-workshop.pptx'],
      'ARC-005': ['manuscript-master.tiff', 'manuscript-access.png'],
      'ARC-006': ['olive-branch-catalog-mark.svg'],
      'ARC-007': ['metadata.csv', 'metadata.json'],
      'ARC-009': ['community-archive-resource-pack.zip'],
      'ARC-010': ['collection-readme.txt'],
    };
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', png: 'image/png', tiff: 'image/tiff', svg: 'image/svg+xml',
      pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      wav: 'audio/wav', zip: 'application/zip', txt: 'text/plain', csv: 'text/csv', json: 'application/json',
    };
    await prisma.archiveFile.deleteMany({ where: { storage_path: { startsWith: 'archives/demo/' } } });
    for (const [ref, record] of recordsByRef) {
      if (!ref) continue;
      const thumbnail = `${ref.toLowerCase()}-thumbnail.jpg`;
      const files = [thumbnail, ...(extras[ref] || [])];
      for (const filename of files) {
        const absolutePath = path.join(demoDir, filename);
        if (!fs.existsSync(absolutePath)) continue;
        const extension = path.extname(filename).slice(1).toLowerCase();
        const buffer = fs.readFileSync(absolutePath);
        await prisma.archiveFile.create({ data: {
          archive_record_id: record.id,
          owner_id: record.owner_id,
          storage_path: `archives/demo/${filename}`,
          secure_url: `/uploads/archives/demo/${filename}`,
          public_id: `archives/demo/${filename}`,
          resource_type: 'local',
          original_filename: filename,
          stored_filename: filename,
          file_extension: extension,
          file_type: mimeTypes[extension]?.split('/')[0] || 'document',
          mime_type: mimeTypes[extension] || 'application/octet-stream',
          file_size: buffer.length,
          checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
          thumbnail_path: `/uploads/archives/demo/${thumbnail}`,
          ...(extension === 'wav' ? { duration_seconds: 4 } : {}),
          ...(extension === 'pdf' ? { page_count: 1 } : {}),
        } });
      }
    }
  }

  // Genuine, reuse-safe archival media with the original source and licence recorded.
  const realMediaDir = path.resolve(__dirname, '../uploads/archives/real');
  if (fs.existsSync(realMediaDir)) {
    const realMedia = [
      {
        ref: 'ARC-021', filename: 'jerusalem-1933.jpg', mime: 'image/jpeg', material_type: 'image', place: 'القدس',
        title_ar: 'القدس عام 1933', title_en: 'Jerusalem in 1933', date_text: '1933',
        creator_name: 'American Colony (Jerusalem) Photo Department',
        rights_statement: 'Public domain. Source: Wikimedia Commons, File:Jerusalem in 1933.jpg',
      },
      {
        ref: 'ARC-022', filename: 'palestine-map-1946.jpg', mime: 'image/jpeg', material_type: 'map', place: 'فلسطين',
        title_ar: 'خريطة فلسطين الإدارية، 1946', title_en: 'Administrative Map of Palestine, 1946', date_text: '1946',
        creator_name: 'Survey of Palestine',
        rights_statement: 'Public domain. Source: Wikimedia Commons, File:Palestina 1946.jpg',
      },
      {
        ref: 'ARC-023', filename: 'fedai.ogg', mime: 'audio/ogg', material_type: 'audio', place: 'فلسطين', duration_seconds: 184,
        title_ar: 'فدائي — تسجيل صوتي فلسطيني', title_en: "Fida'i — Palestinian Audio Recording", date_text: '1965',
        creator_name: 'Ali Ismail',
        rights_statement: 'Public domain release. Source: Wikimedia Commons, File:Fedai.ogg',
      },
      {
        ref: 'ARC-024', filename: 'palestinian-dabke.webm', mime: 'video/webm', material_type: 'video', place: 'فلسطين', duration_seconds: 76,
        title_ar: 'الدبكة الفلسطينية — توثيق مرئي', title_en: 'Palestinian Dabke — Video Documentation', date_text: '2017',
        creator_name: 'Sarah Canbel',
        rights_statement: 'Creative Commons Attribution-ShareAlike 4.0. Source: Wikimedia Commons, File:Palestinian Dabke.ogv',
      },
    ];
    await prisma.archiveFile.deleteMany({ where: { storage_path: { startsWith: 'archives/real/' } } });
    const defaultOwner = await prisma.user.findFirst();
    for (const media of realMedia) {
      let record = await prisma.archiveRecord.findFirst({ where: { reference_number: media.ref } });
      const absolutePath = path.join(realMediaDir, media.filename);
      if (!defaultOwner || !fs.existsSync(absolutePath)) continue;
      const archiveData = {
          title_ar: media.title_ar,
          title_en: media.title_en,
          date_text: media.date_text,
          creator_name: media.creator_name,
          rights_statement: media.rights_statement,
          material_type: media.material_type,
          place: media.place,
          language: media.material_type === 'audio' || media.material_type === 'video' ? 'العربية' : 'غير لغوي',
          access_level: 'public',
          status: 'published',
          published_at: new Date(),
          description_ar: `مادة أرشيفية أصلية متاحة للعرض المباشر. المصدر وحقوق الاستخدام موثقان في بيانات السجل.`,
          description_en: 'An authentic archival item available for direct viewing or playback. Source and reuse rights are documented in the record metadata.',
        };
      if (record) {
        record = await prisma.archiveRecord.update({ where: { id: record.id }, data: archiveData });
      } else {
        record = await prisma.archiveRecord.create({ data: {
          ...archiveData,
          owner_id: defaultOwner.id,
          reference_number: media.ref,
        } });
      }
      const buffer = fs.readFileSync(absolutePath);
      const extension = path.extname(media.filename).slice(1).toLowerCase();
      await prisma.archiveFile.create({ data: {
        archive_record_id: record.id,
        owner_id: record.owner_id,
        storage_path: `archives/real/${media.filename}`,
        secure_url: `/uploads/archives/real/${media.filename}`,
        public_id: `archives/real/${media.filename}`,
        resource_type: 'local',
        original_filename: media.filename,
        stored_filename: media.filename,
        file_extension: extension,
        file_type: media.mime.split('/')[0],
        mime_type: media.mime,
        file_size: buffer.length,
        checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
        ...('duration_seconds' in media ? { duration_seconds: media.duration_seconds } : {}),
      } });
    }
  }

  // Link every record to an institution and a valid fonds, preserving all data.
  const pilotInstitutionId = institutions['palestinian-archival-collective'];
  const allInstitutions = await prisma.institution.findMany({ select: { id: true, name_ar: true } });
  const defaultFonds = new Map<string, string>();
  for (const institution of allInstitutions) {
    let fonds = await prisma.archivalUnit.findFirst({
      where: { institution_id: institution.id, parent_id: null, reference_code: 'GF-001' },
    });
    if (!fonds) {
      fonds = await prisma.archivalUnit.create({
        data: {
          institution_id: institution.id,
          level: 'fonds',
          title_ar: 'الرصيد العام',
          title_en: 'General Fonds',
          reference_code: 'GF-001',
          description_ar: 'رصيد افتراضي لحفظ السجلات الحالية حتى استكمال ترتيبها',
          created_by: users['admin@example.com'],
        },
      });
    }
    defaultFonds.set(institution.id, fonds.id);
  }

  const archivalRecords = await prisma.archiveRecord.findMany();
  for (const record of archivalRecords) {
    const matchedInstitution = record.institution_name
      ? allInstitutions.find((institution) => institution.name_ar === record.institution_name)?.id
      : undefined;
    const institutionId = record.institution_id || matchedInstitution || pilotInstitutionId;
    const accessLevel = record.access_level === 'private' ? 'sensitive' : record.access_level;
    await prisma.archiveRecord.update({
      where: { id: record.id },
      data: {
        institution_id: institutionId,
        archival_unit_id: record.archival_unit_id || defaultFonds.get(institutionId),
        access_level: accessLevel,
      },
    });
    await prisma.accessPolicy.upsert({
      where: { archive_record_id: record.id },
      create: {
        archive_record_id: record.id,
        access_level: accessLevel,
        metadata_visibility: accessLevel === 'sovereign' ? 'restricted' : 'public',
        requires_reason: accessLevel !== 'public',
        watermark_enabled: accessLevel === 'sensitive',
      },
      update: {
        access_level: accessLevel,
        metadata_visibility: accessLevel === 'sovereign' ? 'restricted' : 'public',
        requires_reason: accessLevel !== 'public',
        watermark_enabled: accessLevel === 'sensitive',
      },
    });
    const workflowExists = await prisma.archiveWorkflowEvent.findFirst({ where: { archive_record_id: record.id } });
    if (!workflowExists) {
      await prisma.archiveWorkflowEvent.create({
        data: {
          archive_record_id: record.id,
          actor_id: record.owner_id,
          to_status: record.status,
          note: 'ترحيل السجل مع الحفاظ على حالة النشر الحالية',
        },
      });
    }
  }

  // Archive subjects (reconcile per archive by subject_text)
  const records = await prisma.archiveRecord.findMany({
    where: { subject_text: { not: null } },
    select: { id: true, subject_text: true },
  });
  for (const record of records) {
    const subject = record.subject_text as string;
    const exists = await prisma.archiveSubject.findFirst({
      where: { archive_record_id: record.id, subject },
    });
    if (!exists) {
      await prisma.archiveSubject.create({
        data: { archive_record_id: record.id, subject },
      });
    }
  }

  // News articles (upsert by slug)
  const newsSeeds: Prisma.NewsArticleUncheckedCreateInput[] = [
    {
      category_id: newsCategories['archive-news'],
      title_ar: 'إطلاق منصة أرشيفنا الرسمية',
      title_en: 'Launch of the Official Archivna Platform',
      slug: 'platform-launch',
      excerpt_ar: 'يسعدنا الإعلان عن إطلاق منصة أرشيفنا الرسمية لحفظ وتوثيق التراث الفلسطيني.',
      excerpt_en: 'We are pleased to announce the official launch of Archivna for preserving Palestinian heritage.',
      content_ar: 'يسعدنا الإعلان عن إطلاق منصة أرشيفنا الرسمية، وهي منصة رقمية فلسطينية تهدف إلى حفظ وتوثيق وإتاحة المواد الأرشيفية الفلسطينية للأجيال الحالية والقادمة. توفر المنصة أدوات بحث متقدمة وإمكانيات رفع وتصنيف المواد الأرشيفية بسهولة.',
      content_en: 'We are pleased to announce the official launch of Archivna, a Palestinian digital platform dedicated to preserving, documenting, and providing access to Palestinian archival materials for current and future generations. The platform provides advanced search tools and easy upload and classification capabilities.',
      status: 'published',
      is_featured: true,
      published_at: new Date('2024-01-20'),
    },
    {
      category_id: newsCategories['announcements'],
      title_ar: 'دعوة للمشاركة في مسابقة التوثيق الأرشيفي',
      title_en: 'Call for Participation in the Archival Documentation Competition',
      slug: 'documentation-competition',
      excerpt_ar: 'ندعو جميع الباحثين والمثقفين للمشاركة في مسابقة التوثيق الأرشيفي.',
      excerpt_en: 'We invite all researchers and intellectuals to participate in the archival documentation competition.',
      content_ar: 'ندعو جميع الباحثين والمهتمين بالتراث الفلسطيني للمشاركة في مسابقة التوثيق الأرشيفي. المسابقة مفتوحة لجميع الباحثين والمؤسسات الثقافية وتهدف إلى تشجيع التوثيق العلمي للتراث الفلسطيني.',
      content_en: 'We invite all researchers and those interested in Palestinian heritage to participate in the archival documentation competition. The competition is open to all researchers and cultural institutions and aims to encourage scientific documentation of Palestinian heritage.',
      status: 'published',
      is_featured: false,
      published_at: new Date('2024-03-15'),
    },
    {
      category_id: newsCategories['events'],
      title_ar: 'ورشة عمل حول الحفظ الرقمي للمستندات',
      title_en: 'Workshop on Digital Preservation of Documents',
      slug: 'digital-preservation-workshop',
      excerpt_ar: 'ورشة عمل متخصصة حول أحدث تقنيات الحفظ الرقمي للمستندات التاريخية.',
      excerpt_en: 'A specialized workshop on the latest digital preservation techniques for historical documents.',
      content_ar: 'تنظم منصة أرشيفنا ورشة عمل متخصصة حول أحدث تقنيات الحفظ الرقمي للمستندات التاريخية. الورشة مفتوحة لجميع المهتمين وستتناول موضوعات الحفظ والإدارة الرقمية للمستندات الأرشيفية.',
      content_en: 'Archivna organizes a specialized workshop on the latest digital preservation techniques for historical documents. The workshop is open to all interested parties and will cover topics on digital preservation and management of archival documents.',
      status: 'published',
      is_featured: false,
      published_at: new Date('2024-05-20'),
    },
    {
      category_id: newsCategories['archive-news'],
      title_ar: 'شراكة جديدة مع أرشيف القدس',
      title_en: 'New Partnership with Jerusalem Archive',
      slug: 'jerusalem-archive-partnership',
      excerpt_ar: 'وقّعت منصة أرشيفنا اتفاقية شراكة مع أرشيف القدس لتبادل المعرفة والخبرات.',
      excerpt_en: 'Archivna signed a partnership agreement with Jerusalem Archive for knowledge exchange.',
      content_ar: 'وقّعت منصة أرشيفنا اتفاقية شراكة مع أرشيف القدس تهدف إلى تعزيز التعاون المشترك في مجال حفظ وتوثيق التراث الفلسطيني الرقمي. تتضمن الشراكة تبادل الخبرات والموارد الأرشيفية.',
      content_en: 'Archivna signed a partnership agreement with Jerusalem Archive aimed at strengthening cooperation in the field of Palestinian digital heritage preservation. The partnership includes the exchange of expertise and archival resources.',
      status: 'published',
      is_featured: true,
      published_at: new Date('2024-07-15'),
    },
    {
      category_id: newsCategories['announcements'],
      title_ar: 'تحديث المنصة - ميزات جديدة',
      title_en: 'Platform Update - New Features',
      slug: 'platform-update',
      excerpt_ar: 'تم تحديث المنصة بميزات جديدة لتحسين تجربة البحث والتصفح.',
      excerpt_en: 'The platform has been updated with new features to improve the search and browsing experience.',
      content_ar: 'يسعدنا الإعلان عن تحديث شامل للمنصة يتضمن ميزات جديدة مثل البحث المتقدم والتصنيف الذكي وتحسين سرعة التحميل. كما تم تحسين واجهة المستخدم لتجربة أفضل.',
      content_en: 'We are pleased to announce a comprehensive platform update that includes new features such as advanced search, smart classification, and improved loading speed. The user interface has also been improved for a better experience.',
      status: 'published',
      is_featured: false,
      published_at: new Date('2024-08-10'),
    },
    {
      category_id: newsCategories['events'],
      title_ar: 'ندوة دولية: التراث في زمن الأزمات',
      title_en: 'International Symposium: Heritage in Times of Crisis',
      slug: 'heritage-in-crisis-symposium',
      excerpt_ar: 'ندوة افتراضية تجمع خبراء من المنطقة حول حماية التراث في مناطق النزاع.',
      excerpt_en: 'A virtual symposium gathering experts from the region on protecting heritage in conflict zones.',
      content_ar: 'تنظم أرشيفنا ندوة افتراضية دولية حول حماية التراث الوثائقي في مناطق النزاع، بمشاركة خبراء من فلسطين ولبنان وسوريا والأردن. تتناول الندوة تجارب عملية في الإخلاء الطارئ والتوثيق الرقمي والترميم.',
      content_en: 'Archivna organizes an international virtual symposium on protecting documentary heritage in conflict zones, with the participation of experts from Palestine, Lebanon, Syria and Jordan. The symposium addresses practical experiences in emergency evacuation, digital documentation and restoration.',
      status: 'published',
      is_featured: false,
      published_at: new Date('2024-09-10'),
    },
    {
      category_id: newsCategories['archive-news'],
      title_ar: 'إطلاق المنصة التعليمية أرشيفنا أكاديميا',
      title_en: 'Launch of the Archivna Academy Learning Platform',
      slug: 'archivna-academy-launch',
      excerpt_ar: 'أطلقنا سلسلة دورات تدريبية مجانية في علوم الأرشيف والحفظ الرقمي.',
      excerpt_en: 'We launched a series of free training courses in archival science and digital preservation.',
      content_ar: 'تعلن أرشيفنا عن إطلاق أكاديمية أرشيفنا، وهي منصة تعليمية تقدم دورات تدريبية مجانية باللغة العربية في علوم الأرشيف، والحفظ الرقمي، والوصف الأرشيفي، والتاريخ الشفوي. يمكن للباحثين والطلاب والمهنيين الالتحاق بالدورات والحصول على شهادات إتمام.',
      content_en: 'Archivna announces the launch of the Archivna Academy, a learning platform offering free Arabic training courses in archival science, digital preservation, archival description and oral history. Researchers, students and professionals can enroll in courses and receive certificates of completion.',
      status: 'published',
      is_featured: true,
      published_at: new Date('2024-10-15'),
    },
  ];

  for (const seed of newsSeeds) {
    await prisma.newsArticle.upsert({
      where: { slug: seed.slug },
      update: {},
      create: seed,
    });
  }

  // Course categories (upsert by slug)
  const courseCategories: Record<string, string> = {};
  for (const seed of COURSE_CATEGORIES) {
    const cat = await prisma.courseCategory.upsert({
      where: { slug: seed.slug },
      update: {},
      create: seed,
    });
    courseCategories[seed.slug] = cat.id;
  }

  // Course tags (upsert by slug)
  const courseTags: Record<string, string> = {};
  for (const seed of COURSE_TAGS) {
    const tag = await prisma.courseTag.upsert({
      where: { slug: seed.slug },
      update: {},
      create: seed,
    });
    courseTags[seed.slug] = tag.id;
  }

  // Keep the learning area focused on genuine, fully usable courses.
  await prisma.course.deleteMany({ where: { slug: { notIn: REAL_COURSES.map((course) => course.slug) } } });

  // Courses + lessons (upsert by slug)
  for (const seed of REAL_COURSES) {
    const categoryId = courseCategories[seed.categorySlug];
    const course = await prisma.course.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        titleAr: seed.titleAr,
        titleEn: seed.titleEn,
        slug: seed.slug,
        shortDescAr: seed.shortDescAr,
        shortDescEn: seed.shortDescEn,
        fullDescAr: seed.fullDescAr,
        fullDescEn: seed.fullDescEn,
        thumbnailUrl: seed.thumbnailUrl,
        bannerUrl: seed.bannerUrl,
        categoryId,
        instructorName: seed.instructorName,
        instructorBio: seed.instructorBio,
        difficulty: seed.difficulty,
        duration: seed.duration,
        estimatedStudyTime: seed.estimatedStudyTime,
        language: seed.language,
        prerequisites: seed.prerequisites,
        learningObjectives: seed.learningObjectives as Prisma.InputJsonValue,
        archiveTopic: seed.archiveTopic,
        region: seed.region,
        historicalPeriod: seed.historicalPeriod,
        targetAudience: seed.targetAudience,
        status: 'published',
        visibility: 'public',
        isFeatured: seed.isFeatured,
        isPopular: seed.isPopular,
        isFree: seed.isFree,
        publishedAt: new Date(seed.publishedAt),
      },
    });

    for (const tagSlug of seed.tagSlugs) {
      const tagId = courseTags[tagSlug];
      const exists = await prisma.courseTagOnCourse.findUnique({
        where: { courseId_tagId: { courseId: course.id, tagId } },
      });
      if (!exists) {
        await prisma.courseTagOnCourse.create({
          data: { courseId: course.id, tagId },
        });
      }
    }

    for (const lessonSeed of seed.lessons) {
      const lesson = await prisma.lesson.upsert({
        where: {
          courseId_lessonNumber: {
            courseId: course.id,
            lessonNumber: lessonSeed.lessonNumber,
          },
        },
        update: {},
        create: {
          courseId: course.id,
          lessonNumber: lessonSeed.lessonNumber,
          titleAr: lessonSeed.titleAr,
          titleEn: lessonSeed.titleEn,
          slug: lessonSeed.slug,
          videoUrl: lessonSeed.videoUrl,
          videoDuration: lessonSeed.videoDuration,
          contentAr: lessonSeed.contentAr,
          contentEn: lessonSeed.contentEn,
          summaryAr: lessonSeed.summaryAr,
          summaryEn: lessonSeed.summaryEn,
          estimatedReadingTime: lessonSeed.estimatedReadingTime,
          isAssessment: lessonSeed.isAssessment,
          status: 'published',
        },
      });

      if (lessonSeed.attachments) {
        await prisma.lessonAttachment.deleteMany({
          where: { lessonId: lesson.id },
        });
        for (let idx = 0; idx < lessonSeed.attachments.length; idx++) {
          const a = lessonSeed.attachments[idx];
          await prisma.lessonAttachment.create({
            data: {
              lessonId: lesson.id,
              type: a.type,
              titleAr: a.titleAr,
              titleEn: a.titleEn,
              url: a.url,
              mimeType: a.mimeType,
              fileSize: a.fileSize,
              sortOrder: idx,
            },
          });
        }
      }
    }
  }

  // Achievements (delete + recreate, no unique constraint on natural key)
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  for (const seed of ACHIEVEMENTS) {
    await prisma.achievement.create({ data: seed });
  }

  console.log('Seeding completed successfully!');
  console.log(`Users: ${await prisma.user.count()}`);
  console.log(`Institutions: ${await prisma.institution.count()}`);
  console.log(`Archive records: ${await prisma.archiveRecord.count()}`);
  console.log(`News articles: ${await prisma.newsArticle.count()}`);
  console.log(`Course categories: ${await prisma.courseCategory.count()}`);
  console.log(`Course tags: ${await prisma.courseTag.count()}`);
  console.log(`Courses: ${await prisma.course.count()}`);
  console.log(`Lessons: ${await prisma.lesson.count()}`);
  console.log(`Achievements: ${await prisma.achievement.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
