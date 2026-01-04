import { Button } from '../ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

interface AdminNavProps {
  showBackButton?: boolean;
}

export default function AdminNav({ showBackButton = true }: AdminNavProps) {
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        {showBackButton && (
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        )}
      </div>
      <Button
        variant="outline"
        onClick={handleLogout}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
