/**
 * Registry nội dung cho 12 trang thông tin công khai của WorkGo.
 * Không chứa mã gọi API, hoàn toàn tự chủ về dữ liệu tĩnh.
 */

/** @type {const} */
export const PUBLIC_INFO_PAGE_KEYS = [
  'how-it-works',
  'escrow-protection',
  'refund-policy',
  'faq',
  'verification-standards',
  'package-rules',
  'community',
  'about',
  'careers',
  'terms',
  'privacy',
  'contact',
];

export const PUBLIC_INFO = {
  'how-it-works': {
    title: 'Cách thức đặt dịch vụ',
    subtitle: 'Quy trình 4 bước đơn giản, minh bạch và an toàn tuyệt đối qua hệ thống ký quỹ WorkGo Escrow.',
    kind: 'article',
    sections: [
      {
        heading: 'Bước 1: Tìm kiếm và lựa chọn dịch vụ',
        body: [
          'Khám phá hàng nghìn dịch vụ từ các chuyên gia hàng đầu trong lĩnh vực Công nghệ, Thiết kế, Marketing, Đời sống.',
          'Xem hồ sơ năng lực, đánh giá thực tế từ khách hàng cũ, bảng giá 3 gói rõ ràng và danh mục các dịch vụ bổ sung.'
        ],
        bullets: [
          'Lọc thông minh theo danh mục, mức ngân sách, thời gian giao hàng và đánh giá sao.',
          'Nhắn tin trực tiếp với chuyên gia để trao đổi kỹ về yêu cầu trước khi tiến hành đặt hàng.'
        ]
      },
      {
        heading: 'Bước 2: Chọn gói dịch vụ và tùy chỉnh yêu cầu',
        body: [
          'Lựa chọn gói dịch vụ phù hợp với ngân sách và quy mô dự án: Gói Cơ bản, Tiêu chuẩn hoặc Cao cấp.',
          'Bổ sung các tiện ích mở rộng (Add-ons) như giao hàng hỏa tốc, bàn giao source code gốc, hỗ trợ cài đặt.'
        ],
        bullets: [
          'Thông tin chi tiết về số ngày hoàn thành và số lần chỉnh sửa miễn phí cam kết.',
          'Ghi rõ các yêu cầu đầu vào để chuyên gia nắm bắt chính xác mong muốn.'
        ]
      },
      {
        heading: 'Bước 3: Thanh toán an toàn qua Escrow',
        body: [
          'Số tiền thanh toán sẽ được hệ thống ký quỹ WorkGo Escrow bảo vệ an toàn 100%.',
          'Chuyên gia không thể rút tiền ngay và chỉ nhận được thanh toán khi công việc đã được nghiệm thu hoàn tất.'
        ],
        bullets: [
          'Đa dạng phương thức thanh toán: Ví WorkGo, Chuyển khoản ngân hàng, Thẻ quốc tế, Ví điện tử.',
          'Biên nhận và lịch sử giao dịch được lưu trữ đầy đủ, minh bạch trên hệ thống.'
        ]
      },
      {
        heading: 'Bước 4: Nghiệm thu kết quả và Bàn giao',
        body: [
          'Nhận sản phẩm bàn giao, kiểm tra tiến độ và yêu cầu chỉnh sửa theo hạn mức gói nếu cần.',
          'Khi hoàn toàn hài lòng, bạn xác nhận hoàn thành để giải ngân cho chuyên gia và để lại đánh giá.'
        ],
        bullets: [
          'Hỗ trợ Trung tâm xử lý tranh chấp (Dispute Center) nếu có sự cố phát sinh.',
          'Cam kết hoàn trả 100% tiền ký quỹ nếu chuyên gia không bàn giao đúng thỏa thuận.'
        ]
      }
    ],
    ctas: [
      { label: 'Khám phá dịch vụ ngay', page: 'catalog', variant: 'primary' },
      { label: 'Đăng tin tuyển dụng', page: 'job-post', variant: 'outline' }
    ]
  },

  'escrow-protection': {
    title: 'Bảo chứng Ký quỹ (Escrow)',
    subtitle: 'Cơ chế giữ tiền trung gian độc lập đảm bảo 100% an toàn thanh toán cho cả khách hàng và chuyên gia.',
    kind: 'article',
    sections: [
      {
        heading: 'Escrow là gì và tại sao bạn cần Escrow?',
        body: [
          'WorkGo Escrow là hệ thống tài khoản đảm bảo giữ tiền thanh toán của khách hàng trong suốt thời gian chuyên gia thực hiện dịch vụ.',
          'Khách hàng hoàn toàn yên tâm vì tiền không bị mất khi chuyên gia làm sai cam kết, trong khi chuyên gia yên tâm làm việc vì biết chắc chắn khách hàng đã thanh toán đầy đủ.'
        ]
      },
      {
        heading: 'Quy trình bảo chứng 5 giai đoạn',
        body: [
          '1. Nạp tiền ký quỹ: Khách hàng xác nhận đơn hàng và ký quỹ số tiền tương ứng vào Escrow.',
          '2. Bắt đầu thực hiện: Chuyên gia nhận thông báo tiền đã vào Escrow an toàn và tiến hành công việc.',
          '3. Bàn giao sản phẩm: Chuyên gia gửi sản phẩm hoàn thiện và các tài liệu kèm theo lên hệ thống.',
          '4. Kiểm tra nghiệm thu: Khách hàng có 3 đến 7 ngày để rà soát, nghiệm thu hoặc yêu cầu sửa đổi.',
          '5. Tự động giải ngân: Tiền trong Escrow tự động chuyển vào Ví của chuyên gia sau khi nghiệm thu thành công.'
        ],
        bullets: [
          'Tiền được khóa độc lập, không bên nào được đơn phương chiếm dụng.',
          'Bảo vệ quyền lợi cả hai bên trước mọi rủi ro gian lận hoặc bùng việc.'
        ]
      },
      {
        heading: 'Cơ chế giải quyết tranh chấp công bằng',
        body: [
          'Nếu có bất đồng về chất lượng hoặc tiến độ, hai bên có quyền mở Khiếu nại tại Trung tâm tranh chấp (Dispute Center).',
          'Đội ngũ trọng tài WorkGo sẽ căn cứ vào thỏa thuận ban đầu, lịch sử trao đổi và sản phẩm bàn giao để phân định công bằng.'
        ]
      }
    ],
    ctas: [
      { label: 'Tìm dịch vụ an toàn', page: 'catalog', variant: 'primary' },
      { label: 'Liên hệ đội ngũ Escrow', page: 'contact', variant: 'outline' }
    ]
  },

  'refund-policy': {
    title: 'Chính sách hoàn tiền',
    subtitle: 'Minh bạch điều kiện và quy trình hoàn trả tiền ký quỹ khi có tranh chấp hoặc vi phạm cam kết dịch vụ.',
    kind: 'article',
    updatedAt: '20/10/2026',
    disclaimer: 'Cập nhật lần cuối: 20/10/2026. Nội dung minh hoạ cho bản demo, không phải tư vấn pháp lý.',
    sections: [
      {
        heading: 'Điều kiện hoàn tiền 100%',
        body: [
          'Khách hàng được hoàn trả toàn bộ số tiền đã thanh toán trong các trường hợp sau:',
          '1. Chuyên gia không phản hồi hoặc không bắt đầu đơn hàng trong vòng 24 giờ kể từ thời điểm ký quỹ.',
          '2. Chuyên gia trễ hạn bàn giao quá thời gian cam kết mà không có thỏa thuận gia hạn hợp lệ.',
          '3. Sản phẩm bàn giao hoàn toàn không đúng yêu cầu mô tả và chuyên gia từ chối khắc phục.',
          '4. Hai bên đồng thuận hủy đơn hàng trước khi công việc hoàn thành.'
        ]
      },
      {
        heading: 'Trường hợp không áp dụng hoàn trả',
        body: [
          '1. Khách hàng đã nhấn nút "Xác nhận nghiệm thu" và tiền ký quỹ đã được giải ngân cho chuyên gia.',
          '2. Khách hàng tự ý thay đổi yêu cầu vượt quá phạm vi gói dịch vụ ban đầu nhưng không thanh toán bổ sung.',
          '3. Quá thời hạn khiếu nại quy định (7 ngày sau khi nhận bàn giao) mà không có phản hồi.'
        ]
      },
      {
        heading: 'Thời gian và Phương thức hoàn tiền',
        body: [
          'Số tiền hoàn trả sẽ được chuyển trực tiếp vào Ví WorkGo của khách hàng ngay sau khi quyết định hoàn tiền được phê duyệt.',
          'Nếu yêu cầu rút về tài khoản ngân hàng liên kết, thời gian xử lý từ 3 đến 7 ngày làm việc tùy thuộc vào ngân hàng thụ hưởng.'
        ],
        bullets: [
          'Không thu bất kỳ khoản phí phạt nào đối với trường hợp lỗi từ phía Chuyên gia.',
          'Thông báo hoàn tiền được gửi tự động qua email và thông báo trong ứng dụng.'
        ]
      }
    ],
    ctas: [
      { label: 'Gửi yêu cầu hỗ trợ hoàn tiền', page: 'contact', variant: 'primary' },
      { label: 'Xem điều khoản dịch vụ', page: 'terms', variant: 'outline' }
    ]
  },

  'faq': {
    title: 'Câu hỏi thường gặp (FAQ)',
    subtitle: 'Giải đáp nhanh các thắc mắc phổ biến về tài khoản, đặt dịch vụ, thanh toán ký quỹ và quyền lợi chuyên gia.',
    kind: 'faq',
    groups: [
      {
        heading: '1. Tài khoản & Xác thực',
        items: [
          {
            q: 'Làm thế nào để đăng ký tài khoản trên WorkGo?',
            a: 'Bạn chỉ cần nhấn nút "Đăng ký" ở góc phải màn hình, điền Họ tên, Email và Mật khẩu. Bạn có thể sử dụng ngay tài khoản để tìm kiếm hoặc đăng tin tuyển dụng.'
          },
          {
            q: 'Xác thực danh tính (KYC) có bắt buộc không?',
            a: 'Đối với khách hàng chỉ đặt dịch vụ, xác thực danh tính là không bắt buộc. Đối với chuyên gia muốn đăng bán dịch vụ hoặc nhận tiền rút về ngân hàng, xác minh danh tính qua Trung tâm xác thực là bắt buộc.'
          },
          {
            q: 'Tôi có thể đổi thông tin cá nhân và mật khẩu ở đâu?',
            a: 'Bạn vào trang "Cài đặt hồ sơ" từ thanh điều hướng phụ hoặc menu người dùng để cập nhật số điện thoại, ảnh đại diện và thông tin liên hệ.'
          }
        ]
      },
      {
        heading: '2. Đặt dịch vụ & Tuyển dụng',
        items: [
          {
            q: 'Sự khác biệt giữa đặt dịch vụ có sẵn và đăng việc?',
            a: 'Đặt dịch vụ có sẵn giúp bạn chọn ngay gói công việc với giá và thời hạn cố định từ chuyên gia. Đăng việc cho phép bạn mô tả nhu cầu riêng và nhận nhiều đề xuất báo giá từ các chuyên gia khác nhau.'
          },
          {
            q: 'Tôi có thể yêu cầu chỉnh sửa bao nhiêu lần?',
            a: 'Số lần chỉnh sửa tùy thuộc vào gói dịch vụ bạn đã chọn (thường từ 1 đến 3 lần đối với gói cơ bản/tiêu chuẩn và không giới hạn đối với gói cao cấp).'
          },
          {
            q: 'Tôi phải làm gì nếu chuyên gia không phản hồi?',
            a: 'Nếu quá 24 giờ chuyên gia không phản hồi, bạn có quyền bấm hủy đơn hàng để nhận lại toàn bộ tiền ký quỹ về ví.'
          }
        ]
      },
      {
        heading: '3. Thanh toán & Bảo chứng Escrow',
        items: [
          {
            q: 'Tiền của tôi có an toàn khi thanh toán trước không?',
            a: 'Tuyệt đối an toàn. Toàn bộ tiền được khóa tại tài khoản trung gian Escrow của WorkGo. Chuyên gia chỉ nhận tiền khi bạn đã xem sản phẩm và bấm xác nhận hoàn thành.'
          },
          {
            q: 'Các phương thức nạp tiền vào ví WorkGo gồm những gì?',
            a: 'Hệ thống hỗ trợ nạp tiền qua Thẻ ngân hàng nội địa, Thẻ quốc tế Visa/Mastercard, VNPay và Ví MoMo.'
          },
          {
            q: 'Thời gian rút tiền từ ví về tài khoản ngân hàng là bao lâu?',
            a: 'Yêu cầu rút tiền thường được xử lý trong vòng 24 giờ làm việc. Tiền sẽ vào tài khoản ngân hàng của bạn trong 1-3 ngày làm việc.'
          }
        ]
      },
      {
        heading: '4. Dành cho Chuyên gia & Freelancer',
        items: [
          {
            q: 'Làm thế nào để trở thành Chuyên gia trên WorkGo?',
            a: 'Bạn nhấn nút "Làm Provider" trên thanh điều hướng, hoàn thành mẫu đăng ký thông tin dịch vụ và gửi hồ sơ xác thực tại Trung tâm xác thực.'
          },
          {
            q: 'Phí dịch vụ trên nền tảng WorkGo là bao nhiêu?',
            a: 'WorkGo áp dụng mức phí dịch vụ cạnh tranh từ 10% đến 15% trên mỗi đơn hàng thành công, dùng để duy trì hạ tầng, bảo chứng thanh toán và hỗ trợ khách hàng.'
          },
          {
            q: 'Làm sao để hồ sơ dịch vụ được nhiều khách hàng chú ý?',
            a: 'Hãy đầu tư hình ảnh đại diện chuyên nghiệp, mô tả dịch vụ chi tiết, bảng giá hợp lý và luôn duy trì phản hồi nhanh chóng đối với tin nhắn của khách hàng.'
          }
        ]
      }
    ]
  },

  'verification-standards': {
    title: 'Tiêu chuẩn xác thực',
    subtitle: 'Hệ thống tiêu chuẩn đánh giá và xác minh danh tính chuyên nghiệp nhằm xây dựng cộng đồng uy tín.',
    kind: 'article',
    sections: [
      {
        heading: 'Mục đích của hệ thống xác thực',
        body: [
          'Hệ thống xác thực của WorkGo được thiết kế nhằm bảo vệ khách hàng khỏi các rủi ro gian lận, đồng thời gia tăng uy tín và cơ hội nhận việc cho các chuyên gia chân chính.',
          'Mỗi tài khoản được gắn huy hiệu xác thực sau khi hồ sơ giấy tờ được kiểm duyệt thành công.'
        ]
      },
      {
        heading: '3 Cấp độ xác thực trên WorkGo',
        body: [
          'Cấp độ 1 - Xác thực cá nhân (Identity Verification): Cung cấp CCCD hoặc Hộ chiếu còn hiệu lực. Đảm bảo thông tin người nhận việc là người thật.',
          'Cấp độ 2 - Xác thực năng lực chuyên môn (Professional Verification): Cung cấp bằng cấp, chứng chỉ hành nghề, portfolio dự án thực tế đã hoàn thành.',
          'Cấp độ 3 - Xác thực doanh nghiệp (Business Verification): Dành cho công ty, agency với Giấy phép đăng ký kinh doanh và Mã số thuế hợp lệ.'
        ],
        bullets: [
          'Chuyên gia đạt cấp độ 2 trở lên được ưu tiên hiển thị vị trí cao trong danh mục tìm kiếm.',
          'Huy hiệu tích xanh Verified Pro xuất hiện nổi bật trên hồ sơ và mọi gói dịch vụ.'
        ]
      },
      {
        heading: 'Quy trình và Thời gian xét duyệt',
        body: [
          'Chuyên gia nộp hồ sơ trực tuyến trong quy trình Đăng ký Chuyên gia (Provider Onboarding).',
          'Thời gian thẩm định tiêu chuẩn từ 1 đến 3 ngày làm việc. Mọi dữ liệu giấy tờ đều được mã hóa và bảo mật nghiêm ngặt theo quy định pháp luật.'
        ]
      }
    ],
    ctas: [
      { label: 'Đăng ký làm Chuyên gia', page: 'provider-onboarding', variant: 'primary' },
      { label: 'Quy định gói dịch vụ', page: 'package-rules', variant: 'outline' }
    ]
  },

  'package-rules': {
    title: 'Quy định gói dịch vụ',
    subtitle: 'Tiêu chuẩn cấu trúc 3 gói dịch vụ (Cơ bản, Tiêu chuẩn, Cao cấp) và chính sách dịch vụ bổ sung.',
    kind: 'article',
    sections: [
      {
        heading: 'Cấu trúc 3 phân khúc gói dịch vụ',
        body: [
          'Mọi dịch vụ đăng bán trên WorkGo đều được khuyến khích thiết lập theo mô hình 3 gói phân cấp:',
          '1. Gói Cơ bản (Basic): Đáp ứng các nhu cầu nhanh, tính năng cốt lõi với mức ngân sách tiết kiệm nhất.',
          '2. Gói Tiêu chuẩn (Standard): Lựa chọn phổ biến nhất, cân bằng giữa tính năng hoàn thiện, thời gian bàn giao và mức giá.',
          '3. Gói Cao cấp (Premium): Giải pháp toàn diện cho doanh nghiệp với đầy đủ tài liệu, bàn giao mã nguồn gốc và hỗ trợ ưu tiên.'
        ]
      },
      {
        heading: 'Quy định về giá và số lần chỉnh sửa',
        body: [
          'Mức giá tối thiểu cho một gói dịch vụ là 50.000 VNĐ và tối đa là 100.000.000 VNĐ.',
          'Thời gian thực hiện tối thiểu là 1 ngày. Mỗi gói phải nêu rõ số lần chỉnh sửa miễn phí (tối thiểu 1 lần).'
        ],
        bullets: [
          'Nghiêm cấm hành vi báo giá một đằng, ép khách hàng thanh toán thêm ngoài hệ thống.',
          'Mọi chi phí phát sinh phải được thỏa thuận công khai thông qua dịch vụ cộng thêm (Add-ons).'
        ]
      },
      {
        heading: 'Dịch vụ bổ sung (Add-ons)',
        body: [
          'Chuyên gia có thể cung cấp các dịch vụ gia tăng tùy chọn như: Giao hàng hỏa tốc trong 24 giờ, Bản quyền thương mại đầy đủ, File gốc chất lượng cao.',
          'Add-ons phải có giá rõ ràng và chỉ được kích hoạt khi khách hàng chủ động chọn mua kèm.'
        ]
      }
    ],
    ctas: [
      { label: 'Tạo gói dịch vụ của bạn', page: 'provider-onboarding', variant: 'primary' },
      { label: 'Xem mẫu dịch vụ trên Catalog', page: 'catalog', variant: 'outline' }
    ]
  },

  'community': {
    title: 'Cộng đồng Freelancer WorkGo',
    subtitle: 'Không gian kết nối, chia sẻ kinh nghiệm, hỗ trợ nghề nghiệp và nâng cao tay nghề cho chuyên gia Việt Nam.',
    kind: 'community',
    cards: [
      {
        title: 'Diễn đàn Chuyên môn & Chia sẻ',
        desc: 'Nơi thảo luận các công nghệ mới, bí quyết đàm phán hợp đồng, kinh nghiệm quản trị dự án freelance và tài chính cá nhân.',
        page: 'catalog',
        label: 'Khám phá dự án mẫu'
      },
      {
        title: 'Quy tắc ứng xử văn minh',
        desc: 'Bộ nguyên tắc đạo đức nghề nghiệp tôn trọng lẫn nhau, trung thực trong cam kết chất lượng và chống mọi hành vi cạnh tranh không lành mạnh.',
        page: 'terms',
        label: 'Xem quy tắc ứng xử'
      },
      {
        title: 'Sự kiện & Workshop định kỳ',
        desc: 'Các buổi chia sẻ trực tuyến hàng tháng cùng những chuyên gia hàng đầu về kỹ năng làm việc tự do và tiếp cận khách hàng lớn.',
        page: 'contact',
        label: 'Đăng ký tham gia'
      },
      {
        title: 'Mạng lưới kết nối việc làm',
        desc: 'Hợp tác thành lập các nhóm chuyên gia đa ngành (Lập trình viên kết hợp Designer và Content Creator) để thực hiện các dự án quy mô lớn.',
        page: 'job-post',
        label: 'Đăng việc cho nhóm'
      }
    ]
  },

  'about': {
    title: 'Giới thiệu nền tảng',
    subtitle: 'Nền tảng kết nối nhân tài số hàng đầu Việt Nam — Kiến tạo cơ hội làm việc tự do an toàn, hiệu quả và bền vững.',
    kind: 'article',
    sections: [
      {
        heading: 'Sứ mệnh của chúng tôi',
        body: [
          'WorkGo ra đời với mục tiêu xóa bỏ rào cản kết nối giữa các cá nhân, doanh nghiệp có nhu cầu thuê ngoài và đội ngũ chuyên gia, freelancer tài năng tại Việt Nam.',
          'Chúng tôi tin rằng tương lai của thị trường lao động nằm ở sự tự do, linh hoạt và được bảo đảm an toàn bằng công nghệ hiện đại.'
        ]
      },
      {
        heading: '3 Giá trị cốt lõi',
        body: [
          '1. Minh bạch tuyệt đối: Giá cả, thời gian, quy trình và đánh giá đều được công khai rõ ràng, không chi phí ẩn.',
          '2. Trách nhiệm & An toàn: Hệ thống bảo chứng thanh toán Escrow bảo vệ đồng vốn của khách hàng và mồ hôi của người làm việc.',
          '3. Hướng đến chất lượng: Tiêu chuẩn hóa dịch vụ theo gói giúp khách hàng dễ dàng đưa ra quyết định chính xác.'
        ]
      },
      {
        heading: 'Cột mốc phát triển 2024–2026',
        body: [
          '2024: Ra mắt phiên bản thử nghiệm đầu tiên kết nối các dịch vụ số cơ bản.',
          '2025: Triển khai giải pháp thanh toán ký quỹ WorkGo Escrow và hệ thống 3 gói dịch vụ chuẩn hóa.',
          '2026: Nâng cấp nền tảng toàn diện, mở rộng sang các dịch vụ đời sống, tích hợp AI gợi ý ghép đôi chuyên gia thông minh.'
        ],
        bullets: [
          'Hơn 10.000 chuyên gia và người làm việc tự do đã tham gia hệ sinh thái.',
          'Tỷ lệ hoàn thành dự án đúng hạn đạt trên 96%.'
        ]
      }
    ],
    ctas: [
      { label: 'Khám phá dịch vụ', page: 'catalog', variant: 'primary' },
      { label: 'Cơ hội nghề nghiệp tại WorkGo', page: 'careers', variant: 'outline' }
    ]
  },

  'careers': {
    title: 'Cơ hội nghề nghiệp',
    subtitle: 'Đồng hành cùng WorkGo xây dựng tương lai thị trường lao động số tại Việt Nam. Tìm kiếm các tài năng đam mê công nghệ.',
    kind: 'careers',
    values: [
      { title: 'Tự do & Chủ động', desc: 'Làm việc linh hoạt theo phong cách hybrid, tập trung vào kết quả thực chất.' },
      { title: 'Văn hóa Minh bạch', desc: 'Mọi thông tin, mục tiêu và quyết định sản phẩm được chia sẻ cởi mở.' },
      { title: 'Học hỏi Không ngừng', desc: 'Ngân sách học tập hàng năm, tiếp cận các công nghệ mới nhất.' },
    ],
    roles: [
      {
        id: 'role-fe',
        title: 'Senior Frontend Engineer (React / Next.js)',
        location: 'TP. Hồ Chí Minh / Remote',
        type: 'Toàn thời gian',
        salary: '35.000.000 - 55.000.000 ₫',
        summary: 'Phát triển kiến trúc giao diện người dùng hiệu năng cao, tối ưu hóa trải nghiệm tương tác mượt mà và tương thích đa nền tảng.'
      },
      {
        id: 'role-be',
        title: 'Senior Backend Engineer (Java Spring Boot / Microservices)',
        location: 'TP. Hồ Chí Minh',
        type: 'Toàn thời gian',
        salary: '35.000.000 - 60.000.000 ₫',
        summary: 'Thiết kế hạ tầng microservices phân tán chịu tải cao, phát triển hệ thống thanh toán Escrow và xử lý giao dịch an toàn.'
      },
      {
        id: 'role-uiux',
        title: 'Lead Product Designer (UI/UX)',
        location: 'Hà Nội / TP. Hồ Chí Minh',
        type: 'Toàn thời gian',
        salary: '25.000.000 - 40.000.000 ₫',
        summary: 'Định hình ngôn ngữ thiết kế sản phẩm, nghiên cứu hành vi người dùng thị trường lao động số và thiết kế luồng trải nghiệm tinh gọn.'
      },
      {
        id: 'role-trust',
        title: 'Trust & Safety Operations Lead',
        location: 'TP. Hồ Chí Minh',
        type: 'Toàn thời gian',
        salary: '20.000.000 - 35.000.000 ₫',
        summary: 'Giám sát tính liêm chính của hệ thống, xử lý khiếu nại tranh chấp và quản trị quy trình thẩm định danh tính chuyên gia.'
      }
    ]
  },

  'terms': {
    title: 'Điều khoản sử dụng',
    subtitle: 'Quy chế sử dụng dịch vụ và các thỏa thuận pháp lý ràng buộc giữa người dùng và nền tảng WorkGo.',
    kind: 'article',
    updatedAt: '20/10/2026',
    disclaimer: 'Cập nhật lần cuối: 20/10/2026. Nội dung minh hoạ cho bản demo, không phải tư vấn pháp lý.',
    sections: [
      {
        heading: '1. Chấp thuận các điều khoản',
        body: [
          'Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào trên nền tảng WorkGo, bạn đồng ý chịu sự ràng buộc bởi các Điều khoản này cùng Chính sách bảo mật và Quy chế hoạt động đi kèm.',
          'Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng nền tảng ngay lập tức.'
        ]
      },
      {
        heading: '2. Đăng ký và Trách nhiệm tài khoản',
        body: [
          'Người dùng phải từ đủ 18 tuổi hoặc có đầy đủ năng lực hành vi dân sự theo quy định pháp luật.',
          'Bạn có trách nhiệm bảo mật thông tin đăng nhập và chịu hoàn toàn trách nhiệm cho mọi hoạt động diễn ra dưới tài khoản của mình.'
        ]
      },
      {
        heading: '3. Giao kết dịch vụ và Quy chế thanh toán',
        body: [
          'WorkGo cung cấp nền tảng công nghệ kết nối trực tuyến. Mọi giao dịch giữa Khách hàng và Chuyên gia là hợp đồng dịch vụ độc lập giữa hai bên.',
          'Mọi khoản thanh toán bắt buộc phải được thực hiện thông qua hệ thống cổng thanh toán và ký quỹ WorkGo. Nghiêm cấm mọi hành vi thanh toán ngoài hệ thống nhằm trốn tránh phí dịch vụ hoặc lừa đảo.'
        ]
      },
      {
        heading: '4. Cơ chế Ký quỹ Escrow',
        body: [
          'Khoản tiền ký quỹ được giữ độc lập và chỉ được giải ngân cho Chuyên gia khi Khách hàng xác nhận nghiệm thu hoặc khi hết thời hạn khiếu nại tự động theo quy định.',
          'WorkGo có quyền tạm khóa khoản ký quỹ nếu phát hiện dấu hiệu vi phạm hoặc khi có khiếu nại tranh chấp được thụ lý.'
        ]
      },
      {
        heading: '5. Chính sách Hủy bỏ và Khiếu nại',
        body: [
          'Quy trình hủy đơn và hoàn tiền tuân thủ theo Chính sách hoàn tiền của nền tảng.',
          'Các bên có nghĩa vụ hợp tác, cung cấp bằng chứng trung thực khi tham gia quy trình giải quyết tranh chấp tại Trung tâm tranh chấp.'
        ]
      },
      {
        heading: '6. Các hành vi bị nghiêm cấm',
        body: [
          'Nghiêm cấm đăng tải nội dung vi phạm pháp luật, thuần phong mỹ tục, xâm phạm quyền sở hữu trí tuệ.',
          'Nghiêm cấm phát tán mã độc, tấn công hệ thống, hoặc sử dụng công cụ tự động can thiệp bất hợp pháp vào hoạt động của WorkGo.'
        ]
      },
      {
        heading: '7. Quyền sở hữu trí tuệ',
        body: [
          'Toàn bộ giao diện, nhãn hiệu, mã nguồn và nội dung thuộc sở hữu độc quyền của WorkGo Platform.',
          'Quyền sở hữu đối với sản phẩm bàn giao sẽ được chuyển giao từ Chuyên gia sang Khách hàng sau khi đơn hàng được thanh toán đầy đủ, trừ khi có thỏa thuận khác.'
        ]
      },
      {
        heading: '8. Giới hạn trách nhiệm và Liên hệ',
        body: [
          'WorkGo nỗ lực tối đa để đảm bảo hệ thống vận hành liên tục, ổn định nhưng không chịu trách nhiệm đối với các sự cố gián đoạn bất khả kháng.',
          'Mọi thắc mắc về điều khoản vui lòng liên hệ ban pháp chế tại legal@workgo.vn.'
        ]
      }
    ],
    ctas: [
      { label: 'Xem Chính sách bảo mật', page: 'privacy', variant: 'outline' },
      { label: 'Liên hệ hỗ trợ', page: 'contact', variant: 'primary' }
    ]
  },

  'privacy': {
    title: 'Chính sách bảo mật',
    subtitle: 'Cam kết bảo vệ dữ liệu cá nhân, quyền riêng tư và minh bạch mục đích thu thập thông tin của người dùng.',
    kind: 'article',
    updatedAt: '20/10/2026',
    disclaimer: 'Cập nhật lần cuối: 20/10/2026. Nội dung minh hoạ cho bản demo, không phải tư vấn pháp lý.',
    sections: [
      {
        heading: '1. Thông tin cá nhân thu thập',
        body: [
          'Chúng tôi thu thập các thông tin sau khi bạn đăng ký và sử dụng dịch vụ:',
          '- Thông tin định danh: Họ tên, địa chỉ email, số điện thoại, ảnh đại diện.',
          '- Thông tin xác thực chuyên gia: Số CCCD/Hộ chiếu, ngày cấp, hình ảnh giấy tờ (chỉ thu thập khi đăng ký Provider).',
          '- Thông tin giao dịch: Lịch sử nạp/rút tiền, số dư ví, thông tin tài khoản ngân hàng liên kết.'
        ]
      },
      {
        heading: '2. Mục đích xử lý dữ liệu',
        body: [
          'Dữ liệu thu thập được sử dụng cho các mục đích hợp pháp sau:',
          '- Thiết lập và quản lý tài khoản người dùng, xử lý các đơn đặt hàng và yêu cầu dịch vụ.',
          '- Thực hiện nghĩa vụ bảo chứng thanh toán ký quỹ Escrow và thanh toán tiền thưởng.',
          '- Xác minh danh tính phòng chống gian lận tài chính và bảo đảm an toàn cộng đồng.',
          '- Cải tiến chất lượng dịch vụ, gửi thông báo cập nhật quan trọng về đơn hàng.'
        ]
      },
      {
        heading: '3. Cơ sở pháp lý thu thập',
        body: [
          'Việc thu thập và xử lý dữ liệu cá nhân dựa trên sự đồng thuận của bạn khi đăng ký tài khoản và việc thực thi hợp đồng dịch vụ mà bạn là một bên tham gia.'
        ]
      },
      {
        heading: '4. Chia sẻ thông tin với bên thứ ba',
        body: [
          'WorkGo cam kết không bán, cho thuê hay thương mại hóa dữ liệu cá nhân của bạn.',
          'Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết cho đối tác cổng thanh toán (để xử lý tiền) hoặc khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền.'
        ]
      },
      {
        heading: '5. Lưu trữ và Bảo mật dữ liệu',
        body: [
          'Toàn bộ thông tin nhạy cảm (mật khẩu, giấy tờ tùy thân) đều được mã hóa theo tiêu chuẩn công nghiệp (AES-256).',
          'Dữ liệu được lưu trữ an toàn trên các cụm máy chủ đặt tại Việt Nam với hệ thống tường lửa và kiểm soát truy cập nghiêm ngặt.'
        ]
      },
      {
        heading: '6. Quyền của chủ thể dữ liệu',
        body: [
          'Bạn có toàn quyền truy cập, chỉnh sửa hoặc yêu cầu xóa bỏ thông tin cá nhân của mình bất kỳ lúc nào thông qua phần Cài đặt hồ sơ hoặc liên hệ ban hỗ trợ.',
          'Bạn có quyền rút lại sự đồng ý xử lý dữ liệu hoặc khiếu nại nếu phát hiện dữ liệu bị sử dụng sai mục đích.'
        ]
      },
      {
        heading: '7. Sử dụng Cookie và công nghệ theo dõi',
        body: [
          'Chúng tôi sử dụng cookie phiên làm việc để duy trì trạng thái đăng nhập và ghi nhớ tùy chọn giao diện của bạn.',
          'Bạn có thể tùy chỉnh chặn cookie trong cài đặt trình duyệt của mình.'
        ]
      },
      {
        heading: '8. Thông tin liên hệ phụ trách bảo vệ dữ liệu',
        body: [
          'Nếu có bất kỳ câu hỏi nào về chính sách quyền riêng tư này, vui lòng liên hệ Bộ phận Bảo vệ dữ liệu qua email: privacy@workgo.vn.'
        ]
      }
    ],
    ctas: [
      { label: 'Xem Điều khoản sử dụng', page: 'terms', variant: 'outline' },
      { label: 'Gửi thắc mắc riêng tư', page: 'contact', variant: 'primary' }
    ]
  },

  'contact': {
    title: 'Liên hệ & Trợ giúp 24/7',
    subtitle: 'Đội ngũ hỗ trợ khách hàng của WorkGo luôn sẵn sàng lắng nghe và giải đáp mọi yêu cầu của bạn 24/7.',
    kind: 'contact',
    channels: [
      { title: 'Email hỗ trợ', value: 'support@workgo.vn', note: 'Phản hồi trong vòng 2 giờ' },
      { title: 'Hotline khẩn cấp', value: '1900 6868', note: 'Hỗ trợ 24/7 cước gọi tiêu chuẩn' },
      { title: 'Trụ sở chính', value: 'Tòa nhà WorkGo Tower, Quận 1, TP. Hồ Chí Minh', note: 'Giờ làm việc: 8:00 - 18:00 Thứ 2 - Thứ 6' }
    ],
    topics: [
      'Hỗ trợ tài khoản & Đăng nhập',
      'Vấn đề thanh toán & Ký quỹ Escrow',
      'Khiếu nại tiến độ hoặc chất lượng đơn hàng',
      'Xác thực Chuyên gia & Provider',
      'Hợp tác kinh doanh & Doanh nghiệp',
      'Góp ý phát triển nền tảng'
    ]
  }
};
