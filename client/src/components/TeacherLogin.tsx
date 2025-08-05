
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Teacher, TeacherLoginInput, CreateTeacherInput } from '../../../server/src/schema';

interface TeacherLoginProps {
  onLogin: (teacher: Teacher) => void;
}

export function TeacherLogin({ onLogin }: TeacherLoginProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginData, setLoginData] = useState<TeacherLoginInput>({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState<CreateTeacherInput>({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const teacher = await trpc.teacherLogin.mutate(loginData);
      if (teacher) {
        onLogin(teacher);
      } else {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Gagal login. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await trpc.createTeacher.mutate(registerData);
      setSuccess('✅ Akun guru berhasil dibuat! Silakan login.');
      setRegisterData({ name: '', email: '', password: '' });
      setIsLoginMode(true);
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Gagal membuat akun. Email mungkin sudah digunakan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            ❌ {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {isLoginMode ? (
        <Card>
          <CardHeader>
            <CardTitle>🔐 Login Guru</CardTitle>
            <CardDescription>
              Masuk ke akun guru untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="guru@sekolah.com"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: TeacherLoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: TeacherLoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  '🚪 Login'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLoginMode(false)}
                className="text-sm"
              >
                Belum punya akun? Daftar di sini
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>📝 Daftar Guru Baru</CardTitle>
            <CardDescription>
              Buat akun guru baru untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Nama lengkap guru"
                  value={registerData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateTeacherInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="guru@sekolah.com"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateTeacherInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateTeacherInput) => ({ ...prev, password: e.target.value }))
                  }
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mendaftar...
                  </>
                ) : (
                  '✅ Daftar Akun'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLoginMode(true)}
                className="text-sm"
              >
                Sudah punya akun? Login di sini
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
