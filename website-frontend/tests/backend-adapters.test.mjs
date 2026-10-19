import test from "node:test";
import assert from "node:assert/strict";
import {
  fromAddressForm,
  joinFullName,
  pageItems,
  toAddress,
  toMyServiceRow,
  toPackages,
  splitFullName,
  toRowStatus,
  toServiceCard,
  toServiceDetail,
  toServiceStatus,
} from "../src/_webapp-mirror/api/adapters.js";

test("adapters: pageItems reads wrapped and bare PageResponse", () => {
  assert.deepEqual(pageItems({ result: { data: [1, 2] } }), [1, 2]);
  assert.deepEqual(pageItems({ data: [3] }), [3]);
  assert.deepEqual(pageItems(null), []);
});

test("adapters: toPackages keeps ACTIVE packages, cheapest first, tiers by price", () => {
  const pkgs = toPackages([
    { packageId: "p3", name: "Premium", price: "900000", deliveryDay: 7, revisionLimit: 5, packageStatus: "ACTIVE" },
    { packageId: "p1", name: "Basic", price: 100000, deliveryDay: 2, revisionLimit: 1, packageStatus: "ACTIVE" },
    { packageId: "px", name: "Old", price: 1, packageStatus: "INACTIVE" },
    { packageId: "p2", name: "Standard", price: 500000, deliveryDay: 4, revisionLimit: 3, packageStatus: "ACTIVE" },
  ]);
  assert.deepEqual(
    pkgs.map((p) => [p.id, p.tier, p.price, p.deliveryDays]),
    [
      ["p1", "BASIC", 100000, 2],
      ["p2", "STANDARD", 500000, 4],
      ["p3", "PREMIUM", 900000, 7],
    ]
  );
});

test("adapters: toServiceDetail fills UI shape and leaves unknown stats empty", () => {
  const detail = toServiceDetail({
    service: { serviceId: "s1", providerId: "pv", categoryId: "c1", title: "Sửa máy lạnh", executionType: "ONSITE" },
    packages: [{ packageId: "p1", name: "Gói 1", price: 200000, packageStatus: "ACTIVE" }],
    addons: [{ addOnId: "a1", name: "Vệ sinh", price: 50000, status: "ACTIVE" }],
    medias: [{ serviceMediaId: "m1", url: "https://x/y.png", mediaType: "IMAGE" }],
    provider: { providerProfileId: "pv", businessName: "Điện lạnh A", verificationStatus: "VERIFIED" },
    category: { name: "Sửa chữa", slug: "sua-chua" },
  });
  assert.equal(detail.categoryName, "Sửa chữa");
  assert.equal(detail.provider.name, "Điện lạnh A");
  assert.equal(detail.provider.isVerified, true);
  assert.equal(detail.coverImage, "https://x/y.png");
  assert.equal(detail.basePrice, 200000);
  assert.deepEqual(detail.addons, [{ id: "a1", name: "Vệ sinh", description: "", price: 50000 }]);
  assert.deepEqual(toServiceDetail({ service: { serviceId: "s2" }, addons: [{ addOnId: null, name: "x" }] }).addons, []);
  assert.equal(detail.avgRating, null);
  assert.deepEqual(detail.reviews, []);
});

test("adapters: toMyServiceRow maps status and price range", () => {
  const row = toMyServiceRow(
    { serviceId: "s1", title: "Dọn nhà", status: "PUBLISHED", executionType: "ONSITE" },
    [{ price: 300000 }, { price: 100000 }],
    { name: "Vệ sinh", slug: "ve-sinh" }
  );
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.packagesCount, 2);
  assert.match(row.priceRange, /100\.000 ₫ – 300\.000 ₫/);
  assert.equal(row.categoryName, "Vệ sinh");
});

test("adapters: address round-trip keeps contact fields", () => {
  const view = toAddress({
    addressId: "ad1",
    label: "Nhà",
    contactName: "An",
    contactPhone: "0901234567",
    line1: "12 Lê Lợi",
    ward: "Bến Nghé",
    district: "Quận 1",
    city: "HCM",
  });
  assert.equal(view.id, "ad1");
  assert.equal(view.detail, "12 Lê Lợi, Bến Nghé, Quận 1, HCM");
  const body = fromAddressForm(view);
  assert.equal(body.contactName, "An");
  assert.equal(body.line1, "12 Lê Lợi");
  assert.equal(body.countryCode, "VN");
});

test("authApi: Vietnamese full name splits into last/first name and back", () => {
  assert.deepEqual(splitFullName("  Nguyễn Văn   An "), { firstName: "An", lastName: "Nguyễn Văn" });
  assert.deepEqual(splitFullName("An"), { firstName: "An", lastName: "" });
  assert.equal(joinFullName({ firstName: "An", lastName: "Nguyễn Văn" }), "Nguyễn Văn An");
  assert.equal(joinFullName({ userName: "an123" }), "an123");
});

test("adapters: toServiceCard maps list item with category and provider", () => {
  const card = toServiceCard(
    {
      serviceId: "s1",
      providerId: "pv",
      categoryId: "c1",
      title: "Thiết kế logo",
      executionType: "DIGITAL",
      basePrice: 1000000,
      avgRating: 4.5,
      reviewCount: 3,
      orderCount: 7,
      createdAt: "2026-10-19T00:00:00Z",
    },
    {
      category: { name: "Thiết kế Đồ họa", slug: "thiet-ke-do-hoa" },
      provider: { providerProfileId: "pv", businessName: "Văn A Studio", verificationStatus: "VERIFIED" },
    }
  );
  assert.equal(card.categorySlug, "thiet-ke-do-hoa");
  assert.equal(card.provider.name, "Văn A Studio");
  assert.equal(card.provider.isVerified, true);
  assert.equal(card.basePrice, 1000000);
  assert.equal(card.orderCount, 7);
  assert.match(card.coverImage, /^data:image\/svg\+xml/);
  // Unknown provider/category still renders.
  const bare = toServiceCard({ serviceId: "s2", title: "X", basePrice: null });
  assert.equal(bare.provider.name, "Nhà cung cấp");
  assert.equal(bare.basePrice, 0);
});

test("adapters: service detail shows rating only once there are reviews", () => {
  const rated = toServiceDetail({ service: { serviceId: "s1", avgRating: 4.8, reviewCount: 12, orderCount: 30 } });
  assert.equal(rated.avgRating, 4.8);
  assert.equal(rated.reviewCount, 12);
  assert.equal(rated.orderCount, 30);
  const fresh = toServiceDetail({ service: { serviceId: "s2", avgRating: 0, reviewCount: 0 } });
  assert.equal(fresh.avgRating, null);
});

test("adapters: My Services row carries order count and rating", () => {
  const row = toMyServiceRow({ serviceId: "s1", title: "A", status: "PAUSED", orderCount: 5, avgRating: 4.2, reviewCount: 2 });
  assert.equal(row.ordersCount, 5);
  assert.equal(row.avgRating, 4.2);
  assert.equal(row.reviewCount, 2);
  assert.equal(row.status, "PAUSED");
});

test("adapters: row status and catalog ServiceStatus convert both ways", () => {
  assert.equal(toRowStatus("PUBLISHED"), "ACTIVE");
  assert.equal(toRowStatus("DRAFT"), "DRAFT");
  assert.equal(toServiceStatus("ACTIVE"), "PUBLISHED");
  assert.equal(toServiceStatus("PAUSED"), "PAUSED");
});
