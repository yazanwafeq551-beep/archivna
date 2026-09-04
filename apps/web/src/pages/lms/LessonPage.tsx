import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Lock, Play, Pause,
  FileText, Download, ExternalLink, BookOpen, Clock, Maximize,
  Volume2, SkipBack, SkipForward, Sparkles, Award, CheckCheck
} from "lucide-react";
import {
  useLesson,
  useUpdateProgress,
  useCourseBySlug,
  useCompleteLesson,
} from "@/hooks/useLms";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/hooks/useAuth";
import { LessonSidebar } from "@/components/lms/LessonSidebar";
import { LessonContent } from "@/components/lms/LessonContent";
import { GuestModal } from "@/components/lms/GuestModal";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LessonPage() {
  const { t, i18n } = useTranslation();
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const totalWatchTimeRef = useRef(0);

  const { data: course, isLoading: courseLoading } = useCourseBySlug(courseSlug ?? "");
  const { data: lesson, isLoading: lessonLoading, isError: lessonError, refetch: refetchLesson } = useLesson(
    course?.id ?? "",
    lessonId ?? ""
  );
  const updateProgressMutation = useUpdateProgress();
  const completeLessonMutation = useCompleteLesson();
  const [courseFinished, setCourseFinished] = useState(false);

  const lessons = course?.lessons ?? [];
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const isRtl = i18n.language === "ar";
  const isLocked = lesson?.lessonNumber && lesson.lessonNumber > 1 && !lessons.find(l => l.lessonNumber === lesson.lessonNumber - 1)?.userProgress?.isCompleted;

  const title = isRtl ? lesson?.titleAr : (lesson?.titleEn || lesson?.titleAr || "");
  const courseTitle = (isRtl ? course?.titleAr : (course?.titleEn || course?.titleAr)) ?? "";

  const saveProgress = useCallback((watched: number, percentage: number, position: number) => {
    if (!course?.id || !lessonId) return;
    updateProgressMutation.mutate({
      courseId: course.id,
      lessonId,
      data: {
        watchedSeconds: Math.round(watched),
        watchPercentage: Math.round(percentage),
        lastPosition: Math.round(position),
        totalWatchTime: Math.round(totalWatchTimeRef.current),
      },
    });
  }, [course?.id, lessonId, updateProgressMutation]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !duration) return;
    setCurrentTime(video.currentTime);
    const percentage = (video.currentTime / duration) * 100;
    setWatchPercentage(percentage);
    totalWatchTimeRef.current += 0.25;

    if (percentage >= 95 && !hasCompleted) {
      setHasCompleted(true);
      saveProgress(totalWatchTimeRef.current, 100, video.currentTime);

      // Finishing the last lesson finishes the course, so the learner is sent
      // to the certificate rather than a generic "well done".
      if (!nextLesson) {
        setCourseFinished(true);
      } else {
        setShowCompletion(true);
        setTimeout(() => setShowCompletion(false), 4000);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (lesson?.userProgress?.lastPosition) {
        videoRef.current.currentTime = lesson.userProgress.lastPosition;
      }
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = time;
    setCurrentTime(time);
    saveProgress(totalWatchTimeRef.current, (time / duration) * 100, time);
  };

  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      if (isPlaying && duration > 0) {
        const video = videoRef.current;
        if (video) {
          saveProgress(totalWatchTimeRef.current, watchPercentage, video.currentTime);
        }
      }
    }, 15000);

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [isPlaying, duration, watchPercentage, saveProgress]);

  useEffect(() => {
    if (lesson?.userProgress?.watchPercentage) {
      setWatchPercentage(lesson.userProgress.watchPercentage);
      if (lesson.userProgress.isCompleted) {
        setHasCompleted(true);
      }
    }
  }, [lesson]);


  // A lesson without a video is finished by reading it; without this the
  // course - and its certificate - could never be completed.
  const handleMarkComplete = async () => {
    if (!course?.id || !lessonId) return;
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }

    try {
      await completeLessonMutation.mutateAsync({ courseId: course.id, lessonId });
      setHasCompleted(true);
      const isLast = !nextLesson;
      if (isLast) {
        setCourseFinished(true);
      } else {
        setShowCompletion(true);
      }
      await refetchLesson();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleNextLesson = () => {
    if (nextLesson && hasCompleted) {
      navigate(`/lms/courses/${courseSlug}/lessons/${nextLesson.id}`);
    }
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      navigate(`/lms/courses/${courseSlug}/lessons/${prevLesson.id}`);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) videoRef.current.volume = vol;
  };

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  const handleVideoClick = () => {
    if (showControls) {
      handlePlayPause();
    } else {
      setShowControls(true);
      showControlsTemporarily();
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    const video = videoRef.current?.parentElement;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !courseLoading && !lessonLoading) {
      setShowGuestModal(true);
    }
  }, [isAuthenticated, courseLoading, lessonLoading]);

  if (courseLoading || lessonLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 rounded bg-gold-light/30" />
            <div className="aspect-video rounded-2xl bg-gold-light/30" />
            <div className="h-8 w-3/4 rounded bg-gold-light/30" />
            <div className="h-4 w-1/2 rounded bg-gold-light/20" />
          </div>
        </div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <ErrorState
            title={t("lms.lesson.errorTitle")}
            message={t("lms.lesson.errorMessage")}
            onRetry={() => refetchLesson()}
          />
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-gold-light/30 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-muted hover:text-primary">
              <Link to={`/lms/courses/${courseSlug}`}>
                <ChevronLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
                <span className="ms-1">{t("lms.lesson.back")}</span>
              </Link>
            </Button>
            <span className="hidden text-sm font-medium text-foreground sm:inline truncate max-w-[300px]">
              {courseTitle}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">{t("lms.lesson.lesson")} {lesson.lessonNumber}</span>
            <span className="hidden sm:inline">/ {lessons.length}</span>
            {hasCompleted && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("lms.lesson.completed")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Locked Overlay */}
        {isLocked ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gold-light/30 bg-surface p-16 text-center">
            <div className="mb-4 rounded-full bg-gold-light/30 p-6">
              <Lock className="h-12 w-12 text-muted" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">{t("lms.lesson.lockedTitle")}</h2>
            <p className="mb-6 text-sm text-muted max-w-md">{t("lms.lesson.lockedDescription")}</p>
            <Button variant="outline" asChild>
              <Link to={`/lms/courses/${courseSlug}`}>{t("lms.lesson.backToCourse")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              {!lesson.videoUrl && (
                <div className="rounded-2xl border border-gold-light/40 bg-surface p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-light/40 text-gold-deep">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {t("lms.lessonActions.readingLesson")}
                        </p>
                        {lesson.estimatedReadingTime ? (
                          <p className="text-sm text-muted">
                            {lesson.estimatedReadingTime} {t("lms.lesson.minutes")}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {hasCompleted ? (
                      <span className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
                        <CheckCheck className="h-4 w-4" />
                        {t("lms.lessonActions.completed")}
                      </span>
                    ) : (
                      <Button
                        onClick={handleMarkComplete}
                        isLoading={completeLessonMutation.isPending}
                        variant="gold"
                      >
                        <CheckCircle2 className="me-1 h-4 w-4" />
                        {t("lms.lessonActions.markComplete")}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {lesson.videoUrl && (
                <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl" onClick={handleVideoClick}>
                  <video
                    ref={videoRef}
                    src={lesson.videoUrl}
                    className="aspect-video w-full cursor-pointer"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => {
                      setIsPlaying(true);
                      showControlsTemporarily();
                    }}
                    onPause={() => {
                      setIsPlaying(false);
                      setShowControls(true);
                      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                      if (videoRef.current) {
                        saveProgress(totalWatchTimeRef.current, watchPercentage, videoRef.current.currentTime);
                      }
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      setShowControls(true);
                      if (videoRef.current) {
                        saveProgress(totalWatchTimeRef.current, 100, duration);
                        if (!hasCompleted) {
                          setHasCompleted(true);
                          setShowCompletion(true);
                          setTimeout(() => setShowCompletion(false), 4000);
                        }
                      }
                    }}
                    playsInline
                    preload="auto"
                  />

                  {/* Video Controls Overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300",
                      showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 space-y-2">
                      {/* Seek Bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/70 tabular-nums">
                          {formatTime(currentTime)}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={duration ? (currentTime / duration) * 100 : 0}
                          onChange={handleSeek}
                          className="flex-1 h-1 cursor-pointer appearance-none rounded-full bg-white/30 accent-gold [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
                        />
                        <span className="text-xs text-white/70 tabular-nums">
                          {formatTime(duration)}
                        </span>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={handlePlayPause} className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          </button>
                          <div className="flex items-center gap-1">
                            <Volume2 className="h-4 w-4 text-white/70" />
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.1}
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-20 h-1 cursor-pointer appearance-none rounded-full bg-white/30 accent-gold [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
                            />
                          </div>
                        </div>
                        <button onClick={toggleFullscreen} className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                          <Maximize className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Title & Info */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted mb-2">
                  <BookOpen className="h-4 w-4" />
                  {t("lms.lesson.lesson")} {lesson.lessonNumber} {t("lms.lesson.of")} {lessons.length}
                  {lesson.videoDuration && (
                    <>
                      <span className="text-muted">•</span>
                      <Clock className="h-4 w-4" />
                      {formatTime(lesson.videoDuration)}
                    </>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              </div>

              {/* Lesson Content */}
              {lesson.contentAr || lesson.contentEn ? (
                <div className="rounded-xl border border-gold-light/30 bg-surface p-6">
                  <LessonContent
                    content={isRtl ? (lesson.contentAr || "") : (lesson.contentEn || lesson.contentAr || "")}
                    attachments={lesson.attachments}
                  />
                </div>
              ) : null}

              {/* Completion Status */}
              <div className="rounded-xl border border-gold-light/30 bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      hasCompleted ? "bg-green-100" : "bg-gold-light/30"
                    )}>
                      {hasCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {hasCompleted
                          ? t("lms.lesson.completedMessage")
                          : lesson.videoUrl
                          ? t("lms.lesson.watchToComplete")
                          : t("lms.lessonActions.markComplete")}
                      </p>
                      {!hasCompleted && watchPercentage > 0 && (
                        <p className="text-xs text-muted">
                          {Math.round(watchPercentage)}% {t("lms.lesson.watched")}
                        </p>
                      )}
                    </div>
                  </div>
                  {hasCompleted && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("lms.lesson.done")}
                    </Badge>
                  )}
                </div>
                <Progress
                  value={watchPercentage}
                  className="mt-3 h-1.5 bg-gold-light/50 [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-primary"
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevLesson}
                  disabled={!prevLesson}
                  className="border-gold-light/40"
                >
                  <ChevronLeft className={cn("me-2 h-4 w-4", isRtl && "rotate-180")} />
                  {t("lms.lesson.previous")}
                </Button>
                <Button
                  variant="gold"
                  onClick={handleNextLesson}
                  disabled={!nextLesson || !hasCompleted}
                  className="shadow-lg shadow-gold/20"
                >
                  {t("lms.lesson.next")}
                  <ChevronRight className={cn("ms-2 h-4 w-4", isRtl && "rotate-180")} />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <LessonSidebar
                courseId={course?.id ?? ""}
                courseSlug={courseSlug ?? ""}
                courseTitle={courseTitle}
                lessons={lessons}
                currentLessonId={lessonId}
                courseProgress={course?.enrollment?.courseProgress ?? 0}
                className="sticky top-24"
              />
            </div>
          </div>
        )}
      </div>

      {/* Finishing the last lesson: the certificate is waiting. */}
      {courseFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-w-md flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-2xl">
            <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-gold to-amber-500 shadow-lg shadow-gold/30">
              <Award className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {t("lms.completion.title")}
            </h2>
            <p className="mb-6 text-sm text-muted">
              {t("lms.completion.description", { course: courseTitle })}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="gold"
                onClick={() => navigate("/dashboard/learning/certificates")}
              >
                <Award className="me-1 h-4 w-4" />
                {t("lms.completion.viewCertificate")}
              </Button>
              <Button variant="outline" onClick={() => setCourseFinished(false)}>
                {t("lms.lesson.continue")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Animation */}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="mx-4 flex flex-col items-center rounded-2xl bg-surface p-6 sm:p-10 shadow-2xl">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-500 shadow-lg shadow-gold/30">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">{t("lms.lesson.completionTitle")}</h2>
            <p className="mb-6 text-sm text-muted text-center max-w-sm">{t("lms.lesson.completionMessage")}</p>
            <Button onClick={() => setShowCompletion(false)} variant="gold">
              {t("lms.lesson.continue")}
            </Button>
          </div>
        </div>
      )}

      <GuestModal open={showGuestModal} onOpenChange={setShowGuestModal} />
    </div>
  );
}
