import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

const INACTIVITY_WARNING_TIME = 2 * 60 * 1000; // 2 minutes
const INACTIVITY_LOGOUT_TIME = 4 * 60 * 1000; // 4 minutes

export function InactivityManager() {
  const { signOut, user } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setShowWarning(false);
  }, [signOut]);

  const extendSession = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetActivityHandler = () => resetActivity();
    
    events.forEach(event => {
      document.addEventListener(event, resetActivityHandler, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivityHandler, true);
      });
    };
  }, [user, resetActivity]);

  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity >= INACTIVITY_LOGOUT_TIME) {
        handleLogout();
      } else if (timeSinceActivity >= INACTIVITY_WARNING_TIME && !showWarning) {
        setShowWarning(true);
        setCountdown(Math.ceil((INACTIVITY_LOGOUT_TIME - timeSinceActivity) / 1000));
      }
    };

    const interval = setInterval(checkInactivity, 1000);
    return () => clearInterval(interval);
  }, [user, lastActivity, showWarning, handleLogout]);

  useEffect(() => {
    if (showWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showWarning, countdown]);

  if (!user || !showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            You've been inactive for a while. For security reasons, you'll be automatically logged out soon.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <Clock className="h-12 w-12 text-warning mx-auto mb-4" />
            <div className="text-2xl font-bold text-warning mb-2">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-sm text-muted-foreground">
              Automatic logout in {countdown} seconds
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Logout Now
          </Button>
          <Button onClick={extendSession}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}