import Link from "next/link";
import { Briefcase, Star } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { identityApi, type ProviderProfileResponse } from "@/lib/adapters/identity";
import { ProviderHeader } from "@/components/composed/provider-header";

export default async function ProviderPublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let provider: ProviderProfileResponse | null = null;
  try {
    provider = await identityApi.getProviderProfile(id);
  } catch {
    provider = null;
  }

  // Fallback demo mock if backend provider ID doesn't exist yet
  if (!provider) {
    if (id === "prov-1" || id === "demo") {
      provider = {
        providerProfileId: id,
        providerType: "INDIVIDUAL",
        businessName: "Nguyễn Văn Hùng",
        bio: "Senior UI/UX Designer & Frontend Developer với hơn 6 năm kinh nghiệm thực chiến. Chuyên thiết kế và phát triển ứng dụng web hiện đại, hệ thống Design System chuẩn Figma và các trang thương mại điện tử tối ưu trải nghiệm người dùng.",
        verificationStatus: "VERIFIED",
        ratingAvg: 4.9,
        ratingCount: 38,
        completedOrderCount: 42,
        isAcceptingOrders: true,
        joinedAt: "2025-01-15T08:00:00.000Z",
        userId: "u-hung",
      };
    }
  }

  if (!provider) {
    return (
      <PageContainer>
        <EmptyState
          title="Không tìm thấy hồ sơ đối tác"
          description="Hồ sơ đối tác này không tồn tại hoặc đã bị tạm khóa. Vui lòng quay lại danh sách việc làm để tìm kiếm đối tác khác."
          action={
            <Link href={`/${locale}/posts`}>
              <Button variant="primary">Khám phá Việc làm</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb
        locale={locale}
        items={[
          { label: "Việc làm", href: "/posts" },
          { label: "Hồ sơ Đối tác" },
          { label: provider.businessName },
        ]}
      />

      <ProviderHeader provider={provider} locale={locale} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bio & Services */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giới thiệu & Kỹ năng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-fg leading-relaxed whitespace-pre-line">
                {provider.bio}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Dịch vụ chuyên nghiệp</CardTitle>
              <span className="text-xs text-fg-tertiary">Chưa liên kết</span>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border border-dashed border-border rounded-card bg-surface/50 text-fg-secondary text-sm">
                Đối tác hiện chưa đăng gói dịch vụ công khai nào trên hệ thống.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Đánh giá từ khách hàng</CardTitle>
              <div className="flex items-center gap-1 text-sm font-semibold text-fg">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{provider.ratingAvg.toFixed(1)}</span>
                <span className="text-xs text-fg-secondary">({provider.ratingCount})</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border border-dashed border-border rounded-card bg-surface/50 text-fg-secondary text-sm">
                Chưa có đánh giá công khai nào cho hồ sơ này.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Contact Policy */}
        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tương tác với đối tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-fg-secondary leading-relaxed">
                Để bảo vệ quyền lợi và bảo mật an toàn cho người dùng, mọi thỏa thuận công việc và thanh toán phải được thực hiện thông qua hệ thống WorkGo.
              </p>

              <Link href={`/${locale}/posts`} className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Xem các việc làm đang mở</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
