import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Timeline.css';

interface TimelineEvent {
    id: string;
    action_type: string;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    description: string;
    metadata: any;
    impact_summary?: string;
    created_at: string;
    actor: 'user' | 'ai' | 'system';
}

interface TimelineFilters {
    type: 'all' | 'create' | 'update' | 'delete' | 'restore' | 'ai_action';
    dateRange: 'today' | 'week' | 'month' | 'all';
    actor: 'all' | 'user' | 'ai' | 'system';
}

const Timeline = () => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TimelineFilters>({
        type: 'all',
        dateRange: 'week',
        actor: 'all'
    });

    useEffect(() => {
        fetchTimeline();
    }, [filters]);

    const fetchTimeline = async () => {
        setLoading(true);
        let query = supabase
            .from('operational_timeline')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.type !== 'all') {
            query = query.eq('action_type', filters.type);
        }
        if (filters.actor !== 'all') {
            query = query.eq('actor', filters.actor);
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const ranges = {
                today: new Date(now.setHours(0, 0, 0, 0)),
                week: new Date(now.setDate(now.getDate() - 7)),
                month: new Date(now.setMonth(now.getMonth() - 1))
            };
            query = query.gte('created_at', ranges[filters.dateRange].toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching timeline:', error);
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    };

    const handleRestore = async (event: TimelineEvent) => {
        if (!event.metadata || !event.entity_id) return;

        try {
            // Restore based on entity type
            const table = event.entity_type === 'recipe' ? 'recipes' :
                event.entity_type === 'ingredient' ? 'ingredients' : null;

            if (!table) return;

            const { error } = await supabase
                .from(table)
                .insert(event.metadata);

            if (error) throw error;

            // Log restore action
            await supabase.rpc('log_timeline_event', {
                p_user_id: (await supabase.auth.getUser()).data.user?.id,
                p_action_type: 'restore',
                p_entity_type: event.entity_type,
                p_entity_id: event.entity_id,
                p_entity_name: event.entity_name,
                p_description: `Restaurado: ${event.entity_name}`,
                p_metadata: event.metadata,
                p_actor: 'user'
            });

            fetchTimeline();
            alert('Item restaurado com sucesso!');
        } catch (error) {
            console.error('Error restoring:', error);
            alert('Erro ao restaurar item');
        }
    };

    const getActionIcon = (actionType: string) => {
        const icons: Record<string, string> = {
            create: '✨',
            update: '✏️',
            delete: '🗑️',
            restore: '♻️',
            ai_action: '🤖'
        };
        return icons[actionType] || '📝';
    };

    const getEntityIcon = (entityType: string) => {
        const icons: Record<string, string> = {
            recipe: '🍕',
            ingredient: '🧈',
            stock: '📦',
            sale: '💰',
            category: '📁'
        };
        return icons[entityType] || '📄';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'agora mesmo';
        if (seconds < 3600) return `há ${Math.floor(seconds / 60)} minutos`;
        if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} horas`;
        if (seconds < 604800) return `há ${Math.floor(seconds / 86400)} dias`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="timeline-page">
            <header className="timeline-header">
                <h1>📜 Histórico Operacional</h1>
                <p>Todas as ações realizadas no sistema</p>
            </header>

            {/* Filters */}
            <div className="timeline-filters">
                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                >
                    <option value="all">Todas as ações</option>
                    <option value="create">Criações</option>
                    <option value="update">Atualizações</option>
                    <option value="delete">Exclusões</option>
                    <option value="restore">Restaurações</option>
                    <option value="ai_action">Ações da IA</option>
                </select>

                <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                >
                    <option value="today">Hoje</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                    <option value="all">Todo período</option>
                </select>

                <select
                    value={filters.actor}
                    onChange={(e) => setFilters({ ...filters, actor: e.target.value as any })}
                >
                    <option value="all">Todos</option>
                    <option value="user">Você</option>
                    <option value="ai">IA</option>
                    <option value="system">Sistema</option>
                </select>
            </div>

            {/* Timeline List */}
            <div className="timeline-list">
                {loading ? (
                    <div className="timeline-loading">Carregando...</div>
                ) : events.length === 0 ? (
                    <div className="timeline-empty">
                        <p>Nenhuma ação encontrada</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className={`timeline-card ${event.actor}`}>
                            <div className="timeline-icon">
                                {getActionIcon(event.action_type)}
                                {getEntityIcon(event.entity_type)}
                            </div>
                            <div className="timeline-content">
                                <h3>{event.description}</h3>
                                {event.entity_name && (
                                    <p className="timeline-entity">{event.entity_name}</p>
                                )}
                                {event.impact_summary && (
                                    <p className="timeline-impact">{event.impact_summary}</p>
                                )}
                                <div className="timeline-meta">
                                    <span className="timeline-actor">
                                        {event.actor === 'ai' ? '🤖 IA' : event.actor === 'system' ? '⚙️ Sistema' : '👤 Você'}
                                    </span>
                                    <span className="timeline-time">{formatTimeAgo(event.created_at)}</span>
                                </div>
                            </div>
                            <div className="timeline-actions">
                                {event.action_type === 'delete' && (
                                    <button
                                        onClick={() => handleRestore(event)}
                                        className="btn-restore"
                                        title="Restaurar"
                                    >
                                        ♻️ Restaurar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Timeline;
