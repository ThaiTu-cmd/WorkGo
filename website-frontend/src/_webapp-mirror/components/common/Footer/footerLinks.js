// Footer column definitions. Labels are i18n keys resolved by Footer.jsx via
// next-intl's useTranslations('footer'), so the whole footer switches language.
export const FOOTER_COLUMNS = [
  {
    titleKey: 'colServices',
    links: [
      { labelKey: 'linkAllServices', page: 'catalog' },
      { labelKey: 'linkProgramming', page: 'catalog', params: { category: 'lap-trinh-it' } },
      { labelKey: 'linkDesign', page: 'catalog', params: { category: 'thiet-ke-do-hoa' } },
      { labelKey: 'linkWriting', page: 'catalog', params: { category: 'viet-lach-dich-thuat' } },
    ],
  },
  {
    titleKey: 'colCustomers',
    links: [
      { labelKey: 'linkHowItWorks', page: 'how-it-works' },
      { labelKey: 'linkEscrow', page: 'escrow-protection' },
      { labelKey: 'linkPostJob', page: 'job-post' },
      { labelKey: 'linkRefund', page: 'refund-policy' },
      { labelKey: 'linkFaq', page: 'faq' },
    ],
  },
  {
    titleKey: 'colProviders',
    links: [
      { labelKey: 'linkBecomeProvider', page: 'provider-onboarding' },
      { labelKey: 'linkVerification', page: 'verification-standards' },
      { labelKey: 'linkPackageRules', page: 'package-rules' },
      { labelKey: 'linkPayout', page: 'payout-settings' },
      { labelKey: 'linkCommunity', page: 'community' },
    ],
  },
  {
    titleKey: 'colAbout',
    links: [
      { labelKey: 'linkAbout', page: 'about' },
      { labelKey: 'linkCareers', page: 'careers' },
      { labelKey: 'linkTerms', page: 'terms' },
      { labelKey: 'linkPrivacy', page: 'privacy' },
      { labelKey: 'linkContact', page: 'contact' },
    ],
  },
];