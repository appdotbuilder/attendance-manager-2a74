
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Class, CreateClassInput, UpdateClassInput } from '../../../server/src/schema';

interface ClassManagementProps {
  classes: Class[];
  onClassUpdate: () => void;
}

export function ClassManagement({ classes, onClassUpdate }: ClassManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [createData, setCreateData] = useState<CreateClassInput>({
    name: '',
    grade: '',
    academic_year: ''
  });

  const [editData, setEditData] = useState<UpdateClassInput>({
    id: 0,
    name: '',
    grade: '',
    academic_year: ''
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.createClass.mutate(createData);
      setCreateData({ name: '', grade: '', academic_year: '' });
      setIsCreateOpen(false);
      onClassUpdate();
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('❌ Gagal membuat kelas. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await trpc.updateClass.mutate(editData);
      setIsEditOpen(false);
      onClassUpdate();
    } catch (error) {
      console.error('Failed to update class:', error);
      alert('❌ Gagal mengupdate kelas. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    setIsLoading(true);

    try {
      await trpc.deleteClass.mutate({ id: classId });
      onClassUpdate();
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('❌ Gagal menghapus kelas. Pastikan tidak ada siswa di kelas ini.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (classItem: Class) => {
    setEditData({
      id: classItem.id,
      name: classItem.name,
      grade: classItem.grade,
      academic_year: classItem.academic_year
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                🏫 Manajemen Kelas
              </CardTitle>
              <CardDescription>
                Kelola data kelas dan informasi akademik
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>➕ Tambah Kelas</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Kelas Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan kelas baru ke dalam sistem
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClass}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Kelas</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: Kelas 10A"
                        value={createData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateData((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Tingkat</Label>
                      <Input
                        id="grade"
                        placeholder="Contoh: 10, 11, 12"
                        value={createData.grade}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateData((prev: CreateClassInput) => ({ ...prev, grade: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="academic_year">Tahun Akademik</Label>
                      <Input
                        id="academic_year"
                        placeholder="Contoh: 2024/2025"
                        value={createData.academic_year}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateData((prev: CreateClassInput) => ({ ...prev, academic_year: e.target.value }))
                        }
                        required
                      />
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
          </div>
        </CardHeader>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Daftar Kelas</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                📚 Belum ada kelas. Tambahkan kelas pertama Anda!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem: Class) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.grade}</TableCell>
                    <TableCell>{classItem.academic_year}</TableCell>
                    <TableCell>
                      {classItem.created_at.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(classItem)}
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
                              <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus kelas "{classItem.name}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClass(classItem.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
            <DialogDescription>
              Perbarui informasi kelas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClass}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Kelas</Label>
                <Input
                  id="edit-name"
                  value={editData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData((prev: UpdateClassInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-grade">Tingkat</Label>
                <Input
                  id="edit-grade"
                  value={editData.grade || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData((prev: UpdateClassInput) => ({ ...prev, grade: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-academic_year">Tahun Akademik</Label>
                <Input
                  id="edit-academic_year"
                  value={editData.academic_year || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData((prev: UpdateClassInput) => ({ ...prev, academic_year: e.target.value }))
                  }
                  required
                />
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
