
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Class, Student, AttendanceStatus, RecordAttendanceInput } from '../../../server/src/schema';

interface AttendanceRecorderProps {
  classes: Class[];
}

export function AttendanceRecorder({ classes }: AttendanceRecorderProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecorders, setAttendanceRecorders] = useState<Student[]>([]);
  const [selectedRecorder, setSelectedRecorder] = useState<number | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<number, { status: AttendanceStatus; notes: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const attendanceOptions: { value: AttendanceStatus; label: string; color: string }[] = [
    { value: 'Hadir', label: '✅ Hadir', color: 'bg-green-500' },
    { value: 'Sakit', label: '🤒 Sakit', color: 'bg-yellow-500' },
    { value: 'Izin', label: '📝 Izin', color: 'bg-blue-500' },
    { value: 'Alfa', label: '❌ Alfa', color: 'bg-red-500' },
    { value: 'Dispen', label: '📋 Dispen', color: 'bg-purple-500' }
  ];

  const loadStudents = useCallback(async (classId: number) => {
    try {
      setIsLoading(true);
      const [studentsResult, recordersResult] = await Promise.all([
        trpc.getStudentsByClass.query({ classId }),
        trpc.getAttendanceRecorders.query({ classId })
      ]);
      
      setStudents(studentsResult);
      setAttendanceRecorders(recordersResult);
      
      // Initialize attendance data with default 'Hadir' status
      const initialData: Record<number, { status: AttendanceStatus; notes: string }> = {};
      studentsResult.forEach((student: Student) => {
        initialData[student.id] = { status: 'Hadir', notes: '' };
      });
      setAttendanceData(initialData);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId, loadStudents]);

  const handleClassChange = (value: string) => {
    const classId = parseInt(value);
    setSelectedClassId(classId);
    setSelectedRecorder(null);
  };

  const handleAttendanceChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceData((prev: Record<number, { status: AttendanceStatus; notes: string }>) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleNotesChange = (studentId: number, notes: string) => {
    setAttendanceData((prev: Record<number, { status: AttendanceStatus; notes: string }>) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClassId || !selectedRecorder) {
      alert('Pilih kelas dan pencatat absensi terlebih dahulu');
      return;
    }

    try {
      setIsSubmitting(true);
      const date = new Date(selectedDate);
      
      // Submit attendance for all students
      const promises = students.map((student: Student) => {
        const data = attendanceData[student.id];
        const input: RecordAttendanceInput = {
          student_id: student.id,
          class_id: selectedClassId,
          status: data.status,
          date,
          recorded_by: selectedRecorder,
          notes: data.notes || null
        };
        return trpc.recordAttendance.mutate(input);
      });

      await Promise.all(promises);
      alert(`✅ Absensi berhasil dicatat untuk ${students.length} siswa!`);
      
      // Reset form
      const initialData: Record<number, { status: AttendanceStatus; notes: string }> = {};
      students.forEach((student: Student) => {
        initialData[student.id] = { status: 'Hadir', notes: '' };
      });
      setAttendanceData(initialData);
      
    } catch (error) {
      console.error('Failed to record attendance:', error);
      alert('❌ Gagal mencatat absensi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusCount = () => {
    const counts = {
      Hadir: 0,
      Sakit: 0,
      Izin: 0,
      Alfa: 0,
      Dispen: 0
    };
    
    Object.values(attendanceData).forEach((data) => {
      counts[data.status]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCount();

  return (
    <div className="space-y-6">
      {/* Class and Recorder Selection */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Pilih Kelas</Label>
          <Select onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelas..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classItem: Class) => (
                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                  {classItem.name} - {classItem.grade} ({classItem.academic_year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tanggal Absensi</Label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label>Pencatat Absensi</Label>
          <Select 
            value={selectedRecorder?.toString() || ''} 
            onValueChange={(value) => setSelectedRecorder(parseInt(value))}
            disabled={!selectedClassId || attendanceRecorders.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih pencatat..." />
            </SelectTrigger>
            <SelectContent>
              {attendanceRecorders.map((recorder: Student) => (
                <SelectItem key={recorder.id} value={recorder.id.toString()}>
                  {recorder.name} ({recorder.student_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClassId && (
        <>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  ⚠️ Belum ada siswa di kelas ini. Silakan tambahkan siswa terlebih dahulu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Ringkasan Absensi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {attendanceOptions.map((option) => (
                      <Badge key={option.value} variant="outline" className="px-3 py-1">
                        {option.label}: {statusCounts[option.value]}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="px-3 py-1 font-semibold">
                      Total: {students.length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">👥 Daftar Siswa</CardTitle>
                  <CardDescription>
                    Pilih status kehadiran untuk setiap siswa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students.map((student: Student) => (
                      <div key={student.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-600">NIS: {student.student_id}</p>
                            {student.is_attendance_recorder && (
                              <Badge variant="secondary" className="mt-1">
                                📝 Pencatat Absensi
                              </Badge>
                            )}
                          </div>
                          <Select
                            value={attendanceData[student.id]?.status || 'Hadir'}
                            onValueChange={(value: AttendanceStatus) => 
                              handleAttendanceChange(student.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {attendanceOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {attendanceData[student.id]?.status !== 'Hadir' && (
                          <div className="space-y-2">
                            <Label className="text-sm">Catatan (opsional)</Label>
                            <Textarea
                              placeholder="Tambahkan catatan untuk ketidakhadiran..."
                              value={attendanceData[student.id]?.notes || ''}
                              onChange={(e) => handleNotesChange(student.id, e.target.value)}
                              className="min-h-[60px]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="text-center">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={!selectedRecorder || isSubmitting}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan Absensi...
                    </>
                  ) : (
                    <>💾 Simpan Absensi ({students.length} siswa)</>
                  )}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
