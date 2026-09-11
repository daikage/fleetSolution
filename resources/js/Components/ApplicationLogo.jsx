export default function ApplicationLogo({ className, ...props }) {
    return (
        <img
            src="/images/logo.png"
            alt="FKG.Fleet Logo"
            className={className}
            {...props}
        />
    );
}
