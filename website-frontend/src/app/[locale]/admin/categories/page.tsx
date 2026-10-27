"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { adminApi } from "@/components/webapp-bridge/backend";
import {
  ConfirmDialog,
  ListState,
  Notice,
  PageHeader,
  Pagination,
  cx,
  errorMessage,
  formatDate,
  useAdminList,
} from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

type Category = {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  parent?: string | null;
  createdAt?: string;
  children?: { categoryId: string; name: string }[];
};

type Form = { name: string; slug: string; description: string; parent: string };

const EMPTY_FORM: Form = { name: "", slug: "", description: "", parent: "" };

// "Dịch vụ Vệ sinh" -> "dich-vu-ve-sinh"
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function AdminCategoriesPage() {
  const list = useAdminList<Category>((page) => adminApi.listCategories({ page, size: 20 }), "categories");
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // Parent picker options (all categories, not just the current page).
  const loadAll = () =>
    adminApi
      .listCategories({ page: 0, size: 200 })
      .then((res) => setAllCategories(res?.result?.data ?? []))
      .catch(() => setAllCategories([]));

  useEffect(() => {
    loadAll();
  }, []);

  const nameOf = (id?: string | null) => (id ? (allCategories.find((c) => c.categoryId === id)?.name ?? "—") : "—");

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setFormError(null);
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name ?? "", slug: c.slug ?? "", description: c.description ?? "", parent: c.parent ?? "" });
    setSlugTouched(true);
    setFormError(null);
  };

  const refresh = () => {
    list.reload();
    loadAll();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      parent: form.parent || null,
    };
    try {
      if (editing) {
        await adminApi.updateCategory(editing.categoryId, body);
        setNotice({ tone: "success", text: `Đã cập nhật danh mục "${body.name}".` });
      } else {
        await adminApi.createCategory(body);
        setNotice({ tone: "success", text: `Đã tạo danh mục "${body.name}".` });
      }
      startCreate();
      refresh();
    } catch (err) {
      // Shown inside the form: the page-level notice is off-screen below the table.
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminApi.deleteCategory(deleting.categoryId);
      setNotice({ tone: "success", text: `Đã xoá danh mục "${deleting.name}".` });
      if (editing?.categoryId === deleting.categoryId) startCreate();
      refresh();
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  // A category cannot be its own parent.
  const parentOptions = allCategories.filter((c) => c.categoryId !== editing?.categoryId);

  return (
    <>
      <PageHeader title="Danh mục" sub="Quản lý cây danh mục dịch vụ.">
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={refresh}>
            <RefreshCw size={14} /> Tải lại
          </button>
          <button type="button" className={cx(styles.btn, styles.btnPrimary)} onClick={startCreate}>
            <Plus size={14} /> Thêm danh mục
          </button>
        </div>
      </PageHeader>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <div className={styles.split}>
        <div className={styles.card}>
          <ListState loading={list.loading} error={list.error} empty={!list.items.length} onRetry={list.reload} />
          {!list.loading && !list.error && list.items.length > 0 && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Danh mục cha</th>
                      <th>Con</th>
                      <th>Tạo lúc</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.items.map((c) => (
                      <tr key={c.categoryId}>
                        <td>
                          <div className={styles.cellMain}>{c.name}</div>
                          <div className={styles.cellSub}>/{c.slug}</div>
                        </td>
                        <td>{nameOf(c.parent)}</td>
                        <td>{c.children?.length ?? 0}</td>
                        <td>{formatDate(c.createdAt)}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.btn}
                              onClick={() => startEdit(c)}
                              aria-label={`Sửa ${c.name}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className={cx(styles.btn, styles.btnDanger)}
                              onClick={() => setDeleting(c)}
                              aria-label={`Xoá ${c.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                totalElements={list.totalElements}
                onChange={list.setPage}
              />
            </>
          )}
        </div>

        <form className={cx(styles.card, styles.cardPad, styles.form)} onSubmit={submit}>
          <h2 className={styles.dialogTitle}>{editing ? `Sửa "${editing.name}"` : "Thêm danh mục"}</h2>
          <label className={styles.field}>
            Tên
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
              }}
              required
            />
          </label>
          <label className={styles.field}>
            Slug
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              required
            />
          </label>
          <label className={styles.field}>
            Mô tả
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className={styles.field}>
            Danh mục cha
            <select value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}>
              <option value="">— Không có (danh mục gốc) —</option>
              {parentOptions.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {formError && <Notice tone="error">{formError}</Notice>}
          <div className={styles.actions}>
            <button type="submit" className={cx(styles.btn, styles.btnPrimary)} disabled={saving}>
              {saving && <Loader2 size={14} className={styles.spin} />}
              {editing ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
            {editing && (
              <button type="button" className={styles.btn} onClick={startCreate} disabled={saving}>
                Huỷ sửa
              </button>
            )}
          </div>
        </form>
      </div>

      {deleting && (
        <ConfirmDialog
          title={`Xoá danh mục "${deleting.name}"?`}
          body="Danh mục sẽ bị ẩn khỏi hệ thống. Các dịch vụ đang dùng danh mục này có thể bị ảnh hưởng."
          confirmLabel="Xoá"
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
