# Icon Gallery

This document lists all available icons in the application. The icons are custom Vue components using Heroicons v1 outline style SVG paths.

## Currently Available Icons

### Navigation & Core Icons
- **DashboardIcon** - Home/dashboard icon
- **ElectionsIcon** - Elections icon
- **CandidatesIcon** - Candidates icon
- **ResultsIcon** - Results icon
- **LiveIcon** - Live results icon
- **SettingsIcon** - Settings/gear icon
- **UsersIcon** - Users/people icon (currently used for Agents Management)

### Action & UI Icons
- **PlusIcon** - Add/create icon
- **UserAddIcon** - Add user icon
- **ChevronIcon** - Dropdown/chevron icon
- **CloseIcon** - Close/X icon
- **MenuIcon** - Hamburger menu icon
- **BellIcon** - Notifications/bell icon
- **LogoutIcon** - Logout icon

### Admin & Management Icons
- **ShieldIcon** - Security/shield icon (used for Policies)
- **AnalyticsIcon** - Analytics/chart icon (used for Permission Analytics)
- **AuditIcon** - Audit/log icon (used for Access Audit)
- **LocationIcon** - Location/map icon (used for Geo Scopes)
- **PartyIcon** - Party/flag icon (used for Party Management)
- **ChartIcon** - Chart/graph icon

## Icon Location

All icons are located in: `frontend/src/components/icons/`

Each icon is a Vue component with:
- SVG path from Heroicons v1 outline style
- ViewBox: `0 0 24 24`
- Default className: `w-5 h-5`
- Accepts `className` prop for customization

## Usage Example

```vue
<script setup>
import { UsersIcon } from '@/components/icons';
</script>

<template>
  <UsersIcon class="w-6 h-6 text-blue-500" />
</template>
```

## Adding New Icons

To add a new icon:
1. Create a new `.vue` file in `frontend/src/components/icons/`
2. Use the same structure as existing icons
3. Get SVG path from [Heroicons v1](https://heroicons.com/) or [Heroicons v2](https://heroicons.com/)
4. Export from `frontend/src/components/icons/index.ts`

## Heroicons Reference

The icons are based on Heroicons. You can browse available icons at:
- **Heroicons v1** (outline style - current): https://heroicons.com/
- **Heroicons v2**: https://heroicons.com/ (updated library)

Popular icon categories you might want:
- **User/People**: Users, UserGroup, UserCircle, UserAdd
- **Documents**: Document, DocumentText, Clipboard, Folder
- **Communication**: Chat, Mail, Phone, Message
- **Actions**: Edit, Delete, Trash, Check, X, Plus, Minus
- **Navigation**: ArrowLeft, ArrowRight, ArrowUp, ArrowDown
- **Status**: CheckCircle, XCircle, Exclamation, Information
- **Security**: Shield, Lock, Key, FingerPrint
- **Business**: Building, Office, Briefcase, Banknotes
- **Location**: Map, MapPin, Globe, LocationMarker

## Example: Adding a New Icon

1. Visit https://heroicons.com/ and find an icon (e.g., "Briefcase")
2. Copy the SVG path
3. Create `BriefcaseIcon.vue`:

```vue
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    :class="className"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: 'w-5 h-5',
});
</script>
```

4. Export from `index.ts`:

```ts
export { default as BriefcaseIcon } from './BriefcaseIcon.vue';
```

5. Use in your component:

```vue
import { BriefcaseIcon } from '@/components/icons';
```

