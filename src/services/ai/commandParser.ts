import type { Intent } from '../../types/ai';

export function parseCommand(message: string): Intent | null {
    const trimmed = message.trim();

    if (!trimmed.startsWith('/')) {
        return null; // Not a command
    }

    const parts = trimmed.slice(1).split(' ');
    const action = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (action) {
        case 'create':
            return parseCreateCommand(args);

        case 'edit':
        case 'update':
            return parseEditCommand(args);

        case 'delete':
        case 'remove':
            return parseDeleteCommand(args);

        case 'restore':
            return parseRestoreCommand(args);

        case 'list':
            return parseListCommand(args);

        case 'trash':
            return parseTrashCommand(args);

        case 'import':
            return { action: 'import', entity: 'recipe', params: {}, confidence: 1.0, rawCommand: trimmed };

        case 'export':
            return parseExportCommand(args);

        case 'help':
            return { action: 'query', entity: 'recipe', params: { type: 'help' }, confidence: 1.0, rawCommand: trimmed };

        default:
            return null;
    }
}

function parseCreateCommand(args: string[]): Intent | null {
    const entity = args[0]?.toLowerCase();
    const name = args.slice(1).join(' ');

    if (!entity || !name) {
        return null;
    }

    switch (entity) {
        case 'recipe':
        case 'receita':
            return {
                action: 'create',
                entity: 'recipe',
                params: { name },
                confidence: 0.95,
                rawCommand: `/create ${entity} ${name}`,
            };

        case 'ingredient':
        case 'ingrediente':
            return {
                action: 'create',
                entity: 'ingredient',
                params: { name },
                confidence: 0.95,
                rawCommand: `/create ${entity} ${name}`,
            };

        default:
            return null;
    }
}

function parseEditCommand(args: string[]): Intent | null {
    const entity = args[0]?.toLowerCase();
    const identifier = args[1];
    const field = args[2];
    const value = args.slice(3).join(' ');

    if (!entity || !identifier) {
        return null;
    }

    return {
        action: 'edit',
        entity: entity as any,
        params: { identifier, field, value },
        confidence: 0.9,
        rawCommand: `/edit ${args.join(' ')}`,
    };
}

function parseDeleteCommand(args: string[]): Intent | null {
    const entity = args[0]?.toLowerCase();
    const identifier = args.slice(1).join(' ');

    if (!entity || !identifier) {
        return null;
    }

    return {
        action: 'delete',
        entity: entity as any,
        params: { identifier },
        confidence: 0.95,
        rawCommand: `/delete ${args.join(' ')}`,
    };
}

function parseRestoreCommand(args: string[]): Intent | null {
    const entity = args[0]?.toLowerCase();
    const identifier = args.slice(1).join(' ');

    if (!entity) {
        return null;
    }

    return {
        action: 'restore',
        entity: entity as any,
        params: { identifier },
        confidence: 0.95,
        rawCommand: `/restore ${args.join(' ')}`,
    };
}

function parseListCommand(args: string[]): Intent | null {
    const entity = args[0]?.toLowerCase() || 'recipe';

    return {
        action: 'list',
        entity: entity as any,
        params: {},
        confidence: 1.0,
        rawCommand: `/list ${entity}`,
    };
}

function parseTrashCommand(args: string[]): Intent | null {
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === 'show') {
        return {
            action: 'list',
            entity: 'trash',
            params: {},
            confidence: 1.0,
            rawCommand: '/trash show',
        };
    }

    return {
        action: 'query',
        entity: 'trash',
        params: { subCommand },
        confidence: 0.8,
        rawCommand: `/trash ${args.join(' ')}`,
    };
}

function parseExportCommand(args: string[]): Intent | null {
    const entity = args[0]?.toLowerCase() || 'recipe';
    const format = args[1]?.toLowerCase() || 'csv';

    return {
        action: 'export',
        entity: entity as any,
        params: { format },
        confidence: 1.0,
        rawCommand: `/export ${args.join(' ')}`,
    };
}
