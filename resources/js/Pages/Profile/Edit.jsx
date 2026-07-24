import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import SystemSettingsForm from './Partials/SystemSettingsForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const canManageSystem = ['superadmin', 'admin', 'manager'].includes(auth.user.role);
    return (
        <DashboardLayout>
            <Head title="Settings - FKG.Fleet" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="glass-panel p-4 shadow sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="glass-panel p-4 shadow sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {canManageSystem && (
                        <div className="glass-panel p-4 shadow sm:p-8 border border-electric-blue/30">
                            <SystemSettingsForm className="max-w-xl" />
                        </div>
                    )}

                    <div className="glass-panel p-4 shadow sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
