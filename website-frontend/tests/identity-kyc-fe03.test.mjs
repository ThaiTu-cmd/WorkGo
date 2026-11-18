import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FE_ROOT = path.resolve(__dirname, "../src/components/trung-pages");

const readFile = (relPath) => fs.readFileSync(path.join(FE_ROOT, relPath), "utf-8");

test("FE-03: auth pages use real authApi from bridge and contain no mock logic", () => {
  const login = readFile("auth/LoginPage.tsx");
  const register = readFile("auth/RegisterPage.tsx");

  assert.ok(login.includes('from "../../webapp-bridge/backend"'), "LoginPage must import from bridge");
  assert.ok(login.includes("authApi.login("), "LoginPage must call authApi.login");
  assert.ok(!login.includes("_mocks"), "LoginPage must not reference _mocks");
  assert.ok(!login.includes("mock-token"), "LoginPage must not invent mock tokens");

  assert.ok(register.includes('from "../../webapp-bridge/backend"'), "RegisterPage must import from bridge");
  assert.ok(register.includes("authApi.register("), "RegisterPage must call authApi.register");
  assert.ok(!register.includes("_mocks"), "RegisterPage must not reference _mocks");
});

test("FE-03: profile pages use real authApi and addressApi with zero mock dependencies", () => {
  const profile = readFile("profile/ProfileSettingsPage.tsx");
  const address = readFile("profile/AddressBookPage.tsx");

  assert.ok(profile.includes("authApi.getMyInfo()"), "ProfileSettingsPage must load via authApi.getMyInfo");
  assert.ok(profile.includes("authApi.updateMyInfo("), "ProfileSettingsPage must update via authApi.updateMyInfo");
  assert.ok(profile.includes("handleAvatarFileChange"), "ProfileSettingsPage must support avatar file upload");
  assert.ok(!profile.includes("_mocks"), "ProfileSettingsPage must not reference _mocks");

  assert.ok(address.includes("addressApi.getMy("), "AddressBookPage must load via addressApi.getMy");
  assert.ok(address.includes("addressApi.create("), "AddressBookPage must create via addressApi.create");
  assert.ok(address.includes("addressApi.update("), "AddressBookPage must update via addressApi.update");
  assert.ok(address.includes("addressApi.remove("), "AddressBookPage must delete via addressApi.remove");
  assert.ok(!address.includes("_mocks"), "AddressBookPage must not reference _mocks");
});

test("FE-03: provider pages integrate providerApi and verificationApi for KYC CCCD workflow", () => {
  const onboarding = readFile("provider/ProviderOnboardingPage.tsx");
  const profile = readFile("provider/ProviderProfilePage.tsx");

  // Onboarding verification checks
  assert.ok(onboarding.includes("providerApi.getMyProfile()"), "ProviderOnboardingPage must check profile via providerApi");
  assert.ok(onboarding.includes("providerApi.createProfile("), "ProviderOnboardingPage must create profile via providerApi");
  assert.ok(onboarding.includes("verificationApi.submit("), "ProviderOnboardingPage must submit KYC via verificationApi.submit");
  assert.ok(onboarding.includes("verificationApi.getMy("), "ProviderOnboardingPage must query KYC verifications via verificationApi.getMy");
  assert.ok(onboarding.includes("verificationApi.remove("), "ProviderOnboardingPage must support withdrawing KYC via verificationApi.remove");
  assert.ok(onboarding.includes("handleImageFile"), "ProviderOnboardingPage must support CCCD image file upload");
  assert.ok(onboarding.includes("cccdNumber"), "ProviderOnboardingPage must validate CCCD number");
  assert.ok(!onboarding.includes("_mocks"), "ProviderOnboardingPage must not reference _mocks");

  // Profile verification & edit checks
  assert.ok(profile.includes("providerApi.getMyProfile()"), "ProviderProfilePage must get my profile via providerApi");
  assert.ok(profile.includes("providerApi.updateMyProfile("), "ProviderProfilePage must allow updating profile via providerApi");
  assert.ok(profile.includes("verificationApi.getMy("), "ProviderProfilePage must check KYC verification status");
  assert.ok(profile.includes("isKycVerified"), "ProviderProfilePage must reflect KYC verification badge");
  assert.ok(!profile.includes("_mocks"), "ProviderProfilePage must not reference _mocks");
});

test("FE-03: strict hygiene - no reverse imports from _webapp-mirror and no console logging", () => {
  const files = [
    "auth/LoginPage.tsx",
    "auth/RegisterPage.tsx",
    "profile/ProfileSettingsPage.tsx",
    "profile/AddressBookPage.tsx",
    "provider/ProviderOnboardingPage.tsx",
    "provider/ProviderProfilePage.tsx",
  ];

  for (const f of files) {
    const content = readFile(f);
    assert.ok(!content.includes("_webapp-mirror"), `${f} must not import directly from _webapp-mirror`);
    assert.ok(!/console\.(log|warn|error)\(/.test(content), `${f} must not have console statements`);
  }
});
