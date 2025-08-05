
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Class, AttendanceRecord, AttendanceSummary, Student } from '../../../server/src/schema';

interface TeacherDashboardProps {
  classes: Class[];
}

export function TeacherDashboard({ classes }: TeacherDashboardProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()).toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [dailyAttendance, setDailyAttendance] = useState<AttendanceRecord[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<AttendanceRecord[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceSummary[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get Monday of current week
  function getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  const loadStudents = useCallback(async (classId: number) => {
    try {
      const result = await trpc.getStudentsByClass.query({ classId });
      setStudents(result);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  }, []);

  const loadDailyAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getDailyAttendance.query({
        class_id: selectedClassId,
        date: new Date(selectedDate)
      });
      setDailyAttendance(result);
    } catch (error) {
      console.error('Failed to load daily attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedDate]);

  const loadWeeklyAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getWeeklyAttendance.query({
        class_id: selectedClassId,
        week_start: new Date(selectedWeekStart)
      });
      setWeeklyAttendance(result);
    } catch (error) {
      console.error('Failed to load weekly attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedWeekStart]);

  const loadMonthlyAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getMonthlyAttendance.query({
        class_id: selectedClassId,
        month: selectedMonth,
        year: selectedYear
      });
      setMonthlyAttendance(result);
    } catch (error) {
      console.error('Failed to load monthly attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId, loadStudents]);

  const getAttendanceStats = (records: AttendanceRecord[]) => {
    const stats = {
      Hadir: 0,
      Sakit: 0,
      Izin: 0,
      Alfa: 0,
      Dispen: 0,
      total: records.length
    };

    records.forEach((record: AttendanceRecord) => {
      stats[record.status]++;
    });

    return stats;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Hadir: 'bg-green-500',
      Sakit: 'bg-yellow-500',
      Izin: 'bg-blue-500',
      Alfa: 'bg-red-500',
      Dispen: 'bg-purple-500'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-500';
  };

  const getStudentName = (studentId: number) => {
    const student = students.find((s: Student) => s.id === studentId);
    return student ? student.name : `Student ${studentId}`;
  };

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏫 Pilih Kelas untuk Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => setSelectedClassId(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kelas untuk melihat laporan..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classItem: Class) => (
                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                  {classItem.name} - {classItem.grade} ({classItem.academic_year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">📅 Harian</TabsTrigger>
            <TabsTrigger value="weekly">📊 Mingguan</TabsTrigger>
            <TabsTrigger value="monthly">📈 Bulanan</TabsTrigger>
          </TabsList>

          {/* Daily Report */}
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📅 Laporan Absensi Harian</CardTitle>
                <CardDescription>
                  Lihat absensi siswa pada tanggal tertentu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button onClick={loadDailyAttendance} disabled={isLoading}>
                    {isLoading ? 'Loading...' : '🔍 Lihat Laporan'}
                  </Button>
                </div>

                {dailyAttendance.length > 0 && (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(getAttendanceStats(dailyAttendance)).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-2xl font-bold">{value}</div>
                          <div className="text-sm text-gray-600 capitalize">{key}</div>
                        </div>
                      ))}
                    </div>

                    {/* Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Catatan</TableHead>
                          <TableHead>Waktu Catat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyAttendance.map((record: AttendanceRecord) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {getStudentName(record.student_id)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-white ${getStatusBadge(record.status)}`}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.notes || '-'}</TableCell>
                            <TableCell>
                              {record.created_at.toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {dailyAttendance.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    📋 Belum ada data absensi untuk tanggal ini
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Report */}
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Laporan Absensi Mingguan</CardTitle>
                <CardDescription>
                  Lihat absensi siswa dalam satu minggu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Minggu Dimulai</Label>
                    <input
                      type="date"
                      value={selectedWeekStart}
                      onChange={(e) => setSelectedWeekStart(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button onClick={loadWeeklyAttendance} disabled={isLoading}>
                    {isLoading ? 'Loading...' : '🔍 Lihat Laporan'}
                  </Button>
                </div>

                {weeklyAttendance.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(getAttendanceStats(weeklyAttendance)).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-2xl font-bold">{value}</div>
                          <div className="text-sm text-gray-600 capitalize">{key}</div>
                        </div>
                      ))}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyAttendance.map((record: AttendanceRecord) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {getStudentName(record.student_id)}
                            </TableCell>
                            <TableCell>
                              {record.date.toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-white ${getStatusBadge(record.status)}`}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {weeklyAttendance.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    📋 Belum ada data absensi untuk minggu ini
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Report */}
          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📈 Laporan Absensi Bulanan</CardTitle>
                <CardDescription>
                  Lihat ringkasan absensi siswa dalam satu bulan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2024, i).toLocaleDateString('id-ID', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={loadMonthlyAttendance} disabled={isLoading}>
                    {isLoading ? 'Loading...' : '🔍 Lihat Laporan'}
                  </Button>
                </div>

                {monthlyAttendance.length > 0 && (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {monthlyAttendance.reduce((sum: number, summary: AttendanceSummary) => sum + summary.hadir, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Hadir</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {monthlyAttendance.reduce((sum: number, summary: AttendanceSummary) => sum + summary.sakit, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Sakit</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {monthlyAttendance.reduce((sum: number, summary: AttendanceSummary) => sum + summary.izin, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Izin</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {monthlyAttendance.reduce((sum: number, summary: AttendanceSummary) => sum + summary.alfa, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Alfa</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {monthlyAttendance.reduce((sum: number, summary: AttendanceSummary) => sum + summary.dispen, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Dispen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {monthlyAttendance.reduce((sum: number, summary: AttendanceSummary) => sum + summary.total_days, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>

                    {/* Summary Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Total Hari</TableHead>
                          <TableHead>Hadir</TableHead>
                          <TableHead>Sakit</TableHead>
                          <TableHead>Izin</TableHead>
                          <TableHead>Alfa</TableHead>
                          <TableHead>Dispen</TableHead>
                          <TableHead>Persentase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyAttendance.map((summary: AttendanceSummary) => (
                          <TableRow key={summary.student_id}>
                            <TableCell className="font-medium">
                              {summary.student_name}
                            </TableCell>
                            <TableCell>{summary.total_days}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-500 text-white">
                                {summary.hadir}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-500 text-white">
                                {summary.sakit}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-500 text-white">
                                {summary.izin}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-red-500 text-white">
                                {summary.alfa}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-purple-500 text-white">
                                {summary.dispen}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`font-semibold ${
                                  summary.attendance_percentage >= 80 
                                    ? 'text-green-600 border-green-600' 
                                    : summary.attendance_percentage >= 60 
                                    ? 'text-yellow-600 border-yellow-600' 
                                    : 'text-red-600 border-red-600'
                                }`}
                              >
                                {summary.attendance_percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {monthlyAttendance.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    📋 Belum ada data absensi untuk bulan ini
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
