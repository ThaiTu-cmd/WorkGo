"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/shell/page-container";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { PostForm } from "@/components/composed/post-form";
import { postsApi } from "@/lib/adapters/posts";
import { catalogApi, type CategoryItem } from "@/lib/adapters/catalog";
import type { PostFormData } from "@/lib/schemas/post";
import { useToast } from "@/components/ui/toast";

export default function NewPostPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { toast } = useToast();
  const tJob = useTranslations("jobForm");

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);

  React.useEffect(() => {
    catalogApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async (data: PostFormData) => {
    const created = await postsApi.create(data);
    toast({
      type: "success",
      title: tJob("createSuccess"),
      description: "Bài đăng việc làm của bạn đã sẵn sàng nhận đề xuất.",
    });
    router.push(`/${locale}/posts/${created.postId}`);
  };

  return (
    <PageContainer>
      <Breadcrumb
        locale={locale}
        items={[
          { label: "Bảng điều khiển", href: "/client" },
          { label: "Bài đăng của tôi", href: "/client/posts" },
          { label: "Đăng việc làm mới" },
        ]}
      />

      <PostForm categories={categories} onSubmit={handleSubmit} locale={locale} />
    </PageContainer>
  );
}
