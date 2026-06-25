import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Activity, Car, Globe, Shield, ArrowRight } from 'lucide-react';

export default function Welcome({ canLogin, canRegister, laravelVersion, phpVersion }) {
    return (
        <div className="min-h-screen bg-gray-900 text-white selection:bg-electric-blue selection:text-white relative overflow-hidden">
            <Head title="Welcome to FKG.Fleet" />

            {/* Background Map Graphic (Abstract) */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.4) 0%, transparent 70%)',
                    backgroundSize: '100% 100%'
                }}>
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

            {/* Navigation */}
            <nav className="relative z-50 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <Globe className="w-8 h-8 text-electric-blue" />
                    <span className="text-2xl font-bold tracking-tight">FKG.Fleet</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 items-center"
                >
                    {canLogin ? (
                        <>
                            <Link href={route('login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Log in
                            </Link>
                            {canRegister && (
                                <Link
                                    href={route('register')}
                                    className="text-sm font-medium px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                >
                                    Register
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link href={route('dashboard')} className="text-sm font-medium px-4 py-2 rounded-full bg-electric-blue hover:bg-sky-400 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.4)]">
                            Dashboard
                        </Link>
                    )}
                </motion.div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-electric-blue text-sm font-medium mb-8"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-blue opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-blue"></span>
                    </span>
                    Live Tracking Active
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
                >
                    Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-purple-500">Command Center</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
                >
                    Monitor, manage, and optimize your entire fleet in real-time. Experience the most responsive and beautiful Fleet Operations OS ever built.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    <Link
                        href={canLogin ? route('login') : route('dashboard')}
                        className="group flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105"
                    >
                        Enter Platform
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                {/* Feature Cards Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full px-4"
                >
                    <FeatureCard
                        icon={<Activity />}
                        title="Real-Time Telematics"
                        description="Sub-second latency updates powered by robust WebSockets."
                        delay={0.7}
                    />
                    <FeatureCard
                        icon={<Car />}
                        title="Asset Management"
                        description="Complete registry of vehicles, drivers, and maintenance logs."
                        delay={0.8}
                    />
                    <FeatureCard
                        icon={<Shield />}
                        title="Bank-Grade Security"
                        description="Strict API token authentication and role-based access."
                        delay={0.9}
                    />
                </motion.div>
            </main>

            <footer className="absolute bottom-4 w-full text-center text-sm text-gray-600 z-10">
                FKG.Fleet v1.0 • Laravel v{laravelVersion} • PHP v{phpVersion}
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="glass-panel p-6 text-left hover:bg-white/5 transition-colors group cursor-default"
        >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-electric-blue mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}
