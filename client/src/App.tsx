
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Class, Teacher } from '../../server/src/schema';

// Import components
import { AttendanceRecorder } from '@/components/AttendanceRecorder';
import { TeacherLogin } from '@/components/TeacherLogin';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { ClassManagement } from '@/components/ClassManagement';
import { StudentManagement } from '@/components/StudentManagement';

function App() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loggedInTeacher, setLoggedInTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load classes on mount
  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getClasses.query();
      setClasses(result);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleTeacherLogin = (teacher: Teacher) => {
    setLoggedInTeacher(teacher);
  };

  const handleLogout = () => {
    setLoggedInTeacher(null);
  };

  const handleClassUpdate = () => {
    loadClasses(); // Refresh classes when updated
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Sistem Absensi Kelas
          </h1>
          <p className="text-gray-600">
            Catat kehadiran siswa dengan mudah dan lihat laporan absensi
          </p>
        </div>

        {!loggedInTeacher ? (
          // Public Interface - Attendance Recording
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attendance">📝 Catat Absensi</TabsTrigger>
              <TabsTrigger value="teacher-login">👨‍🏫 Login Guru</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ✅ Pencatatan Absensi Siswa
                  </CardTitle>
                  <CardDescription>
                    Pilih kelas dan catat kehadiran siswa hari ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Memuat data kelas...</p>
                    </div>
                  ) : classes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        ⚠️ Belum ada kelas yang tersedia. Silakan hubungi guru untuk membuat kelas.
                      </p>
                    </div>
                  ) : (
                    <AttendanceRecorder classes={classes} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher-login">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔐 Login Guru
                  </CardTitle>
                  <CardDescription>
                    Login untuk mengakses dashboard guru dan mengelola data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TeacherLogin onLogin={handleTeacherLogin} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Teacher Dashboard
          <div className="space-y-6">
            {/* Teacher Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      👋 Selamat datang, {loggedInTeacher.name}
                    </CardTitle>
                    <CardDescription>{loggedInTeacher.email}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    🚪 Logout
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Teacher Dashboard Tabs */}
            <Tabs defaultValue="reports" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reports">📊 Laporan</TabsTrigger>
                <TabsTrigger value="classes">🏫 Kelola Kelas</TabsTrigger>
                <TabsTrigger value="students">👥 Kelola Siswa</TabsTrigger>
                <TabsTrigger value="attendance">📝 Absensi</TabsTrigger>
              </TabsList>

              <TabsContent value="reports">
                <TeacherDashboard classes={classes} />
              </TabsContent>

              <TabsContent value="classes">
                <ClassManagement 
                  classes={classes} 
                  onClassUpdate={handleClassUpdate}
                />
              </TabsContent>

              <TabsContent value="students">
                <StudentManagement classes={classes} />
              </TabsContent>

              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>📝 Pencatatan Absensi</CardTitle>
                    <CardDescription>
                      Interface yang sama seperti siswa untuk mencatat absensi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AttendanceRecorder classes={classes} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
