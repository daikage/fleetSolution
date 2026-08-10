import { useRef } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';

export default function TwoFactorAuthenticationForm({ className = '' }) {
    const { twoFactorEnabled, twoFactorPending, twoFactorSecret, twoFactorQrCode } = usePage().props;

    const enableForm = useForm({});
    const confirmForm = useForm({
        code: '',
    });
    const disableForm = useForm({});

    const enableTwoFactorAuthentication = (e) => {
        e.preventDefault();
        enableForm.post(route('two-factor.enable'), {
            preserveScroll: true,
        });
    };

    const confirmTwoFactorAuthentication = (e) => {
        e.preventDefault();
        confirmForm.post(route('two-factor.confirm'), {
            preserveScroll: true,
            onSuccess: () => confirmForm.reset(),
        });
    };

    const disableTwoFactorAuthentication = (e) => {
        e.preventDefault();
        disableForm.delete(route('two-factor.disable'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Two Factor Authentication
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Add additional security to your account using two factor authentication.
                </p>
            </header>

            {!twoFactorEnabled && !twoFactorPending && (
                <div className="mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        When two factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Google Authenticator application.
                    </p>

                    <form onSubmit={enableTwoFactorAuthentication} className="mt-6">
                        <PrimaryButton disabled={enableForm.processing}>Enable</PrimaryButton>
                    </form>
                </div>
            )}

            {twoFactorPending && (
                <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Finish enabling two factor authentication.
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        To finish enabling two factor authentication, scan the following QR code using your phone's authenticator application or enter the setup key and provide the generated OTP code.
                    </p>

                    <div className="mt-4 p-2 inline-block bg-white" dangerouslySetInnerHTML={{ __html: twoFactorQrCode }} />

                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-semibold">Setup Key: <span className="font-mono">{twoFactorSecret}</span></p>
                    </div>

                    <form onSubmit={confirmTwoFactorAuthentication} className="mt-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="code" value="Code" />
                            <TextInput
                                id="code"
                                type="text"
                                className="mt-1 block w-1/2"
                                value={confirmForm.data.code}
                                onChange={(e) => confirmForm.setData('code', e.target.value)}
                                autoComplete="one-time-code"
                                autoFocus
                            />
                            <InputError message={confirmForm.errors.code} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={confirmForm.processing}>Confirm</PrimaryButton>
                            
                            <SecondaryButton onClick={disableTwoFactorAuthentication} disabled={disableForm.processing}>
                                Cancel
                            </SecondaryButton>
                        </div>
                    </form>
                </div>
            )}

            {twoFactorEnabled && (
                <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        You have enabled two factor authentication.
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        When two factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Google Authenticator application.
                    </p>

                    <form onSubmit={disableTwoFactorAuthentication} className="mt-6">
                        <DangerButton disabled={disableForm.processing}>Disable</DangerButton>
                    </form>
                </div>
            )}
        </section>
    );
}
