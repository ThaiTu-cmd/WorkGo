/**
 * WORKGO INFO PAGES CONTENT — Single source of truth for static info pages.
 *
 * React-free so plain Node test suites can import this directly.
 * Bilingual (vi/en) with fallback to Vietnamese for unknown locales (E1).
 */

export type Locale2 = 'vi' | 'en';

export interface FiverrGuide {
  id: string;
  title: string;
  from: [string, string];
  icon: string;
}

export type InfoPageKey =
  | 'about'
  | 'pricing'
  | 'pro'
  | 'guides'
  | 'help'
  | 'terms'
  | 'privacy'
  | 'trustSafety';

export interface InfoAnchor {
  id: string;
  label: string;
}

export interface InfoSection {
  heading: string;
  body: string[];
  bullets?: string[];
  anchor?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface InfoPageContent {
  key: InfoPageKey;
  slug: string;
  title: string;
  desc: string;
  anchors: InfoAnchor[];
  sections: InfoSection[];
  faq?: FaqItem[];
  cta: {
    title: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
}

export const INFO_CONTENT: Record<Locale2, Record<InfoPageKey, InfoPageContent>> = {
  vi: {
    about: {
      key: 'about',
      slug: 'about',
      title: 'Về WorkGo',
      desc: 'Nền tảng kết nối nhân tài tự do và doanh nghiệp hiện đại tại Việt Nam, kiến tạo chuẩn mực làm việc linh hoạt, minh bạch và hiệu quả.',
      anchors: [
        { id: 'careers', label: 'Sự nghiệp' },
        { id: 'press', label: 'Báo chí' },
        { id: 'partners', label: 'Đối tác' },
        { id: 'investors', label: 'Nhà đầu tư' },
        { id: 'open-source', label: 'Mã nguồn mở' },
      ],
      sections: [
        {
          heading: 'Sứ mệnh và Tầm nhìn',
          body: [
            'WorkGo ra đời với niềm tin rằng tài năng không nên bị giới hạn bởi khoảng cách địa lý. Chúng tôi kết nối hàng nghìn chuyên gia tự do tài năng với các cá nhân và doanh nghiệp có nhu cầu trên khắp cả nước.',
            'Bằng việc ứng dụng công nghệ hiện đại, cơ chế ký quỹ an toàn và quy trình làm việc chuẩn hóa, WorkGo mang đến trải nghiệm cộng tác liền mạch, tin cậy và tối ưu chi phí.',
          ],
        },
        {
          anchor: 'careers',
          heading: 'Cơ hội nghề nghiệp',
          body: [
            'Chúng tôi luôn tìm kiếm những cá nhân đam mê công nghệ, yêu thích văn hóa đổi mới và muốn tạo ra tác động tích cực đến thị trường lao động số.',
          ],
          bullets: [
            'Môi trường làm việc linh hoạt (hybrid & remote-friendly)',
            'Chế độ đãi ngộ cạnh tranh, cổ phần ESOP cho nhân sự chủ chốt',
            'Cơ hội dẫn dắt các sản phẩm công nghệ tiên phong tại Việt Nam',
          ],
        },
        {
          anchor: 'press',
          heading: 'Báo chí & Truyền thông',
          body: [
            'WorkGo liên tục được đưa tin trên các đầu báo kinh tế và công nghệ uy tín như VnExpress, CafeF, TechInAsia về sự phát triển của nền kinh tế freelance và giải pháp ứng dụng AI vào kết nối lao động chất lượng cao.',
          ],
        },
        {
          anchor: 'partners',
          heading: 'Đối tác chiến lược & Truyền thông',
          body: [
            'Chúng tôi hợp tác cùng các cổng thanh toán hàng đầu (VNPay, MoMo), các trường đại học công nghệ và hiệp hội doanh nghiệp vừa và nhỏ để mở rộng hệ sinh thái số cho freelancer Việt.',
          ],
        },
        {
          anchor: 'investors',
          heading: 'Quan hệ Nhà đầu tư',
          body: [
            'WorkGo nhận được sự đồng hành từ các quỹ đầu tư mạo hiểm công nghệ hàng đầu khu vực. Chúng tôi duy trì tăng trưởng bền vững, minh bạch tài chính và cam kết giá trị dài hạn cho cổ đông.',
          ],
        },
        {
          anchor: 'open-source',
          heading: 'Đóng góp Mã nguồn mở',
          body: [
            'Cộng đồng kỹ sư WorkGo tích cực đóng góp cho các dự án mã nguồn mở về React, TypeScript, Next.js và kiến trúc microservices an toàn.',
          ],
        },
      ],
      cta: {
        title: 'Cùng xây dựng tương lai công việc cùng WorkGo',
        primaryLabel: 'Gia nhập mạng lưới',
        primaryHref: '/register',
        secondaryLabel: 'Khám phá dịch vụ',
        secondaryHref: '/posts',
      },
    },

    pricing: {
      key: 'pricing',
      slug: 'pricing',
      title: 'Biểu phí nền tảng minh bạch',
      desc: 'Chi phí rõ ràng, không phụ phí ẩn. Tối ưu quyền lợi cho cả người thuê và đối tác cung cấp dịch vụ.',
      anchors: [
        { id: 'tiers', label: 'Các gói dịch vụ' },
        { id: 'escrow-fee', label: 'Cơ chế phí ký quỹ' },
        { id: 'faq', label: 'Câu hỏi thường gặp' },
      ],
      sections: [
        {
          anchor: 'tiers',
          heading: 'Mô hình chi phí minh bạch',
          body: [
            'WorkGo áp dụng biểu phí cạnh tranh nhất thị trường. Người thuê hoàn toàn miễn phí khi đăng bài tìm đối tác. Đối tác chỉ chịu một phần phí giao dịch khi hợp đồng hoàn thành mỹ mãn.',
          ],
          bullets: [
            'Đăng tin tìm đối tác: 0 VNĐ trọn đời',
            'Phí dịch vụ đối tác tiêu chuẩn: Chỉ 5% trên mỗi hợp đồng thành công',
            'Bảo vệ giao dịch ký quỹ Escrow: Miễn phí toàn bộ giao dịch nội địa',
          ],
        },
        {
          anchor: 'escrow-fee',
          heading: 'Bảo vệ thanh toán và hoàn tiền',
          body: [
            'Tiền của bạn được giữ an toàn trong tài khoản ký quỹ trung gian của WorkGo cho đến khi bạn nghiệm thu sản phẩm đạt yêu cầu. Nếu đối tác không hoàn thành đúng cam kết, bạn được hoàn tiền 100%.',
          ],
        },
      ],
      faq: [
        {
          q: 'Tôi có phải trả phí khi tạo tài khoản và đăng tin không?',
          a: 'Hoàn toàn không. Bạn có thể đăng ký tài khoản và đăng tin tìm freelancer miễn phí không giới hạn.',
        },
        {
          q: 'Phí dịch vụ được trừ vào thời điểm nào?',
          a: 'Phí chỉ được trừ khi dự án được nghiệm thu thành công và tiền được giải ngân về ví của đối tác.',
        },
        {
          q: 'Có phát sinh chi phí ẩn khi rút tiền về ngân hàng không?',
          a: 'WorkGo không thu thêm phí rút tiền nội địa. Tốc độ chuyển tiền chỉ từ 5 - 15 phút.',
        },
      ],
      cta: {
        title: 'Bắt đầu dự án đầu tiên của bạn ngay hôm nay',
        primaryLabel: 'Đăng tin miễn phí',
        primaryHref: '/client/posts/new',
        secondaryLabel: 'Xem bảng giá Pro',
        secondaryHref: '/pro',
      },
    },

    pro: {
      key: 'pro',
      slug: 'pro',
      title: 'WorkGo Pro — Giải pháp Doanh nghiệp',
      desc: 'Dành riêng cho doanh nghiệp cần tuyển chọn top 1% chuyên gia, quản lý ngân sách tập trung và tích hợp AI tự động hóa.',
      anchors: [
        { id: 'ai', label: 'Giải pháp AI' },
        { id: 'teams', label: 'Quản lý đội ngũ' },
        { id: 'enterprise-quote', label: 'Báo giá doanh nghiệp' },
        { id: 'api', label: 'Tích hợp API' },
      ],
      sections: [
        {
          heading: 'Dịch vụ cao cấp cho tổ chức quy mô',
          body: [
            'WorkGo Pro cung cấp giải pháp nhân sự linh hoạt có kiểm định chất lượng nghiêm ngặt (Vetted Talent), có người quản lý tài khoản riêng (Dedicated Account Manager) và hóa đơn GTGT đầy đủ.',
          ],
        },
        {
          anchor: 'ai',
          heading: 'Giải pháp Trợ lý AI và Tự động hóa',
          body: [
            'Tận dụng các chuyên gia AI hàng đầu để tích hợp chatbot thông minh, tự động hóa quy trình phân tích dữ liệu và sinh nội dung chuẩn SEO cho doanh nghiệp của bạn.',
          ],
          bullets: [
            'Tự động hóa tác vụ lặp lại tiết kiệm đến 70% thời gian nhân sự',
            'Tích hợp các mô hình ngôn ngữ lớn (LLM) an toàn với dữ liệu nội bộ',
            'Triển khai nhanh chóng cùng đội ngũ kỹ sư AI giàu kinh nghiệm',
          ],
        },
        {
          anchor: 'teams',
          heading: 'Quản lý đội ngũ và Phân quyền tập trung',
          body: [
            'Dễ dàng mời các thành viên trong công ty, phân quyền duyệt chi tiêu theo từng phòng ban, và theo dõi tiến độ công việc trên một bảng điều khiển duy nhất.',
          ],
        },
        {
          anchor: 'enterprise-quote',
          heading: 'Báo giá linh hoạt theo nhu cầu',
          body: [
            'Tùy chỉnh gói dịch vụ theo quy mô dự án và số lượng chuyên gia cần điều phối. Hỗ trợ hợp đồng nguyên tắc và thanh toán trả sau (Net-30).',
          ],
        },
        {
          anchor: 'api',
          heading: 'Tích hợp API WorkGo',
          body: [
            'Kết nối API trực tiếp với hệ thống ERP, CRM hoặc Slack/Teams nội bộ để tự động tạo việc làm, đồng bộ hóa đơn và nhận thông báo tiến độ theo thời gian thực.',
          ],
        },
      ],
      cta: {
        title: 'Nâng tầm hiệu suất doanh nghiệp cùng WorkGo Pro',
        primaryLabel: 'Liên hệ chuyên viên tư vấn',
        primaryHref: '/register',
        secondaryLabel: 'Khám phá đối tác Pro',
        secondaryHref: '/posts?q=Pro',
      },
    },

    guides: {
      key: 'guides',
      slug: 'guides',
      title: 'Cẩm nang & Hướng dẫn thực chiến',
      desc: 'Kho tri thức chuyên sâu giúp bạn xây dựng hồ sơ thu hút, lập ngân sách chuẩn xác và quản lý dự án thành công.',
      anchors: [
        { id: 'guide-brief', label: 'Viết Brief chuẩn' },
        { id: 'guide-portfolio', label: 'Xây dựng Portfolio' },
        { id: 'guide-budget', label: 'Dự toán ngân sách' },
      ],
      sections: [
        {
          heading: 'Tối ưu hóa hành trình cộng tác freelance',
          body: [
            'Dù bạn là doanh nghiệp lần đầu thuê nhân sự hay đối tác tự do bắt đầu sự nghiệp, các hướng dẫn chi tiết từ WorkGo sẽ giúp bạn tiết kiệm thời gian và đạt kết quả tốt nhất.',
          ],
        },
      ],
      cta: {
        title: 'Áp dụng kiến thức vào dự án thực tế',
        primaryLabel: 'Tìm việc phù hợp',
        primaryHref: '/posts',
        secondaryLabel: 'Đăng ký đối tác',
        secondaryHref: '/register',
      },
    },

    help: {
      key: 'help',
      slug: 'help',
      title: 'Trung tâm hỗ trợ WorkGo',
      desc: 'Chúng tôi luôn đồng hành 24/7 để giải đáp thắc mắc, hướng dẫn thanh toán an toàn và hỗ trợ giải quyết tranh chấp.',
      anchors: [
        { id: 'faq', label: 'Câu hỏi thường gặp' },
        { id: 'payments', label: 'Thanh toán an toàn' },
        { id: 'refunds', label: 'Chính sách hoàn tiền' },
        { id: 'community', label: 'Cộng đồng WorkGo' },
      ],
      sections: [
        {
          anchor: 'payments',
          heading: 'Quy trình thanh toán an toàn',
          body: [
            'WorkGo hỗ trợ đa dạng phương thức nạp và rút tiền gồm thẻ ngân hàng nội địa, chuyển khoản QR 24/7, thẻ tín dụng Visa/Mastercard và ví điện tử.',
            'Mọi giao dịch thanh toán đều qua hệ thống ký quỹ thông minh: số tiền được giữ an toàn cho tới khi bạn hoàn toàn hài lòng với kết quả công việc.',
          ],
        },
        {
          anchor: 'refunds',
          heading: 'Chính sách bảo vệ & Hoàn tiền 100%',
          body: [
            'Nếu đối tác không phản hồi, không bàn giao đúng thời hạn hoặc chất lượng không đúng như mô tả trong hợp đồng, bạn có quyền mở yêu cầu hoàn tiền.',
            'Bộ phận Trust & Safety của WorkGo sẽ tiến hành xem xét bằng chứng và hoàn trả 100% số tiền về ví của bạn trong vòng 24 - 48 giờ.',
          ],
        },
        {
          anchor: 'community',
          heading: 'Cộng đồng đối tác và khách hàng',
          body: [
            'Tham gia diễn đàn cộng đồng WorkGo để trao đổi kinh nghiệm chuyên môn, cập nhật xu hướng thị trường và nhận hỗ trợ từ các đồng nghiệp giàu kinh nghiệm.',
          ],
        },
      ],
      faq: [
        {
          q: 'Làm thế nào để bắt đầu thuê người làm trên WorkGo?',
          a: 'Bạn chỉ cần nhấn nút "Đăng yêu cầu", điền mô tả công việc, thời hạn và ngân sách. Sau vài phút, các chuyên gia phù hợp sẽ gửi báo giá đến bạn.',
        },
        {
          q: 'Khi nào đối tác nhận được tiền?',
          a: 'Tiền chỉ được giải ngân cho đối tác sau khi bạn kiểm tra sản phẩm và bấm nút "Nghiệm thu hoàn tất".',
        },
        {
          q: 'Tôi phải làm gì nếu có bất đồng về chất lượng công việc?',
          a: 'Bạn có thể nhấn nút "Yêu cầu chỉnh sửa" hoặc tạo yêu cầu giải quyết tranh chấp để đội ngũ chuyên viên WorkGo hỗ trợ phân xử công bằng.',
        },
        {
          q: 'Thông tin cá nhân và tài liệu dự án có được bảo mật không?',
          a: 'Tất cả tài liệu dự án và thông tin cá nhân đều được bảo vệ nghiêm ngặt theo điều khoản bảo mật dữ liệu và thỏa thuận NDA tiêu chuẩn.',
        },
      ],
      cta: {
        title: 'Cần hỗ trợ trực tiếp từ chuyên viên?',
        primaryLabel: 'Gửi yêu cầu hỗ trợ',
        primaryHref: '/help#faq',
        secondaryLabel: 'Khám phá việc làm',
        secondaryHref: '/posts',
      },
    },

    terms: {
      key: 'terms',
      slug: 'terms',
      title: 'Điều khoản dịch vụ',
      desc: 'Quy định pháp lý và thỏa thuận sử dụng giữa người dùng và nền tảng WorkGo.',
      anchors: [
        { id: 'accounts', label: 'Tài khoản thành viên' },
        { id: 'transactions', label: 'Quy định giao dịch' },
        { id: 'intellectual-property', label: 'Sở hữu trí tuệ' },
        { id: 'dispute-resolution', label: 'Giải quyết tranh chấp' },
      ],
      sections: [
        {
          anchor: 'accounts',
          heading: '1. Đăng ký và Trách nhiệm tài khoản',
          body: [
            'Bằng việc đăng ký tài khoản trên WorkGo, người dùng cam kết cung cấp thông tin chính xác, trung thực và tự bảo mật thông tin đăng nhập của mình.',
            'Mỗi người dùng chỉ được sở hữu một tài khoản chính thức. Mọi hành vi giả mạo hoặc chia sẻ tài khoản cho bên thứ ba đều bị nghiêm cấm.',
          ],
        },
        {
          anchor: 'transactions',
          heading: '2. Quy định thanh toán và Nghiệm thu',
          body: [
            'Mọi giao dịch kinh tế liên quan đến dự án phải được thực hiện thông qua hệ thống ký quỹ của WorkGo. Việc giao dịch ngoài sàn nhằm trốn tránh phí dịch vụ sẽ dẫn đến việc đình chỉ tài khoản vĩnh viễn.',
            'Khách hàng có trách nhiệm nghiệm thu hoặc phản hồi yêu cầu chỉnh sửa trong vòng 3 ngày làm việc kể từ thời điểm đối tác nộp sản phẩm.',
          ],
        },
        {
          anchor: 'intellectual-property',
          heading: '3. Quyền sở hữu trí tuệ',
          body: [
            'Khi khách hàng đã hoàn tất nghiệm thu và thanh toán đủ cho dự án, toàn bộ quyền sở hữu trí tuệ của sản phẩm được chuyển giao hoàn toàn cho khách hàng, trừ trường hợp hai bên có thỏa thuận riêng bằng văn bản.',
          ],
        },
        {
          anchor: 'dispute-resolution',
          heading: '4. Giải quyết tranh chấp',
          body: [
            'WorkGo đóng vai trò trung gian hòa giải công minh khi phát sinh bất đồng. Quyết định của bộ phận Trust & Safety dựa trên hợp đồng và nhật ký trao đổi tại hệ thống là quyết định cuối cùng.',
          ],
        },
      ],
      cta: {
        title: 'Đồng hành cùng nền tảng freelance chuyên nghiệp',
        primaryLabel: 'Tạo tài khoản',
        primaryHref: '/register',
        secondaryLabel: 'Đọc thêm về An toàn',
        secondaryHref: '/trust-safety',
      },
    },

    privacy: {
      key: 'privacy',
      slug: 'privacy',
      title: 'Chính sách bảo mật thông tin',
      desc: 'Cam kết bảo vệ quyền riêng tư, an toàn dữ liệu cá nhân và thông tin tài chính của người dùng WorkGo.',
      anchors: [
        { id: 'data-collection', label: 'Thu thập dữ liệu' },
        { id: 'data-protection', label: 'Bảo vệ an ninh' },
        { id: 'cookies', label: 'Sử dụng Cookies' },
        { id: 'user-rights', label: 'Quyền của người dùng' },
      ],
      sections: [
        {
          anchor: 'data-collection',
          heading: '1. Thông tin chúng tôi thu thập',
          body: [
            'Chúng tôi thu thập các thông tin cần thiết để cung cấp dịch vụ bao gồm: họ tên, địa chỉ email, số điện thoại, thông tin định danh chuyên môn và lịch sử giao dịch dự án.',
            'WorkGo tuyệt đối không lưu trữ thông tin thẻ ngân hàng đầy đủ trên máy chủ; mọi giao dịch thanh toán đều qua cổng thanh toán được cấp chứng chỉ bảo mật PCI-DSS.',
          ],
        },
        {
          anchor: 'data-protection',
          heading: '2. Biện pháp an ninh và Lưu trữ',
          body: [
            'Dữ liệu của bạn được mã hóa chuẩn AES-256 trong quá trình lưu trữ và TLS 1.3 khi truyền tải qua mạng. Chúng tôi áp dụng quy trình kiểm soát truy cập nghiêm ngặt đối với đội ngũ kỹ thuật.',
          ],
        },
        {
          anchor: 'cookies',
          heading: '3. Công nghệ Cookie',
          body: [
            'WorkGo sử dụng cookies an toàn nhằm duy trì phiên đăng nhập, cá nhân hóa trải nghiệm người dùng và phân tích hiệu năng hệ thống để không ngừng nâng cao chất lượng dịch vụ.',
          ],
        },
        {
          anchor: 'user-rights',
          heading: '4. Quyền của bạn đối với dữ liệu cá nhân',
          body: [
            'Bạn có toàn quyền truy cập, chỉnh sửa, trích xuất hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào thông qua phần Cài đặt tài khoản hoặc liên hệ bộ phận hỗ trợ.',
          ],
        },
      ],
      cta: {
        title: 'Trải nghiệm nền tảng an toàn, bảo mật',
        primaryLabel: 'Đăng ký ngay',
        primaryHref: '/register',
        secondaryLabel: 'Về WorkGo',
        secondaryHref: '/about',
      },
    },

    trustSafety: {
      key: 'trustSafety',
      slug: 'trust-safety',
      title: 'An toàn & Ký quỹ giao dịch',
      desc: 'Cơ chế bảo vệ thanh toán hai chiều, hợp đồng rõ ràng và quy trình giải quyết tranh chấp minh bạch hàng đầu.',
      anchors: [
        { id: 'escrow', label: 'Hệ thống ký quỹ' },
        { id: 'milestones', label: 'Thanh toán theo giai đoạn' },
        { id: 'seller-policy', label: 'Tiêu chuẩn đối tác' },
      ],
      sections: [
        {
          anchor: 'escrow',
          heading: 'Hệ thống Ký quỹ Escrow hai chiều',
          body: [
            'Khi bắt đầu hợp đồng, số tiền thanh toán được giữ an toàn trong tài khoản ký quỹ trung gian của WorkGo. Đối tác an tâm bắt đầu công việc vì biết chắc ngân sách đã sẵn sàng, còn khách hàng hoàn toàn yên tâm vì tiền chỉ được chuyển đi khi nghiệm thu đạt yêu cầu.',
          ],
          bullets: [
            'Bảo vệ tiền 100% trong suốt thời gian thực hiện dự án',
            'Không lo đối tác nhận tiền mà không giao sản phẩm',
            'Không lo khách hàng không thanh toán sau khi hoàn thành',
          ],
        },
        {
          anchor: 'milestones',
          heading: 'Chia nhỏ rủi ro với Milestones',
          body: [
            'Đối với các dự án lớn, WorkGo khuyến khích chia nhỏ tiến độ thành nhiều mốc bàn giao (Milestones). Mỗi mốc hoàn thành sẽ được nghiệm thu và thanh toán độc lập, giúp kiểm soát chất lượng chặt chẽ.',
          ],
        },
        {
          anchor: 'seller-policy',
          heading: 'Chính sách tiêu chuẩn chất lượng đối tác',
          body: [
            'Mọi đối tác tự do trên sàn đều phải tuân thủ Bộ quy tắc ứng xử chuyên nghiệp. Các hành vi chậm trễ vô lý, sao chép tác phẩm hoặc vi phạm cam kết bảo mật sẽ bị xử lý nghiêm minh.',
          ],
          bullets: [
            'Xác thực danh tính và kỹ năng chuyên môn định kỳ',
            'Đánh giá sao và phản hồi công khai từ khách hàng thực tế',
            'Hệ thống cảnh báo sớm và bảo vệ quyền lợi người dùng',
          ],
        },
      ],
      cta: {
        title: 'Giao dịch an tâm tuyệt đối cùng WorkGo',
        primaryLabel: 'Tìm đối tác uy tín',
        primaryHref: '/posts',
        secondaryLabel: 'Xem câu hỏi thường gặp',
        secondaryHref: '/help#faq',
      },
    },
  },

  en: {
    about: {
      key: 'about',
      slug: 'about',
      title: 'About WorkGo',
      desc: 'The leading marketplace connecting independent professionals and modern businesses across Vietnam with transparency, agility, and excellence.',
      anchors: [
        { id: 'careers', label: 'Careers' },
        { id: 'press', label: 'Press' },
        { id: 'partners', label: 'Partners' },
        { id: 'investors', label: 'Investors' },
        { id: 'open-source', label: 'Open Source' },
      ],
      sections: [
        {
          heading: 'Our Mission & Vision',
          body: [
            'WorkGo was founded on the belief that great talent should not be bounded by geographic borders. We empower thousands of top-tier independent freelancers to connect with forward-thinking businesses nationwide.',
            'Through modern matching technology, robust escrow safeguards, and standardized workflows, WorkGo provides a seamless, trusted, and cost-effective collaboration experience.',
          ],
        },
        {
          anchor: 'careers',
          heading: 'Career Opportunities',
          body: [
            'We are always looking for passionate builders who thrive in innovative cultures and want to make a lasting impact on the digital workforce economy.',
          ],
          bullets: [
            'Flexible hybrid & remote-friendly work arrangements',
            'Competitive compensation with equity grants for key talent',
            'Opportunity to pioneer high-impact tech products in Vietnam',
          ],
        },
        {
          anchor: 'press',
          heading: 'Press & Media',
          body: [
            'WorkGo is featured regularly on premier business and tech outlets such as VnExpress, CafeF, and TechInAsia, discussing the growth of the gig economy and AI-powered workforce matching.',
          ],
        },
        {
          anchor: 'partners',
          heading: 'Strategic & Media Partners',
          body: [
            'We collaborate with leading payment gateways (VNPay, MoMo), engineering universities, and SME associations to expand the digital ecosystem for Vietnamese freelancers.',
          ],
        },
        {
          anchor: 'investors',
          heading: 'Investor Relations',
          body: [
            'WorkGo is backed by leading regional technology venture capital firms. We maintain disciplined growth, financial integrity, and a commitment to long-term shareholder value.',
          ],
        },
        {
          anchor: 'open-source',
          heading: 'Open Source Contributions',
          body: [
            'Our engineering team actively contributes to open source ecosystems around React, TypeScript, Next.js, and resilient microservices architecture.',
          ],
        },
      ],
      cta: {
        title: 'Build the future of work together with WorkGo',
        primaryLabel: 'Join the network',
        primaryHref: '/register',
        secondaryLabel: 'Explore services',
        secondaryHref: '/posts',
      },
    },

    pricing: {
      key: 'pricing',
      slug: 'pricing',
      title: 'Transparent Platform Pricing',
      desc: 'Clear fees, no hidden costs. Fair value optimized for both clients and independent partners.',
      anchors: [
        { id: 'tiers', label: 'Service tiers' },
        { id: 'escrow-fee', label: 'Escrow mechanism' },
        { id: 'faq', label: 'Frequently asked questions' },
      ],
      sections: [
        {
          anchor: 'tiers',
          heading: 'Simple & Transparent Pricing',
          body: [
            'WorkGo offers the most competitive rate structure in the market. Clients post briefs for free. Freelancers only pay a minimal success fee upon project sign-off.',
          ],
          bullets: [
            'Post project briefs: 100% Free forever',
            'Partner success fee: Low 5% rate on completed contracts',
            'Escrow protection: Completely free for all local transactions',
          ],
        },
        {
          anchor: 'escrow-fee',
          heading: 'Payment Protection & Refunds',
          body: [
            'Your funds remain locked safely in WorkGo escrow until you inspect and approve the completed deliverables. If quality requirements are not met, you receive a full refund.',
          ],
        },
      ],
      faq: [
        {
          q: 'Do I have to pay to register and post a job?',
          a: 'No. Registering an account and posting job briefs is completely free without limits.',
        },
        {
          q: 'When is the service fee deducted?',
          a: 'The service fee is only deducted when the client signs off on the completed project and funds are released to your wallet.',
        },
        {
          q: 'Are there hidden fees when withdrawing to my bank?',
          a: 'WorkGo charges zero withdrawal fees for domestic bank transfers. Payouts complete within 5 to 15 minutes.',
        },
      ],
      cta: {
        title: 'Launch your first project today',
        primaryLabel: 'Post a free brief',
        primaryHref: '/client/posts/new',
        secondaryLabel: 'Explore Pro pricing',
        secondaryHref: '/pro',
      },
    },

    pro: {
      key: 'pro',
      slug: 'pro',
      title: 'WorkGo Pro — Enterprise Solutions',
      desc: 'Designed for organizations that require vetted top 1% talent, centralized team management, and enterprise AI automation.',
      anchors: [
        { id: 'ai', label: 'AI solutions' },
        { id: 'teams', label: 'Team management' },
        { id: 'enterprise-quote', label: 'Enterprise quotes' },
        { id: 'api', label: 'API integration' },
      ],
      sections: [
        {
          heading: 'Premium Services for Scaling Organizations',
          body: [
            'WorkGo Pro delivers hand-vetted talent, dedicated account managers, consolidated billing, and VAT compliance tailored for high-growth enterprises.',
          ],
        },
        {
          anchor: 'ai',
          heading: 'Enterprise AI & Workflow Automation',
          body: [
            'Collaborate with certified AI engineers to build bespoke conversational assistants, automate data aggregation, and streamline content pipelines.',
          ],
          bullets: [
            'Automate repetitive operations and save up to 70% in team hours',
            'Secure LLM integration respecting internal company data boundaries',
            'Fast deployments guided by seasoned AI practitioners',
          ],
        },
        {
          anchor: 'teams',
          heading: 'Centralized Team & Budget Governance',
          body: [
            'Seamlessly invite department members, set approval thresholds, and monitor project roadmaps from a single unified executive dashboard.',
          ],
        },
        {
          anchor: 'enterprise-quote',
          heading: 'Custom Quotations & Flexible Terms',
          body: [
            'Tailor packages to fit your exact headcount needs. Master service agreements and Net-30 invoicing options supported.',
          ],
        },
        {
          anchor: 'api',
          heading: 'WorkGo API Integration',
          body: [
            'Connect our API into your ERP, CRM, or Slack/Teams workspace to trigger project creation, sync invoices, and receive real-time delivery webhooks.',
          ],
        },
      ],
      cta: {
        title: 'Elevate your organization with WorkGo Pro',
        primaryLabel: 'Contact an enterprise specialist',
        primaryHref: '/register',
        secondaryLabel: 'Browse Pro freelancers',
        secondaryHref: '/posts?q=Pro',
      },
    },

    guides: {
      key: 'guides',
      slug: 'guides',
      title: 'Guides & Practical Knowledge',
      desc: 'In-depth resources to help you craft compelling portfolios, define accurate budgets, and manage projects to success.',
      anchors: [
        { id: 'guide-brief', label: 'Writing briefs' },
        { id: 'guide-portfolio', label: 'Building portfolios' },
        { id: 'guide-budget', label: 'Budget estimation' },
      ],
      sections: [
        {
          heading: 'Master the Freelance Collaboration Journey',
          body: [
            'Whether you are hiring your first freelancer or expanding an established practice, our step-by-step guides help you save time and achieve peak outcomes.',
          ],
        },
      ],
      cta: {
        title: 'Apply practical tips to your next project',
        primaryLabel: 'Browse available jobs',
        primaryHref: '/posts',
        secondaryLabel: 'Join as a seller',
        secondaryHref: '/register',
      },
    },

    help: {
      key: 'help',
      slug: 'help',
      title: 'WorkGo Help Center',
      desc: 'We are here 24/7 to resolve questions, guide secure payments, and support mutual dispute resolution.',
      anchors: [
        { id: 'faq', label: 'Frequently asked questions' },
        { id: 'payments', label: 'Secure payments' },
        { id: 'refunds', label: 'Refund policy' },
        { id: 'community', label: 'WorkGo community' },
      ],
      sections: [
        {
          anchor: 'payments',
          heading: 'Secure Payment Process',
          body: [
            'WorkGo supports domestic ATM cards, instant QR transfers, Visa/Mastercard credit cards, and popular e-wallets.',
            'Every transaction passes through our automated escrow system: funds remain safely held until you verify and sign off on completed work.',
          ],
        },
        {
          anchor: 'refunds',
          heading: '100% Protection & Refund Guarantee',
          body: [
            'If a partner fails to respond, misses the deadline, or does not deliver according to the agreed brief, you are entitled to request a refund.',
            'Our Trust & Safety team will review submitted evidence and issue a full refund back to your wallet within 24 to 48 hours.',
          ],
        },
        {
          anchor: 'community',
          heading: 'Freelancer & Client Community',
          body: [
            'Join our community forums to share insights, stay updated with emerging market trends, and get advice from experienced peers.',
          ],
        },
      ],
      faq: [
        {
          q: 'How do I start hiring on WorkGo?',
          a: 'Click "Post a brief", specify your project scope, timeline, and budget. Matched professionals will send proposals within minutes.',
        },
        {
          q: 'When does the freelancer receive payment?',
          a: 'Funds are only released to the freelancer after you review the submitted work and click "Approve and complete".',
        },
        {
          q: 'What should I do if work quality is unsatisfactory?',
          a: 'You can click "Request revision" or initiate a dispute ticket for our mediation team to evaluate fairly.',
        },
        {
          q: 'Are my project files and personal details protected?',
          a: 'Yes. All project deliverables and sensitive data are safeguarded under strict privacy standards and standard mutual NDA agreements.',
        },
      ],
      cta: {
        title: 'Need personal assistance from our team?',
        primaryLabel: 'Open support request',
        primaryHref: '/help#faq',
        secondaryLabel: 'Browse jobs',
        secondaryHref: '/posts',
      },
    },

    terms: {
      key: 'terms',
      slug: 'terms',
      title: 'Terms of Service',
      desc: 'Legal terms and usage guidelines governing participation on the WorkGo platform.',
      anchors: [
        { id: 'accounts', label: 'User accounts' },
        { id: 'transactions', label: 'Transaction rules' },
        { id: 'intellectual-property', label: 'Intellectual property' },
        { id: 'dispute-resolution', label: 'Dispute resolution' },
      ],
      sections: [
        {
          anchor: 'accounts',
          heading: '1. Registration & Account Responsibilities',
          body: [
            'By registering on WorkGo, you agree to supply authentic personal details and safeguard your login credentials.',
            'Each individual is permitted one primary account. Impersonation or sharing credentials with unauthorized third parties is strictly prohibited.',
          ],
        },
        {
          anchor: 'transactions',
          heading: '2. Transaction Conduct & Acceptance',
          body: [
            'All financial transactions related to contracted work must flow through WorkGo escrow. Soliciting off-platform payments to circumvent fees leads to permanent account suspension.',
            'Clients must inspect and respond to milestone submissions within 3 business days of delivery.',
          ],
        },
        {
          anchor: 'intellectual-property',
          heading: '3. Intellectual Property Rights',
          body: [
            'Upon full sign-off and fund release, all intellectual property rights in the created deliverables transfer entirely to the client, unless otherwise agreed in writing.',
          ],
        },
        {
          anchor: 'dispute-resolution',
          heading: '4. Dispute Resolution Mechanism',
          body: [
            'WorkGo serves as an impartial mediator for contract disagreements. Determinations made by our Trust & Safety unit based on written logs are considered conclusive.',
          ],
        },
      ],
      cta: {
        title: 'Partner with a professional freelance platform',
        primaryLabel: 'Create an account',
        primaryHref: '/register',
        secondaryLabel: 'Read Trust & Safety',
        secondaryHref: '/trust-safety',
      },
    },

    privacy: {
      key: 'privacy',
      slug: 'privacy',
      title: 'Privacy Policy',
      desc: 'Our commitment to protecting your personal data, transaction security, and digital privacy.',
      anchors: [
        { id: 'data-collection', label: 'Data collection' },
        { id: 'data-protection', label: 'Security measures' },
        { id: 'cookies', label: 'Cookie policy' },
        { id: 'user-rights', label: 'Your rights' },
      ],
      sections: [
        {
          anchor: 'data-collection',
          heading: '1. Information We Collect',
          body: [
            'We collect data necessary to provide service excellence: name, email address, phone number, professional credentials, and contract history.',
            'WorkGo never stores full payment card numbers on our infrastructure; all transactions are routed through PCI-DSS certified payment gateways.',
          ],
        },
        {
          anchor: 'data-protection',
          heading: '2. Security Standards & Storage',
          body: [
            'User data is encrypted at rest using AES-256 standards and in transit using TLS 1.3 protocols. We enforce strict role-based access controls across engineering teams.',
          ],
        },
        {
          anchor: 'cookies',
          heading: '3. Cookie Technologies',
          body: [
            'WorkGo uses secure session cookies to sustain your logged-in state, remember language choices, and monitor overall platform performance.',
          ],
        },
        {
          anchor: 'user-rights',
          heading: '4. Your Data Rights',
          body: [
            'You have the continuous right to inspect, update, export, or request deletion of your personal records at any time via Account Settings or customer support.',
          ],
        },
      ],
      cta: {
        title: 'Experience a secure, privacy-first platform',
        primaryLabel: 'Register now',
        primaryHref: '/register',
        secondaryLabel: 'About WorkGo',
        secondaryHref: '/about',
      },
    },

    trustSafety: {
      key: 'trustSafety',
      slug: 'trust-safety',
      title: 'Trust & Safety Escrow Protection',
      desc: 'Dual-sided payment safeguards, transparent milestone agreements, and fair mediation standards.',
      anchors: [
        { id: 'escrow', label: 'Escrow protection' },
        { id: 'milestones', label: 'Milestone tracking' },
        { id: 'seller-policy', label: 'Seller standards' },
      ],
      sections: [
        {
          anchor: 'escrow',
          heading: 'Dual-Sided Escrow Protection',
          body: [
            'When a project commences, the client budget is secured inside the neutral WorkGo escrow account. Freelancers work with peace of mind knowing funds are verified, while clients stay protected until milestones are delivered satisfactorily.',
          ],
          bullets: [
            '100% budget security throughout the active project timeline',
            'Zero risk of incomplete deliveries with funds already paid out',
            'Zero risk of non-payment after fulfilling project terms',
          ],
        },
        {
          anchor: 'milestones',
          heading: 'Milestone-Based Phased Delivery',
          body: [
            'For larger initiatives, WorkGo structures progress into individual milestones. Each milestone is inspected and funded independently, maintaining tight quality control.',
          ],
        },
        {
          anchor: 'seller-policy',
          heading: 'Partner Quality & Professional Code',
          body: [
            'Every independent freelancer agrees to our professional code of conduct. Unjustified delays, plagiarized deliverables, or breach of confidentiality result in immediate remediation.',
          ],
          bullets: [
            'Periodic identity and skills qualification checks',
            'Transparent rating and feedback system from verified clients',
            'Early-alert dispute mediation to safeguard mutual interests',
          ],
        },
      ],
      cta: {
        title: 'Collaborate with complete confidence on WorkGo',
        primaryLabel: 'Find verified partners',
        primaryHref: '/posts',
        secondaryLabel: 'View FAQ',
        secondaryHref: '/help#faq',
      },
    },
  },
};

/**
 * Return static page content for a given info page key.
 * Unknown / unsupported locales (E1: "fr", "", null, undefined) fall back to Vietnamese.
 */
export function getInfoContent(
  locale: string | null | undefined,
  key: InfoPageKey
): InfoPageContent {
  const loc: Locale2 = locale === 'en' ? 'en' : 'vi';
  return INFO_CONTENT[loc][key];
}

const GUIDE_SEEDS: Record<Locale2, FiverrGuide[]> = {
  vi: [
    {
      id: 'guide-brief',
      title: 'Cách viết yêu cầu dự án để nhận báo giá chính xác',
      from: ['#1677FF', '#06142F'],
      icon: 'Briefcase',
    },
    {
      id: 'guide-portfolio',
      title: 'Xây dựng hồ sơ đối tác tự do thu hút khách hàng',
      from: ['#1DBF73', '#003912'],
      icon: 'Users',
    },
    {
      id: 'guide-budget',
      title: 'Ngân sách hợp lý cho từng hạng mục dịch vụ',
      from: ['#FF7640', '#4D1727'],
      icon: 'Wallet',
    },
  ],
  en: [
    {
      id: 'guide-brief',
      title: 'How to write a project brief that gets accurate quotes',
      from: ['#1677FF', '#06142F'],
      icon: 'Briefcase',
    },
    {
      id: 'guide-portfolio',
      title: 'Build a freelancer portfolio that wins clients',
      from: ['#1DBF73', '#003912'],
      icon: 'Users',
    },
    {
      id: 'guide-budget',
      title: 'A realistic budget for every service category',
      from: ['#FF7640', '#4D1727'],
      icon: 'Wallet',
    },
  ],
};

/**
 * Return detailed content for one of the 3 guides (or null if unknown id).
 */
export function getGuideDetail(
  locale: string | null | undefined,
  id: string
): {
  guide: FiverrGuide;
  body: string[];
  steps: string[];
  relatedQ: string;
} | null {
  const loc: Locale2 = locale === 'en' ? 'en' : 'vi';
  const guide = GUIDE_SEEDS[loc].find((g) => g.id === id);
  if (!guide) {
    return null;
  }

  const guideDetails: Record<
    Locale2,
    Record<string, { body: string[]; steps: string[]; relatedQ: string }>
  > = {
    vi: {
      'guide-brief': {
        body: [
          'Một bản yêu cầu dự án (brief) chi tiết và rõ ràng là chìa khóa giúp bạn thu hút những đối tác freelance hàng đầu và nhận được báo giá chính xác nhất ngay từ lần đầu tiên.',
          'Khi brief mơ hồ, đối tác sẽ mất nhiều thời gian hỏi lại hoặc cộng thêm phụ phí dự phòng rủi ro vào báo giá, làm tăng chi phí và kéo dài thời gian hoàn thành dự án.',
          'Hãy xác định rõ mục tiêu cuối cùng, các sản phẩm bàn giao cụ thể, đối tượng người dùng hướng đến và các mốc thời gian quan trọng.',
        ],
        steps: [
          'Mô tả tổng quan dự án và vấn đề thực tế cần giải quyết',
          'Liệt kê chi tiết các hạng mục bàn giao (deliverables, file formats)',
          'Cung cấp tài liệu tham khảo, phong cách mong muốn hoặc mẫu đối thủ',
          'Xác định rõ ngân sách dự kiến và thời hạn hoàn thành các mốc',
        ],
        relatedQ: 'Cách viết yêu cầu dự án',
      },
      'guide-portfolio': {
        body: [
          'Hồ sơ năng lực (portfolio) là tài sản quan trọng nhất của đối tác tự do. Khách hàng thường quyết định có liên hệ hay không chỉ trong 15 giây đầu tiên nhìn vào các dự án tiêu biểu của bạn.',
          'Thay vì đưa ra danh sách dài các dự án nhỏ lẻ, hãy chọn lọc 3 - 5 dự án xuất sắc nhất và trình bày dưới dạng nghiên cứu tình huống (case study): vấn đề là gì, bạn đã giải quyết ra sao và kết quả đạt được như thế nào.',
          'Đừng quên cập nhật các chứng chỉ chuyên môn, lời nhận xét từ khách hàng cũ và đường dẫn trực tiếp tới sản phẩm thực tế.',
        ],
        steps: [
          'Chọn lọc 3 - 5 tác phẩm ấn tượng nhất đại diện cho chuyên môn',
          'Viết ngắn gọn bối cảnh, vai trò của bạn và kết quả thực tế đạt được',
          'Chăm chút hình ảnh thumbnail rõ nét, kích thước chuẩn và thẩm mỹ cao',
          'Thu thập và hiển thị đánh giá chân thực từ những khách hàng trước đây',
        ],
        relatedQ: 'Xây dựng hồ sơ đối tác',
      },
      'guide-budget': {
        body: [
          'Xác định ngân sách hợp lý giúp bạn thu hút đúng phân khúc nhân sự mà không bị lãng phí nguồn lực hoặc đối mặt với rủi ro nhận lại sản phẩm kém chất lượng.',
          'Chi phí freelance phụ thuộc vào 3 yếu tố cốt lõi: độ phức tạp kỹ thuật, thời hạn bàn giao yêu cầu gấp hay bình thường, và mức độ kinh nghiệm của chuyên gia (Junior, Mid, Senior, Lead).',
          'Áp dụng cơ chế chia nhỏ ngân sách theo các mốc bàn giao (milestones) để vừa bảo vệ dòng tiền, vừa tạo động lực cho đối tác hoàn thành từng giai đoạn đúng tiến độ.',
        ],
        steps: [
          'Khảo sát mức giá trung bình của các dự án tương tự trên sàn WorkGo',
          'Phân bổ ngân sách theo mức độ ưu tiên tính năng cốt lõi trước',
          'Dự phòng khoảng 10 - 15% cho các chỉnh sửa phát sinh ngoài phạm vi ban đầu',
          'Sử dụng cơ chế ký quỹ Milestone để thanh toán an toàn theo từng đợt',
        ],
        relatedQ: 'Ngân sách dịch vụ',
      },
    },
    en: {
      'guide-brief': {
        body: [
          'A precise and thorough project brief is the single most decisive factor in winning proposals from top-tier freelancers and securing accurate quotes right from day one.',
          'Ambiguous scopes force freelancers to build contingency margins into their bids or waste cycles asking clarifying questions, resulting in inflated costs and delivery friction.',
          'Clearly define the overarching business objective, tangible deliverables, target audience, and critical timeline milestones.',
        ],
        steps: [
          'Summarize the core project objective and the real problem being solved',
          'Enumerate concrete deliverables and required asset file formats',
          'Attach reference examples, preferred aesthetics, or competitor benchmarks',
          'State your realistic budget range and required delivery milestones',
        ],
        relatedQ: 'Project brief writing',
      },
      'guide-portfolio': {
        body: [
          'Your portfolio is your primary professional currency as an independent contractor. Clients typically form an opinion within the first 15 seconds of browsing your featured work.',
          'Instead of overwhelming visitors with dozens of minor assignments, curate 3 to 5 standout case studies explaining the problem, your execution strategy, and measurable outcomes.',
          'Keep your skills, verified certifications, client endorsements, and live production links updated continuously.',
        ],
        steps: [
          'Curate 3 to 5 premier case studies that reflect your core mastery',
          'Articulate the problem context, your exact contributions, and final metrics',
          'Design crisp visual thumbnails with consistent high-resolution styling',
          'Feature genuine endorsements and verified star ratings from past clients',
        ],
        relatedQ: 'Freelancer portfolio guide',
      },
      'guide-budget': {
        body: [
          'Determining a fair and realistic budget helps you attract the right caliber of talent without overspending or risking sub-par execution from underpriced bids.',
          'Freelance rates reflect three primary variables: technical complexity, deadline urgency, and the practitioner seniority level (Junior, Mid, Senior, Expert).',
          'Leverage milestone funding to manage cash flow safely while incentivizing your freelance partner to hit each delivery target on schedule.',
        ],
        steps: [
          'Review market price ranges for similar deliverables on WorkGo',
          'Allocate budget primarily toward mission-critical foundational features',
          'Reserve a 10% to 15% buffer for scope refinements discovered along the way',
          'Fund work in milestones to ensure mutual security at each phase',
        ],
        relatedQ: 'Service budget guide',
      },
    },
  };

  const detail = guideDetails[loc][id] ?? guideDetails.vi[id];
  if (!detail) {
    return null;
  }

  return {
    guide,
    body: detail.body,
    steps: detail.steps,
    relatedQ: detail.relatedQ,
  };
}

/**
 * Return destination URL for category tiles.
 */
export function categoryHref(locale: string, label: string): string {
  const loc = locale === 'en' ? 'en' : 'vi';
  return `/${loc}/posts?q=${encodeURIComponent(label)}`;
}

/**
 * Return destination URL for popular service cards.
 */
export function serviceHref(locale: string, title: string): string {
  const loc = locale === 'en' ? 'en' : 'vi';
  return `/${loc}/posts?q=${encodeURIComponent(title)}`;
}

/**
 * Return destination URL for guide cards.
 */
export function guideHref(locale: string, id: string): string {
  const loc = locale === 'en' ? 'en' : 'vi';
  return `/${loc}/guides/${id}`;
}

/**
 * Map footer column heading and link label to target route.
 * Guaranteed: never returns "#", never dead links, always localized.
 */
export function footerHref(locale: string, columnHeading: string, linkLabel: string): string {
  const loc = locale === 'en' ? 'en' : 'vi';
  const headingNorm = (columnHeading || '').trim().toLowerCase();
  const labelNorm = (linkLabel || '').trim().toLowerCase();

  // 1. Categories / Danh mục -> /posts?q=<label>
  if (headingNorm.includes('danh mục') || headingNorm.includes('categories')) {
    return `/${loc}/posts?q=${encodeURIComponent(linkLabel.trim())}`;
  }

  // 2. For Clients / Dành cho Khách hàng
  if (headingNorm.includes('khách hàng') || headingNorm.includes('client')) {
    if (labelNorm.includes('tìm') || labelNorm.includes('find')) {
      return `/${loc}/posts`;
    }
    if (labelNorm.includes('đăng') || labelNorm.includes('brief') || labelNorm.includes('post')) {
      return `/${loc}/client/posts/new`;
    }
    if (labelNorm.includes('tra cứu') || labelNorm.includes('track') || labelNorm.includes('đơn hàng') || labelNorm.includes('order')) {
      return `/${loc}/client`;
    }
    if (labelNorm.includes('thanh toán') || labelNorm.includes('payment')) {
      return `/${loc}/help#payments`;
    }
    if (labelNorm.includes('hoàn tiền') || labelNorm.includes('refund')) {
      return `/${loc}/help#refunds`;
    }
    if (labelNorm.includes('câu hỏi') || labelNorm.includes('thường gặp') || labelNorm.includes('faq') || labelNorm.includes('help')) {
      return `/${loc}/help#faq`;
    }
    return `/${loc}/posts`;
  }

  // 3. For Sellers / Dành cho Đối tác
  if (headingNorm.includes('đối tác') || headingNorm.includes('seller')) {
    if (labelNorm.includes('đăng ký') || labelNorm.includes('become')) {
      return `/${loc}/register`;
    }
    if (labelNorm.includes('hồ sơ') || labelNorm.includes('profile')) {
      return `/${loc}/settings/provider`;
    }
    if (labelNorm.includes('giá') || labelNorm.includes('pricing')) {
      return `/${loc}/pricing`;
    }
    if (labelNorm.includes('chính sách') || labelNorm.includes('policy')) {
      return `/${loc}/trust-safety#seller-policy`;
    }
    if (labelNorm.includes('cộng đồng') || labelNorm.includes('community')) {
      return `/${loc}/help#community`;
    }
    if (labelNorm.includes('hỗ trợ') || labelNorm.includes('support')) {
      return `/${loc}/help`;
    }
    return `/${loc}/register`;
  }

  // 4. Business Solutions / Giải pháp Doanh nghiệp
  if (headingNorm.includes('doanh nghiệp') || headingNorm.includes('business')) {
    if (labelNorm.includes('pro')) {
      return `/${loc}/pro`;
    }
    if (labelNorm.includes('ai')) {
      return `/${loc}/pro#ai`;
    }
    if (labelNorm.includes('đội ngũ') || labelNorm.includes('team')) {
      return `/${loc}/pro#teams`;
    }
    if (labelNorm.includes('báo giá') || labelNorm.includes('enterprise') || labelNorm.includes('quote')) {
      return `/${loc}/pro#enterprise-quote`;
    }
    if (labelNorm.includes('api')) {
      return `/${loc}/pro#api`;
    }
    return `/${loc}/pro`;
  }

  // 5. About WorkGo / Về WorkGo
  if (headingNorm.includes('về') || headingNorm.includes('about')) {
    if (labelNorm.includes('chúng tôi') || labelNorm.includes('us')) {
      return `/${loc}/about`;
    }
    if (labelNorm.includes('sự nghiệp') || labelNorm.includes('career')) {
      return `/${loc}/about#careers`;
    }
    if (labelNorm.includes('báo chí') || labelNorm.includes('press')) {
      return `/${loc}/about#press`;
    }
    if (labelNorm.includes('truyền thông') || labelNorm.includes('đối tác') || labelNorm.includes('partner')) {
      return `/${loc}/about#partners`;
    }
    if (labelNorm.includes('đầu tư') || labelNorm.includes('investor')) {
      return `/${loc}/about#investors`;
    }
    return `/${loc}/about`;
  }

  // Safe fallback
  return `/${loc}/help`;
}
