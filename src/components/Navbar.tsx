import React from 'react';
import { User } from 'firebase/auth';
import { Video, Plus, LogOut, Radio } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface NavbarProps {
  user: User | null;
  isLoadingAuth: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenLiveTracker: () => void;
  onCreateInstantMeet: () => void;
  isCreatingMeet: boolean;
  onRefreshRecords: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoadingAuth,
  onSignIn,
  onSignOut,
  onOpenLiveTracker,
  onCreateInstantMeet,
  isCreatingMeet,
  onRefreshRecords,
  isRefreshing,
}) => {
  return (
    <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 via-teal-500 to-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">
                  Meet Attendance
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800">
                  Google Workspace
                </span>
              </div>
              <p className="text-[11px] text-gray-600 hidden sm:block">
                Attendee Duration Tracking & Attendance Analytics
              </p>
            </div>
          </div>

          {/* Actions & Auth */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Quick Actions */}
            <button
              onClick={onOpenLiveTracker}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Track Live Meet</span>
            </button>

            {user && (
              <button
                onClick={onCreateInstantMeet}
                disabled={isCreatingMeet}
                className="hidden md:flex px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingMeet ? 'Creating...' : 'New Google Meet'}</span>
              </button>
            )}

            {/* Auth area */}
            {user ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-gray-900 leading-tight">
                      {user.displayName || 'Google User'}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onSignOut}
                  title="Sign out of Google"
                  className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pl-1">
                <GoogleSignInButton
                  onClick={onSignIn}
                  isLoading={isLoadingAuth}
                  text="Connect Meet"
                  className="py-1.5 px-3 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
