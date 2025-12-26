import { useTenant } from '../contexts/TenantContext';
import './TenantBanner.css';

const TenantBanner = () => {
    const { currentTenant, loading } = useTenant();

    if (loading || !currentTenant) return null;

    // Show plan badge
    const getPlanBadge = (plan: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            free: { label: 'Gratuito', color: '#94a3b8' },
            starter: { label: 'Starter', color: '#10b981' },
            pro: { label: 'Pro', color: '#667eea' },
            enterprise: { label: 'Enterprise', color: '#f59e0b' }
        };
        return badges[plan] || badges.free;
    };

    const planInfo = getPlanBadge(currentTenant.plan);

    return (
        <div className="tenant-banner">
            {currentTenant.logo_url && (
                <img
                    src={currentTenant.logo_url}
                    alt={currentTenant.name}
                    className="tenant-logo"
                />
            )}
            <div className="tenant-info">
                <h2 className="tenant-name">{currentTenant.name}</h2>
                <span
                    className="tenant-plan-badge"
                    style={{ background: planInfo.color }}
                >
                    {planInfo.label}
                </span>
            </div>
        </div>
    );
};

export default TenantBanner;
