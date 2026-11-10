import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { catalogApi } from "../src/_webapp-mirror/api/catalogApi.js";
import { availabilityApi } from "../src/_webapp-mirror/api/availabilityApi.js";
import { addressApi } from "../src/_webapp-mirror/api/addressApi.js";
import { authApi } from "../src/_webapp-mirror/api/authApi.js";
import { providerApi } from "../src/_webapp-mirror/api/providerApi.js";
import { adminApi } from "../src/_webapp-mirror/api/adminApi.js";
import { orderApi } from "../src/_webapp-mirror/api/orderApi.js";
import { evidenceApi } from "../src/_webapp-mirror/api/evidenceApi.js";
import { verificationApi } from "../src/_webapp-mirror/api/verificationApi.js";

test("API Parity: catalogApi exports all Category, Service, Package, AddOn, and Media endpoints", () => {
  // Categories
  assert.equal(typeof catalogApi.getRootCategories, "function");
  assert.equal(typeof catalogApi.getCategoryById, "function");
  assert.equal(typeof catalogApi.getChildCategories, "function");
  
  // Services
  assert.equal(typeof catalogApi.getService, "function");
  assert.equal(typeof catalogApi.listServices, "function");
  assert.equal(typeof catalogApi.getMyServices, "function");
  assert.equal(typeof catalogApi.createService, "function");
  assert.equal(typeof catalogApi.updateService, "function");
  assert.equal(typeof catalogApi.deleteService, "function");
  assert.equal(typeof catalogApi.setServiceStatus, "function");

  // Packages (Full CRUD + byService)
  assert.equal(typeof catalogApi.createPackage, "function");
  assert.equal(typeof catalogApi.getPackages, "function");
  assert.equal(typeof catalogApi.getPackage, "function");
  assert.equal(typeof catalogApi.updatePackage, "function");
  assert.equal(typeof catalogApi.deletePackage, "function");

  // Add-ons (Full CRUD + byService)
  assert.equal(typeof catalogApi.createAddon, "function");
  assert.equal(typeof catalogApi.getAddons, "function");
  assert.equal(typeof catalogApi.getAddon, "function");
  assert.equal(typeof catalogApi.updateAddon, "function");
  assert.equal(typeof catalogApi.deleteAddon, "function");

  // Media (Full CRUD + byService)
  assert.equal(typeof catalogApi.createMedia, "function");
  assert.equal(typeof catalogApi.getMedias, "function");
  assert.equal(typeof catalogApi.getMedia, "function");
  assert.equal(typeof catalogApi.updateMedia, "function");
  assert.equal(typeof catalogApi.deleteMedia, "function");
});

test("API Parity: availabilityApi exports all Rule and BookingSlot endpoints", () => {
  assert.equal(typeof availabilityApi.getMyServices, "function");
  assert.equal(typeof availabilityApi.getService, "function");
  assert.equal(typeof availabilityApi.getRules, "function");
  assert.equal(typeof availabilityApi.getRule, "function");
  assert.equal(typeof availabilityApi.createRule, "function");
  assert.equal(typeof availabilityApi.updateRule, "function");
  assert.equal(typeof availabilityApi.deleteRule, "function");
  
  // Slots (list, hold, confirm, release)
  assert.equal(typeof availabilityApi.getSlots, "function");
  assert.equal(typeof availabilityApi.holdSlot, "function");
  assert.equal(typeof availabilityApi.confirmSlot, "function");
  assert.equal(typeof availabilityApi.releaseSlot, "function");
});

test("API Parity: addressApi exports full CRUD on /identity/addresses", () => {
  assert.equal(typeof addressApi.getMy, "function");
  assert.equal(typeof addressApi.getById, "function");
  assert.equal(typeof addressApi.create, "function");
  assert.equal(typeof addressApi.update, "function");
  assert.equal(typeof addressApi.remove, "function");
});

test("API Parity: authApi exports auth lifecycle endpoints", () => {
  assert.equal(typeof authApi.login, "function");
  assert.equal(typeof authApi.register, "function");
  assert.equal(typeof authApi.logout, "function");
  assert.equal(typeof authApi.introspect, "function");
  assert.equal(typeof authApi.refresh, "function");
  assert.equal(typeof authApi.getMyInfo, "function");
  assert.equal(typeof authApi.updateMyInfo, "function");
});

test("API Parity: providerApi and verificationApi export full provider and verification endpoints", () => {
  assert.equal(typeof providerApi.getProvider, "function");
  assert.equal(typeof providerApi.getMyProfile, "function");
  assert.equal(typeof providerApi.createProfile, "function");
  assert.equal(typeof providerApi.updateMyProfile, "function");
  assert.equal(typeof providerApi.deleteMyProfile, "function");

  assert.equal(typeof providerApi.submitVerification, "function");
  assert.equal(typeof providerApi.getMyVerifications, "function");
  assert.equal(typeof providerApi.getVerification, "function");
  assert.equal(typeof providerApi.deleteVerification, "function");

  assert.equal(typeof verificationApi.submit, "function");
  assert.equal(typeof verificationApi.getMy, "function");
  assert.equal(typeof verificationApi.getById, "function");
  assert.equal(typeof verificationApi.listByStatus, "function");
  assert.equal(typeof verificationApi.review, "function");
  assert.equal(typeof verificationApi.remove, "function");
});

test("API Parity: adminApi exports user, provider, verification, category admin operations", () => {
  assert.equal(typeof adminApi.listProviders, "function");
  assert.equal(typeof adminApi.setProviderStatus, "function");
  assert.equal(typeof adminApi.listVerifications, "function");
  assert.equal(typeof adminApi.reviewVerification, "function");

  assert.equal(typeof adminApi.listUsers, "function");
  assert.equal(typeof adminApi.getUser, "function");
  assert.equal(typeof adminApi.updateUser, "function");
  assert.equal(typeof adminApi.deleteUser, "function");

  assert.equal(typeof adminApi.listCategories, "function");
  assert.equal(typeof adminApi.createCategory, "function");
  assert.equal(typeof adminApi.updateCategory, "function");
  assert.equal(typeof adminApi.deleteCategory, "function");
});

test("API Parity: orderApi exports order, history, execution, and create operations", () => {
  assert.equal(typeof orderApi.getMyOrders, "function");
  assert.equal(typeof orderApi.getOrder, "function");
  assert.equal(typeof orderApi.getOrderHistory, "function");
  assert.equal(typeof orderApi.getExecution, "function");
  assert.equal(typeof orderApi.createOrder, "function");
});

test("API Parity: evidenceApi exports evidence retrieval and submission", () => {
  assert.equal(typeof evidenceApi.getEvidence, "function");
  assert.equal(typeof evidenceApi.createEvidence, "function");
});

test("API Parity: backend.ts bridge re-exports all API modules cleanly", () => {
  const backendTsPath = path.resolve(__dirname, "../src/components/webapp-bridge/backend.ts");
  const content = fs.readFileSync(backendTsPath, "utf-8");
  assert.match(content, /export\s*\{\s*catalogApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*availabilityApi/);
  assert.match(content, /export\s*\{\s*addressApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*authApi/);
  assert.match(content, /export\s*\{\s*providerApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*adminApi\s*\}\s*from/);
  assert.match(content, /export\s*\{\s*orderApi/);
  assert.match(content, /export\s*\{\s*evidenceApi/);
  assert.match(content, /export\s*\{\s*verificationApi\s*\}\s*from/);
});
