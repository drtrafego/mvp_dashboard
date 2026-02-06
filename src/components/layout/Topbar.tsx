"use client";

import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { handleSignOut } from "@/server/actions/auth-actions";

type Props = {
    userName: string;
    userImage: string | null;
    onMenuClick?: () => void;
};

export default function Topbar({ userName, userImage, onMenuClick }: Props) {
    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">Dashboard</h2>

                <div className="ml-4">
                    <DatePickerWithRange />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ModeToggle />

                {/* Notifications */}
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    {userImage && (
                        <img
                            src={userImage}
                            alt={userName}
                            className="w-8 h-8 rounded-full border border-gray-200"
                        />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
                    <form action={handleSignOut}>
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                            Sair
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
}
