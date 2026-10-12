/**
 * FIVERR-INSPIRED MARKETPLACE LANDING — single source of truth for page copy.
 *
 * Deliberately free of React / JSX / icon imports so it can be imported by the
 * static test suite (`tests/fiverr-ui-replication.test.mjs`) under plain Node.
 * Icons are referenced by lucide icon *name* and resolved in the components.
 *
 * Governance: this file must stay locale-complete. `getFiverrContent` falls
 * back to Vietnamese for any unsupported locale (edge case E1).
 */

export type Locale2 = 'vi' | 'en';

/** Union of lucide-react icon names used by the landing shell. */
export type LucideIconName =
  | 'Code2'
  | 'Palette'
  | 'Megaphone'
  | 'Languages'
  | 'Clapperboard'
  | 'Bot'
  | 'Music2'
  | 'Briefcase'
  | 'LifeBuoy'
  | 'Users'
  | 'Zap'
  | 'ShieldCheck'
  | 'Wallet'
  | 'Sparkles';

export interface FiverrCategory {
  key: string;
  label: string;
  icon: LucideIconName;
  href: string;
}

export interface FiverrImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface FiverrPopularService {
  id: string;
  title: string;
  blurb: string;
  accent: [string, string];
  icon: LucideIconName;
  image: FiverrImage;
  priceFrom: number;
}

export interface FiverrTestimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export interface FiverrGuide {
  id: string;
  title: string;
  from: [string, string];
  icon: LucideIconName;
  image: FiverrImage;
}

export interface FiverrValueProp {
  icon: LucideIconName;
  text: string;
}

export interface FiverrPanel {
  id: string;
  title: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
  gradient: [string, string];
  icon: LucideIconName;
  image: FiverrImage;
}

export interface FiverrFooterColumn {
  heading: string;
  links: string[];
}

export interface FiverrLandingContent {
  nav: {
    pro: string;
    explore: string;
    becomeSeller: string;
    signIn: string;
    join: string;
    searchPlaceholder: string;
    mobileSearchPlaceholder: string;
  };
  trending: { label: string; items: string[] };
  hero: {
    headline: string;
    searchPlaceholder: string;
    chips: string[];
    trustedBy: string;
    trustedLogos: string[];
  };
  categories: { title: string; viewMore: (n: number) => string; viewLess: string; items: FiverrCategory[] };
  popular: { title: string; services: FiverrPopularService[] };
  valueProps: { title: string; cta: string; items: FiverrValueProp[] };
  panels: FiverrPanel[];
  guides: { title: string; seeMore: string; items: FiverrGuide[] };
  testimonials: { title: string; items: FiverrTestimonial[] };
  cta: { titleLead: string; titleAccent: string; button: string };
  footer: { columns: FiverrFooterColumn[]; copyright: string; tagline: string };
}

const CATEGORY_SEED: { key: string; icon: LucideIconName }[] = [
  { key: 'tech', icon: 'Code2' },
  { key: 'design', icon: 'Palette' },
  { key: 'marketing', icon: 'Megaphone' },
  { key: 'writing', icon: 'Languages' },
  { key: 'video', icon: 'Clapperboard' },
  { key: 'ai', icon: 'Bot' },
  { key: 'music', icon: 'Music2' },
  { key: 'business', icon: 'Briefcase' },
  { key: 'consulting', icon: 'LifeBuoy' },
];

function buildCategories(
  labels: Record<string, string>,
  title: string,
  viewMore: (n: number) => string,
  viewLess: string
): { title: string; viewMore: (n: number) => string; viewLess: string; items: FiverrCategory[] } {
  return {
    title,
    viewMore,
    viewLess,
    items: CATEGORY_SEED.map((c) => ({
      key: c.key,
      label: labels[c.key],
      icon: c.icon,
      // Category ids are served by the catalog API at runtime, so tiles route to
      // the marketplace index rather than hard-coding ids that may not exist.
      href: '/posts',
    })),
  };
}

export const FIVERR_CONTENT: Record<Locale2, FiverrLandingContent> = {
  vi: {
    nav: {
      pro: 'WorkGo Pro',
      explore: 'Khám phá',
      becomeSeller: 'Trở thành đối tác',
      signIn: 'Đăng nhập',
      join: 'Đăng ký',
      searchPlaceholder: 'Bạn đang tìm kiếm dịch vụ gì?',
      mobileSearchPlaceholder: 'Tìm dịch vụ…',
    },
    trending: {
      label: 'Thịnh hành',
      items: [
        'Lập trình AI',
        'Thiết kế thương hiệu',
        'TikTok Shop',
        'Dịch thuật',
        'Dựng video',
        'Chatbot',
        'SEO tổng thể',
        'Nhân bản giọng nói',
      ],
    },
    hero: {
      headline: 'Đối tác tự do của bạn sẽ lo phần còn lại',
      searchPlaceholder: 'Thử "thiết kế logo"',
      chips: [
        'Xây dựng website',
        'Thiết kế logo',
        'Dịch vụ AI',
        'Tiếp thị số',
        'Viết nội dung',
      ],
      trustedBy: 'Được tin cậy bởi',
      trustedLogos: ['VNG', 'FPT', 'Viettel', 'Shopee', 'VinFast', 'MoMo'],
    },
    categories: buildCategories(
      {
        tech: 'Lập trình & Công nghệ',
        design: 'Thiết kế đồ hoạ',
        marketing: 'Tiếp thị số',
        writing: 'Viết & Dịch thuật',
        video: 'Video & Hoạt ảnh',
        ai: 'Dịch vụ AI',
        music: 'Âm nhạc & Thanh âm',
        business: 'Kinh doanh',
        consulting: 'Tư vấn',
      },
      'Khám phá danh mục',
      (n: number) => `Xem thêm ${n} danh mục`,
      'Thu gọn danh mục'
    ),
    popular: {
      title: 'Dịch vụ phổ biến',
      services: [
        {
          id: 'tiktok-shop',
          title: 'Thiết lập TikTok Shop',
          blurb: 'Từ kho sản phẩm đến đơn hàng đầu tiên trong 7 ngày.',
          accent: ['#FF7640', '#4D1727'],
          icon: 'Sparkles',
          priceFrom: 499000,
          image: {
            src: '/images/landing/popular-tiktok-shop.webp',
            alt: 'Gian hàng TikTok Shop chuyên nghiệp',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'ai-programming',
          title: 'Lập trình AI',
          blurb: 'Tích hợp mô hình ngôn ngữ vào sản phẩm của bạn.',
          accent: ['#1DBF73', '#003912'],
          icon: 'Bot',
          priceFrom: 1200000,
          image: {
            src: '/images/landing/popular-ai-programming.webp',
            alt: 'Lập trình AI và ứng dụng thông minh',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'web-development',
          title: 'Phát triển Website',
          blurb: 'Website tốc độ cao, sẵn sàng mở rộng và tối ưu SEO.',
          accent: ['#2EA8FF', '#06142F'],
          icon: 'Code2',
          priceFrom: 1500000,
          image: {
            src: '/images/landing/popular-web-dev.webp',
            alt: 'Phát triển website chuẩn SEO',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'video-editing',
          title: 'Chỉnh sửa Video',
          blurb: 'Cắt ghép nhanh, thêm phụ đề và hiệu ứng chuyên nghiệp.',
          accent: ['#8B5CF6', '#2E1065'],
          icon: 'Clapperboard',
          priceFrom: 399000,
          image: {
            src: '/images/landing/popular-video-edit.webp',
            alt: 'Chỉnh sửa video và hiệu ứng chuyển động',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'software-development',
          title: 'Phát triển Phần mềm',
          blurb: 'Ứng dụng web và di động theo yêu cầu riêng của bạn.',
          accent: ['#38BDF8', '#0C4A6E'],
          icon: 'Zap',
          priceFrom: 2500000,
          image: {
            src: '/images/landing/popular-software-dev.webp',
            alt: 'Phát triển phần mềm tùy chỉnh',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'book-publishing',
          title: 'Xuất bản Sách',
          blurb: 'Biên tập, bìa sách và đăng ký ISBN trọn gói.',
          accent: ['#F59E0B', '#421300'],
          icon: 'Briefcase',
          priceFrom: 899000,
          image: {
            src: '/images/landing/popular-book-publish.webp',
            alt: 'Thiết kế bìa và dàn trang xuất bản sách',
            width: 800,
            height: 1000,
          },
        },
      ],
    },
    valueProps: {
      title: 'Mọi việc trở nên dễ dàng với đối tác tự do',
      cta: 'Tham gia ngay',
      items: [
        {
          icon: 'Users',
          text: 'Tiếp cận kho nhân lực đỉnh cao trên 700 danh mục',
        },
        {
          icon: 'Zap',
          text: 'Trải nghiệm ghép nối đơn giản, dễ dùng',
        },
        {
          icon: 'Sparkles',
          text: 'Nhận công việc chất lượng, nhanh chóng và đúng ngân sách',
        },
        {
          icon: 'Wallet',
          text: 'Chỉ thanh toán khi bạn hài lòng',
        },
      ],
    },
    panels: [
      {
        id: 'find-experts',
        title: 'Để chuyên gia tìm đúng người freelance cho bạn',
        bullets: [
          'Gửi yêu cầu trong 30 giây, không cần viết hồ sơ phức tạp',
          'Nhận đề xuất đối tác phù hợp trong vài giờ',
          'Duyệt báo giá minh bạch trước khi cam kết',
        ],
        ctaLabel: 'Bắt đầu ngay',
        ctaHref: '/register',
        footnote: '100% hoàn tiền',
        gradient: ['#00732E', '#003912'],
        icon: 'Users',
        image: {
          src: '/images/landing/panel-find-experts.webp',
          alt: 'Chuyên gia công nghệ làm việc theo yêu cầu',
          width: 1600,
          height: 900,
        },
      },
      {
        id: 'automate-with-ai',
        title: 'Tự động hoá doanh nghiệp cùng chuyên gia AI WorkGo',
        bullets: [
          'Trợ lý ảo trả lời khách hàng 24/7 bằng tiếng Việt',
          'Tự động hoá quy trình báo cáo và phê duyệt nội bộ',
          'Phân tích dữ liệu và sinh báo cáo tức thì',
        ],
        ctaLabel: 'Khám phá WorkGo AI',
        ctaHref: '/posts?q=' + encodeURIComponent('Dịch vụ AI'),
        gradient: ['#6B2A0C', '#421300'],
        icon: 'Bot',
        image: {
          src: '/images/landing/panel-ai-automation.webp',
          alt: 'Giải pháp tự động hoá thông minh với AI',
          width: 1600,
          height: 900,
        },
      },
    ],
    guides: {
      title: 'Hướng dẫn giúp bạn phát triển',
      seeMore: 'Xem thêm hướng dẫn',
      items: [
        {
          id: 'guide-brief',
          title: 'Cách viết yêu cầu dự án để nhận báo giá chính xác',
          from: ['#1677FF', '#06142F'],
          icon: 'Briefcase',
          image: {
            src: '/images/landing/guide-brief.webp',
            alt: 'Hướng dẫn viết yêu cầu dự án rõ ràng',
            width: 800,
            height: 600,
          },
        },
        {
          id: 'guide-portfolio',
          title: 'Xây dựng hồ sơ đối tác tự do thu hút khách hàng',
          from: ['#1DBF73', '#003912'],
          icon: 'Users',
          image: {
            src: '/images/landing/guide-portfolio.webp',
            alt: 'Bí quyết xây dựng hồ sơ năng lực ấn tượng',
            width: 800,
            height: 600,
          },
        },
        {
          id: 'guide-budget',
          title: 'Ngân sách hợp lý cho từng hạng mục dịch vụ',
          from: ['#FF7640', '#4D1727'],
          icon: 'Wallet',
          image: {
            src: '/images/landing/guide-budget.webp',
            alt: 'Cách xác định ngân sách dự án hợp lý',
            width: 800,
            height: 600,
          },
        },
      ],
    },
    testimonials: {
      title: 'Được tin dùng bởi cộng đồng',
      items: [
        {
          quote: 'WorkGo giúp công ty chúng tôi tìm được chuyên gia React và AI chỉ trong 24 giờ. Cơ chế Escrow an toàn tuyệt đối.',
          name: 'Nguyễn Hải Nam',
          role: 'CTO tại TechVentures',
          initials: 'HN',
        },
        {
          quote: 'Là lập trình viên tự do, tôi hoàn toàn yên tâm nhận dự án lớn nhờ hệ thống bảo chứng thanh toán rõ ràng, nhanh gọn.',
          name: 'Trần Mai Anh',
          role: 'Fullstack Freelancer',
          initials: 'MA',
        },
        {
          quote: 'Chất lượng dịch vụ và tính chuyên nghiệp vượt xa mong đợi. Giao diện trực quan, giải quyết thanh toán tức thì.',
          name: 'Lê Hoàng Quân',
          role: 'Founder, GreenCommerce',
          initials: 'HQ',
        },
      ],
    },
    cta: {
      titleLead: 'Dịch vụ freelance ngay trong',
      titleAccent: 'tầm tay',
      button: 'Tìm đối tác ngay',
    },
    footer: {
      columns: [
        {
          heading: 'Danh mục',
          links: [
            'Lập trình & Công nghệ',
            'Thiết kế đồ hoạ',
            'Tiếp thị số',
            'Viết & Dịch thuật',
            'Video & Hoạt ảnh',
            'Dịch vụ AI',
          ],
        },
        {
          heading: 'Dành cho Khách hàng',
          links: [
            'Tìm đối tác',
            'Đăng yêu cầu',
            'Tra cứu đơn hàng',
            'Thanh toán',
            'Hoàn tiền',
            'Câu hỏi thường gặp',
          ],
        },
        {
          heading: 'Dành cho Đối tác',
          links: [
            'Đăng ký đối tác',
            'Xây hồ sơ',
            'Giá dịch vụ',
            'Chính sách đối tác',
            'Cộng đồng',
            'Trung tâm hỗ trợ',
          ],
        },
        {
          heading: 'Giải pháp Doanh nghiệp',
          links: [
            'WorkGo Pro',
            'Giải pháp AI',
            'Quản lý đội ngũ',
            'Báo giá doanh nghiệp',
            'Tích hợp API',
          ],
        },
        {
          heading: 'Về WorkGo',
          links: [
            'Về chúng tôi',
            'Sự nghiệp',
            'Báo chí',
            'Đối tác truyền thông',
            'Nhà đầu tư',
          ],
        },
      ],
      copyright: 'WorkGo Platform',
      tagline: 'Nền tảng kết nối khách hàng và đối tác tự do.',
    },
  },

  en: {
    nav: {
      pro: 'WorkGo Pro',
      explore: 'Explore',
      becomeSeller: 'Become a seller',
      signIn: 'Sign in',
      join: 'Join',
      searchPlaceholder: 'What service are you looking for today?',
      mobileSearchPlaceholder: 'Search services…',
    },
    trending: {
      label: 'Trending',
      items: [
        'AI engineering',
        'Brand design',
        'TikTok Shop',
        'Translation',
        'Video editing',
        'Chatbots',
        'Full SEO',
        'Voice cloning',
      ],
    },
    hero: {
      headline: 'Our freelancers will take it from here',
      searchPlaceholder: 'Try "logo design"',
      chips: [
        'Build a website',
        'Design a logo',
        'AI services',
        'Digital marketing',
        'Content writing',
      ],
      trustedBy: 'Trusted by',
      trustedLogos: ['VNG', 'FPT', 'Viettel', 'Shopee', 'VinFast', 'MoMo'],
    },
    categories: buildCategories(
      {
        tech: 'Programming & Tech',
        design: 'Graphics & Design',
        marketing: 'Digital Marketing',
        writing: 'Writing & Translation',
        video: 'Video & Animation',
        ai: 'AI Services',
        music: 'Music & Audio',
        business: 'Business',
        consulting: 'Consulting',
      },
      'Browse categories',
      (n: number) => `View ${n} more categories`,
      'Show fewer categories'
    ),
    popular: {
      title: 'Popular services',
      services: [
        {
          id: 'tiktok-shop',
          title: 'TikTok Shop setup',
          blurb: 'From product listing to first order in seven days.',
          accent: ['#FF7640', '#4D1727'],
          icon: 'Sparkles',
          priceFrom: 499000,
          image: {
            src: '/images/landing/popular-tiktok-shop.webp',
            alt: 'Professional TikTok Shop setup',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'ai-programming',
          title: 'AI programming',
          blurb: 'Ship large language models inside your product.',
          accent: ['#1DBF73', '#003912'],
          icon: 'Bot',
          priceFrom: 1200000,
          image: {
            src: '/images/landing/popular-ai-programming.webp',
            alt: 'AI application development',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'web-development',
          title: 'Web development',
          blurb: 'Fast, scalable, SEO-ready websites that convert.',
          accent: ['#2EA8FF', '#06142F'],
          icon: 'Code2',
          priceFrom: 1500000,
          image: {
            src: '/images/landing/popular-web-dev.webp',
            alt: 'Full-stack web development',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'video-editing',
          title: 'Video editing',
          blurb: 'Tight cuts, subtitles and motion that hold attention.',
          accent: ['#8B5CF6', '#2E1065'],
          icon: 'Clapperboard',
          priceFrom: 399000,
          image: {
            src: '/images/landing/popular-video-edit.webp',
            alt: 'Video editing & motion graphics',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'software-development',
          title: 'Software development',
          blurb: 'Custom web and mobile apps built to your spec.',
          accent: ['#38BDF8', '#0C4A6E'],
          icon: 'Zap',
          priceFrom: 2500000,
          image: {
            src: '/images/landing/popular-software-dev.webp',
            alt: 'Custom software engineering',
            width: 800,
            height: 1000,
          },
        },
        {
          id: 'book-publishing',
          title: 'Book publishing',
          blurb: 'Editing, cover design and ISBN registration handled.',
          accent: ['#F59E0B', '#421300'],
          icon: 'Briefcase',
          priceFrom: 899000,
          image: {
            src: '/images/landing/popular-book-publish.webp',
            alt: 'Book formatting and cover publishing',
            width: 800,
            height: 1000,
          },
        },
      ],
    },
    valueProps: {
      title: 'Make it all happen with freelancers',
      cta: 'Join now',
      items: [
        { icon: 'Users', text: 'Access a premium talent pool across 700+ categories' },
        { icon: 'Zap', text: 'A frictionless matching experience that is easy to use' },
        { icon: 'Sparkles', text: 'Get quality work delivered fast and on budget' },
        { icon: 'Wallet', text: 'Only pay once you are satisfied' },
      ],
    },
    panels: [
      {
        id: 'find-experts',
        title: 'Let experts find the right freelancer for you',
        bullets: [
          'Post your brief in 30 seconds — no long onboarding forms',
          'Receive matched freelancer proposals within hours',
          'Approve transparent quotes before you commit',
        ],
        ctaLabel: 'Start now',
        ctaHref: '/register',
        footnote: '100% money-back guarantee',
        gradient: ['#00732E', '#003912'],
        icon: 'Users',
        image: {
          src: '/images/landing/panel-find-experts.webp',
          alt: 'Tech experts working on demand',
          width: 1600,
          height: 900,
        },
      },
      {
        id: 'automate-with-ai',
        title: 'Automate your business with WorkGo AI experts',
        bullets: [
          'Virtual agents that answer customers 24/7 in Vietnamese',
          'Automate internal reporting and approval workflows',
          'Instant data analysis and report generation',
        ],
        ctaLabel: 'Explore WorkGo AI',
        ctaHref: '/posts?q=' + encodeURIComponent('AI services'),
        gradient: ['#6B2A0C', '#421300'],
        icon: 'Bot',
        image: {
          src: '/images/landing/panel-ai-automation.webp',
          alt: 'Smart AI automation solutions',
          width: 1600,
          height: 900,
        },
      },
    ],
    guides: {
      title: 'Guides to help you grow',
      seeMore: 'See more guides',
      items: [
        {
          id: 'guide-brief',
          title: 'How to write a project brief that gets accurate quotes',
          from: ['#1677FF', '#06142F'],
          icon: 'Briefcase',
          image: {
            src: '/images/landing/guide-brief.webp',
            alt: 'How to write a clear project brief',
            width: 800,
            height: 600,
          },
        },
        {
          id: 'guide-portfolio',
          title: 'Build a freelancer portfolio that wins clients',
          from: ['#1DBF73', '#003912'],
          icon: 'Users',
          image: {
            src: '/images/landing/guide-portfolio.webp',
            alt: 'Building a winning freelancer portfolio',
            width: 800,
            height: 600,
          },
        },
        {
          id: 'guide-budget',
          title: 'A realistic budget for every service category',
          from: ['#FF7640', '#4D1727'],
          icon: 'Wallet',
          image: {
            src: '/images/landing/guide-budget.webp',
            alt: 'Setting an effective project budget',
            width: 800,
            height: 600,
          },
        },
      ],
    },
    testimonials: {
      title: 'Trusted by the community',
      items: [
        {
          quote: 'WorkGo helped our startup find top-tier React & AI engineers within 24 hours. The escrow protection is second to none.',
          name: 'Hai Nam Nguyen',
          role: 'CTO, TechVentures',
          initials: 'HN',
        },
        {
          quote: 'As a freelance software engineer, I can focus 100% on delivery knowing payments are backed by smart milestones.',
          name: 'Mai Anh Tran',
          role: 'Fullstack Freelancer',
          initials: 'MA',
        },
        {
          quote: 'Exceptional service and talent quality. The seamless contracts and instant escrow payouts elevated our growth.',
          name: 'Hoang Quan Le',
          role: 'Founder, GreenCommerce',
          initials: 'HQ',
        },
      ],
    },
    cta: {
      titleLead: 'Freelance services at your',
      titleAccent: 'fingertips',
      button: 'Find a freelancer',
    },
    footer: {
      columns: [
        {
          heading: 'Categories',
          links: [
            'Programming & Tech',
            'Graphics & Design',
            'Digital Marketing',
            'Writing & Translation',
            'Video & Animation',
            'AI Services',
          ],
        },
        {
          heading: 'For Clients',
          links: [
            'Find a freelancer',
            'Post a brief',
            'Track orders',
            'Payments',
            'Refunds',
            'Help center',
          ],
        },
        {
          heading: 'For Sellers',
          links: [
            'Become a seller',
            'Build your profile',
            'Service pricing',
            'Seller policy',
            'Community',
            'Support',
          ],
        },
        {
          heading: 'Business Solutions',
          links: ['WorkGo Pro', 'AI Solutions', 'Team management', 'Enterprise quotes', 'API integration'],
        },
        {
          heading: 'About WorkGo',
          links: ['About us', 'Careers', 'Press', 'Media partners', 'Investors'],
        },
      ],
      copyright: 'WorkGo Platform',
      tagline: 'The marketplace connecting clients with independent professionals.',
    },
  },
};

/**
 * Resolve landing copy for a locale.
 * Unknown / missing locales (E1: "fr", "", undefined) fall back to Vietnamese.
 */
export function getFiverrContent(locale: string | undefined | null): FiverrLandingContent {
  return FIVERR_CONTENT[(locale as Locale2) === 'en' ? 'en' : 'vi'];
}