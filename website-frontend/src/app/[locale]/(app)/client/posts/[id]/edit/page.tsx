"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/shell/page-container";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { PostForm } from "@/components/composed/post-form";
import { postsApi, type PostItem } from "@/lib/adapters/posts";
import { catalogApi, type CategoryItem } from "@/lib/adapters/catalog";
import type { PostFormData } from "@/lib/schemas/post";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const postId = params?.id as string;
  const { toast } = useToast();
  const tJob = useTranslations("jobForm");

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [post, setPost] = React.useState<PostItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const [cats, postData] = await Promise.all([
          catalogApi.getCategories(),
          postsApi.get(postId),
        ]);
        setCategories(cats);
        setPost(postData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  const handleSubmit = async (data: PostFormData) => {
    await postsApi.update(postId, data);
    toast({
      type: "success",
      title: tJob("updateSuccess"),
    });
    router.push(`/${locale}/posts/${postId}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!post) {
    return (
      <PageContainer>
        <EmptyState title="Không tìm thấy bài đăng để chỉnh sửa" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb
        locale={locale}
        items={[
          { label: "Bảng điều khiển", href: "/client" },
          { label: "Bài đăng của tôi", href: "/client/posts" },
          { label: post.title, href: `/posts/${post.postId}` },
          { label: "Chỉnh sửa" },
        ]}
      />

      <PostForm
        categories={categories}
        initialData={post}
        onSubmit={handleSubmit}
        locale={locale}
        isEdit
      />
    </PageContainer>
  );
}
