
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Class, Student, CreateStudentInput, UpdateStudentInput } from '../../../server/src/schema';

interface StudentManagementProps {
  classes: Class[];
}

export function StudentManagement({ classes }: StudentManagementProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [createData, setCreateData] = useState<CreateStudentInput>({
    name: '',
    student_id: '',
    class_id: 0,
    is_attendance_recorder: false
  });

  const [editData, setEditData] = useState<UpdateStudentInput>({
    id: 0,
    name: '',
    student_id: '',
    class_id: 0,
    is_attendance_recorder: false
  });

  const loadStudents = useCallback(async (classId: number) => {
    try {
      setIsLoading(true);
      const result = await trpc.getStudentsByClass.query({ classId });
      setStudents(result);
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

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.createStudent.mutate(createData);
      setCreateData({
        name: '',
        student_id: '',
        class_id: selectedClassId || 0,
        is_attendance_recorder: false
      });
      setIsCreateOpen(false);
      if (selectedClassId) {
        loadStudents(selectedClassId);
      }
    } catch (error) {
      console.error('Failed to create student:', error);
      alert('❌ Gagal menambah siswa. NIS mungkin sudah ada.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.updateStudent.mutate(editData);
      setIsEditOpen(false);
      if (selectedClassId) {
        loadStudents(selectedClassId);
      }
    } catch (error) {
      console.error('Failed to update student:', error);
      alert('❌ Gagal mengupdate siswa. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    setIsLoading(true);

    try {
      await trpc.deleteStudent.mutate({ id: studentId });
      if (selectedClassId) {
        loadStudents(selectedClassId);
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('❌ Gagal menghapus siswa. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setCreateData({
      name: '',
      student_id: '',
      class_id: selectedClassId || 0,
      is_attendance_recorder: false
    });
    setIsCreateOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditData({
      id: student.id,
      name: student.name,
      student_id: student.student_id,
      class_id: student.class_id,
      is_attendance_recorder: student.is_attendance_recorder
    });
    setIsEditOpen(true);
  };

  const getClassName = (classId: number) => {
    const classItem = classes.find((c: Class) => c.id === classId);
    return classItem ? `${classItem.name} - ${classItem.grade}` : `Class ${classId}`;
  };

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 Manajemen Siswa
          </CardTitle>
          <CardDescription>
            Kelola data siswa dan status pencatat absensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Kelas</Label>
              <Select onValueChange={(value) => setSelectedClassId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas untuk mengelola siswa..." />
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

            {selectedClassId && (
              <Button onClick={openCreateDialog}>
                ➕ Tambah Siswa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Daftar Siswa - {getClassName(selectedClassId)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat data siswa...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  👥 Belum ada siswa di kelas ini. Tambahkan siswa pertama!
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>
                        {student.is_attendance_recorder ? (
                          <Badge className="bg-blue-500 text-white">
                            📝 Pencatat Absensi
                          </Badge>
                        ) : (
                          <Badge variant="outline">👤 Siswa Biasa</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.created_at.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(student)}
                          >
                            ✏️ Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                🗑️ Hapus
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus siswa "{student.name}"? 
                                  Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data absensi terkait.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ya, Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Student Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Siswa Baru</DialogTitle>
            <DialogDescription>
              Tambahkan siswa baru ke kelas {selectedClassId && getClassName(selectedClassId)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStudent}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Nama Lengkap</Label>
                <Input
                  id="student-name"
                  placeholder="Nama lengkap siswa"
                  value={createData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateData((prev: CreateStudentInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-id">NIS (Nomor Induk Siswa)</Label>
                <Input
                  id="student-id"
                  placeholder="Contoh: 20240001"
                  value={createData.student_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateData((prev: CreateStudentInput) => ({ ...prev, student_id: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-select">Kelas</Label>
                <Select 
                  value={createData.class_id.toString()} 
                  onValueChange={(value) => 
                    setCreateData((prev: CreateStudentInput) => ({ ...prev, class_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attendance-recorder"
                  checked={createData.is_attendance_recorder}
                  onCheckedChange={(checked: boolean) =>
                    setCreateData((prev: CreateStudentInput) => ({ ...prev, is_attendance_recorder: checked }))
                  }
                />
                <Label htmlFor="attendance-recorder">
                  Jadikan sebagai pencatat absensi
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : '💾 Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Siswa</DialogTitle>
            <DialogDescription>
              Perbarui informasi siswa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStudent}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-student-name">Nama Lengkap</Label>
                <Input
                  id="edit-student-name"
                  value={editData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData((prev: UpdateStudentInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-student-id">NIS (Nomor Induk Siswa)</Label>
                <Input
                  id="edit-student-id"
                  value={editData.student_id || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData((prev: UpdateStudentInput) => ({ ...prev, student_id: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-class-select">Kelas</Label>
                <Select 
                  value={editData.class_id?.toString() || ''} 
                  onValueChange={(value) => 
                    setEditData((prev: UpdateStudentInput) => ({ ...prev, class_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-attendance-recorder"
                  checked={editData.is_attendance_recorder || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditData((prev: UpdateStudentInput) => ({ ...prev, is_attendance_recorder: checked }))
                  }
                />
                <Label htmlFor="edit-attendance-recorder">
                  Jadikan sebagai pencatat absensi
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
