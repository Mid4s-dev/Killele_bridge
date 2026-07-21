"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { academyApi } from "@/lib/api";
import type { AcademyDashboard } from "@/types";
import { Brain, BookOpen, Clock, CheckCircle, PlayCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcademyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AcademyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role === "free") {
      router.push("/dashboard/payment");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role === "free") return;

    academyApi
      .getDashboard()
      .then(setDashboard)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user || user.role === "free") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const handleStartCourse = async (courseId: string) => {
    try {
      await academyApi.startCourse(courseId);
      // Refresh dashboard
      const updated = await academyApi.getDashboard();
      setDashboard(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      not_started: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status as keyof typeof styles] || ""}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-gold-500" />
            <h1 className="text-3xl font-bold text-gray-900">AI Training Academy</h1>
          </div>
          <p className="text-gray-600">Master AI tools and advanced freelancing strategies</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : dashboard ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                  <p className="text-sm text-gray-600">Total Courses</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{dashboard.total_courses}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{dashboard.completed_courses}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <PlayCircle className="w-8 h-8 text-blue-500" />
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{dashboard.in_progress_courses}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-8 h-8 text-gold-500" />
                  <p className="text-sm text-gray-600">Overall Progress</p>
                </div>
                <p className="text-3xl font-bold text-gold-600">{dashboard.overall_percent}%</p>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboard.courses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      {getStatusIcon(course.status)}
                      {getStatusBadge(course.status)}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_minutes} minutes</span>
                      <span className="mx-1">•</span>
                      <span>{course.category}</span>
                    </div>

                    {/* Progress Bar */}
                    {course.status !== "not_started" && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(course.percent_complete)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-500 transition-all duration-300"
                            style={{ width: `${course.percent_complete}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleStartCourse(course.course_id)}
                      className="w-full"
                      variant={course.status === "not_started" ? "default" : "outline"}
                      disabled={course.status === "completed"}
                    >
                      {course.status === "completed" && "Completed"}
                      {course.status === "in_progress" && "Continue"}
                      {course.status === "not_started" && "Start Course"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600">Check back later for new training content</p>
          </div>
        )}
      </div>
    </div>
  );
}
