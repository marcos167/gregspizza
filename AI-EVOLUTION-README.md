# Greg's Pizza - AI Evolution System

## 🎯 Overview

Complete AI-powered assistant system with context detection, smart suggestions, executable actions, and learning capabilities.

**Status:** ✅ Production Ready  
**Version:** 2.4  
**URL:** https://gregspizza.vercel.app

---

## 📦 Features

### 1. Dual Mode Chat
- **💬 Conversation Mode:** Ask questions, get explanations
- **⚡ Action Mode:** Execute operations, get suggestions

### 2. Context Detection
- Automatically detects current page and data state
- Generates relevant suggestions based on context
- Priority-based suggestions (High/Medium/Low)

### 3. AI Executable Actions
- **create_recipes_ai:** Generate recipes via Gemini API
- Preview with impact analysis
- User confirmation required
- Automatic database persistence

### 4. Operational Timeline
- Complete audit trail of all operations
- Filterable by type, date, actor
- Restore deleted items
- Shows AI-generated actions

### 5. Dynamic Shortcuts
- Learns from user behavior
- Displays top 5 most-used actions
- Updates in real-time
- Smart ranking algorithm

### 6. Auto CRUD Logging
- Hook for automatic operation logging
- Ready for integration
- Impact calculation

---

## 🗄️ Database Schema

### Tables

**`operational_timeline`**
- Tracks all operations (create, update, delete, restore)
- Actor: user, ai, system
- Full metadata and impact summary

**`pending_actions`**
- Actions waiting for user confirmation
- Auto-expires after 24h
- Status tracking

**`user_action_stats`**
- Tracks action frequency
- Used for smart shortcuts
- Auto-incrementing count

### Functions

- `log_timeline_event()` - Log operation to timeline
- `track_user_action()` - Track/increment action usage
- `get_top_user_actions()` - Get frequently used actions

---

## 📁 File Structure

```
src/
├── components/
│   ├── AI/
│   │   ├── ModeSelector.tsx
│   │   ├── ActionPreview.tsx
│   │   └── ContextualSuggestions.tsx
│   └── SmartShortcuts.tsx
│
├── services/ai/
│   ├── geminiClient.ts
│   ├── aiActionExecutor.ts
│   ├── contextEngine.ts
│   └── actionExecutor.ts
│
├── hooks/
│   ├── useAIChat.ts
│   ├── useAIActions.ts
│   ├── useContextDetection.ts
│   ├── useTimelineLogger.ts
│   └── useActionTracker.ts
│
└── pages/
    └── Timeline.tsx

Database/
├── supabase-ai-evolution-phase1-safe.sql
└── supabase-ai-evolution-phase2.4-shortcuts.sql
```

---

## 🚀 Deployment Guide

### 1. Database Setup

**Phase 1:**
```sql
-- In Supabase SQL Editor
-- Paste content from: supabase-ai-evolution-phase1-safe.sql
-- Click "Run"
```

**Phase 2.4:**
```sql
-- Paste content from: supabase-ai-evolution-phase2.4-shortcuts.sql
-- Click "Run"
```

### 2. Environment Variables

Already configured in Vercel:
- `VITE_GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY`

### 3. Frontend Deployment

Auto-deployed via Vercel on push to main.

---

## 🎯 Usage Examples

### Using Smart Suggestions

1. Navigate to any page (e.g., `/receitas`)
2. Click AI button (bottom right)
3. Switch to ⚡ Action mode
4. Contextual suggestions appear automatically
5. Click suggestion → Preview → Confirm

### Creating Recipes with AI

```typescript
// Suggestion appears: "✨ Criar com IA"
Click → AI generates recipes → Shows preview
Confirm → Saves to database → Logs to timeline
```

### Viewing Timeline

1. Click "📜 Histórico" in sidebar
2. Navigate to `/timeline`
3. Filter by type, date, or actor
4. View complete operation history

### Using Smart Shortcuts

```tsx
// In Dashboard.tsx
import SmartShortcuts from '../components/SmartShortcuts';

<SmartShortcuts onShortcutClick={handleShortcut} />
```

Displays top 5 most-used actions automatically.

---

## 🔧 Integration Guide

### Auto-Logging CRUD Operations

```typescript
import { useTimelineLogger } from '../hooks/useTimelineLogger';

const { logCreate, logUpdate, logDelete } = useTimelineLogger();

// On create
const handleCreate = async (data) => {
  const result = await supabase.from('recipes').insert(data);
  await logCreate('recipe', result.id, data.name, data);
};

// On update
const handleUpdate = async (id, data) => {
  await supabase.from('recipes').update(data).eq('id', id);
  await logUpdate('recipe', id, data.name, 'Updated ingredients', data);
};

// On delete
const handleDelete = async (id, name) => {
  await supabase.from('recipes').delete().eq('id', id);
  await logDelete('recipe', id, name);
};
```

### Tracking Actions for Shortcuts

```typescript
import { useActionTracker } from '../hooks/useActionTracker';

const { trackAction } = useActionTracker();

// Track when user performs action
await trackAction('create_recipe', 'Criar Pizza Margherita', {
  recipeId: newRecipe.id
});
```

---

## 🐛 Troubleshooting

### "Function log_timeline_event does not exist"
**Solution:** Run `supabase-ai-evolution-phase1-safe.sql`

### Suggestions not appearing
**Causes:**
- Not in Action mode
- Empty page (no data to suggest on)
- Wrong route

**Solution:** Navigate to `/receitas` with empty state, switch to Action mode

### AI not generating recipes
**Causes:**
- Gemini API key not set
- API rate limit

**Solution:** Check Vercel environment variables

### Shortcuts not updating
**Solution:** Run `supabase-ai-evolution-phase2.4-shortcuts.sql`

---

## 📊 Performance

- **Context Detection:** < 50ms (debounced)
- **Suggestion Generation:** < 100ms
- **AI Recipe Generation:** 2-5 seconds (Gemini API)
- **Timeline Query:** < 200ms (with indexes)
- **Shortcut Fetch:** < 100ms

---

## 🎨 Design System

**Colors:**
- Primary: `#667eea` (Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Danger: `#ef4444` (Red)

**Priority Colors:**
- High: Red border
- Medium: Yellow border
- Low: Blue border

**Animations:**
- Shimmer loading: 1.5s
- Slide in: 0.3s
- Hover transform: 0.2s

---

## 🔐 Security

- ✅ RLS enabled on all tables
- ✅ User-scoped queries
- ✅ API keys in environment variables
- ✅ Secure functions with SECURITY DEFINER

---

## 📈 Metrics to Track

1. **Suggestion Click-Through Rate**
2. **AI Action Success Rate**
3. **Timeline Page Visits**
4. **Shortcut Usage vs Manual**
5. **Average Time Saved**

---

## 🎓 Best Practices

1. **Always log operations** - Use useTimelineLogger for all CRUD
2. **Track user actions** - Use useActionTracker for shortcuts
3. **Show impact** - Always calculate and display action impact
4. **User confirmation** - Never execute without preview
5. **Error handling** - Always show user-friendly messages

---

## 🚧 Roadmap

### Phase 3: Advanced Contextual Suggestions
- Time-based suggestions
- Stock predictions
- Sales pattern analysis
- Cost optimization suggestions

### Future Enhancements
- Multi-language support
- Voice commands
- Mobile app
- Advanced analytics

---

## 📞 Support

**Issues:** Use GitHub Issues  
**Documentation:** This file + walkthrough.md  
**Examples:** See walkthrough.md

---

**Built with:** React, TypeScript, Supabase, Gemini AI  
**Version:** 2.4  
**Last Updated:** 2025-12-26  
**Status:** 🟢 Production Ready
