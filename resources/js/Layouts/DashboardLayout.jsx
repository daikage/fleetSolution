import { Link, usePage } from '@inertiajs/react';
import { Car, Map as MapIcon, Settings, Users, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const { url } = usePage();

    return (
        <div className="h-screen w-full bg-gray-900 text-white flex overflow-hidden">
            {/* Glass Sidebar Navigation */}
            <nav className="w-20 md:w-64 z-50 glass-panel m-4 flex flex-col justify-between hidden sm:flex">
                <div className="p-4 flex flex-col items-center md:items-start gap-8">
                    <Link href={route('dashboard')} className="text-electric-blue font-bold text-xl md:text-2xl mt-4 flex items-center gap-2">
                        <span className="hidden md:inline">FleetOS</span>
                        <MapIcon className="md:hidden w-8 h-8" />
                    </Link>
                    
                    <ul className="flex flex-col gap-6 w-full mt-8">
                        <NavItem href={route('dashboard')} icon={<MapIcon />} label="Live Map" active={url === '/dashboard'} />
                        <NavItem href={route('dashboard.vehicles')} icon={<Car />} label="Vehicles" active={url.startsWith('/dashboard/vehicles')} />
                        <NavItem href={route('dashboard.drivers')} icon={<Users />} label="Drivers" active={url.startsWith('/dashboard/drivers')} />
                        <NavItem href={route('profile.edit')} icon={<Settings />} label="Settings" active={url.startsWith('/profile')} />
                    </ul>
                </div>
                
                <div className="p-4 flex justify-center md:justify-start">
                    <Link href={route('logout')} method="post" as="button" className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors w-full text-left">
                        <LogOut className="w-6 h-6" />
                        <span className="hidden md:inline font-medium">Log out</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, active = false }) {
    return (
        <Link href={href} className={`flex items-center gap-4 p-2 md:px-4 cursor-pointer rounded-xl transition-all duration-300 ${active ? 'bg-electric-blue/20 text-electric-blue' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
            <div className="w-6 h-6">{icon}</div>
            <span className="hidden md:inline font-medium">{label}</span>
        </Link>
    );
}
