export type Platform = 'WEBSITE' | 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'LINKEDIN' | 'TWITTER';

export interface PlatformMeta {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  shortName: string;
  usesMetaWebhook: boolean;
  comingSoon: boolean;
  idLabel: string;
}

export const PLATFORMS: Platform[] = [
  'WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'LINKEDIN', 'TWITTER',
];

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  WEBSITE: {
    label: 'Website',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    textColor: '#4338CA',
    description: 'Embeddable web widget',
    shortName: 'Web',
    usesMetaWebhook: false,
    comingSoon: false,
    idLabel: '',
  },
  FACEBOOK: {
    label: 'Facebook',
    color: '#1877F2',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    description: 'Facebook Messenger',
    shortName: 'FB',
    usesMetaWebhook: true,
    comingSoon: false,
    idLabel: 'Page ID',
  },
  INSTAGRAM: {
    label: 'Instagram',
    color: '#E1306C',
    bgColor: '#FDF2F8',
    textColor: '#9D174D',
    description: 'Instagram Direct Messages',
    shortName: 'IG',
    usesMetaWebhook: true,
    comingSoon: false,
    idLabel: 'Page ID',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    color: '#25D366',
    bgColor: '#F0FDF4',
    textColor: '#15803D',
    description: 'WhatsApp Business',
    shortName: 'WA',
    usesMetaWebhook: true,
    comingSoon: false,
    idLabel: 'Phone Number ID',
  },
  LINKEDIN: {
    label: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    description: 'LinkedIn Messages',
    shortName: 'in',
    usesMetaWebhook: false,
    comingSoon: true,
    idLabel: '',
  },
  TWITTER: {
    label: 'Twitter / X',
    color: '#000000',
    bgColor: '#F9FAFB',
    textColor: '#111827',
    description: 'Twitter Direct Messages',
    shortName: 'X',
    usesMetaWebhook: false,
    comingSoon: true,
    idLabel: '',
  },
};
