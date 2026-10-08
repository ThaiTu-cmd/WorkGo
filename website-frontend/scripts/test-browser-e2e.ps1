# ==============================================================================
# WorkGo Platform - Script Kiem Thu Trinh Duyet Cho QA / TESTER (v8.0.0)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  WORKGO PLATFORM - BO CONG CU KIEM THU TRINH DUYET (BROWSER QA)       " -ForegroundColor Cyan
Write-Host "  Phien ban: 8.0.0 (Seamless Auth Navigation & Clean Landing Header)   " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra trang thai may chu Next.js
$frontendUrl = "http://localhost:3000"
Write-Host "[1/3] Dang kiem tra trang thai may chu Frontend ($frontendUrl)..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/vi" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] May chu Frontend dang hoat dong binh thuong (HTTP $($response.StatusCode))." -ForegroundColor Green
} catch {
    Write-Host "  [CANH BAO] Khong ket noi duoc toi $frontendUrl!" -ForegroundColor Red
    Write-Host "  Hay khoi dong Next.js bang lenh: cd website-frontend; npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

# 2. Mo cac trang kiem thu tren trinh duyet mac dinh
Write-Host "[2/3] Dang khoi chay trinh duyet mo cac URL kiem thu..." -ForegroundColor White

$landingUrl  = "$frontendUrl/vi"
$loginUrl    = "$frontendUrl/vi/login"
$registerUrl = "$frontendUrl/vi/register"

Write-Host "  -> Mo Landing Page: $landingUrl" -ForegroundColor Gray
Start-Process $landingUrl

Start-Sleep -Milliseconds 800

Write-Host "  -> Mo Trang Dang nhap: $loginUrl" -ForegroundColor Gray
Start-Process $loginUrl

Start-Sleep -Milliseconds 800

Write-Host "  -> Mo Trang Dang ky: $registerUrl" -ForegroundColor Gray
Start-Process $registerUrl

Write-Host "  [OK] Da mo 3 tab trinh duyet thanh cong." -ForegroundColor Green
Write-Host ""

# 3. Huong dan cac kich ban kiem thu chi tiet
Write-Host "[3/3] HUONG DAN 5 KICH BAN KIEM THU CHI TIET (TEST CHECKLIST):" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray

Write-Host "KICH BAN 1: ZERO-OVERLAP HEADER (Trang Landing /vi)" -ForegroundColor Yellow
Write-Host "  1. Quan sat dinh trang: Khong con khung capsule noi de len header."
Write-Host "  2. Thanh header chinh thuc co day du: Logo WorkGo, Viec lam, Dang nhap, Bat dau ngay."
Write-Host "  3. Goc duoi ben phai (Bottom-Right) co dock nho chuyen Theme va Ngon ngu (VI/EN)."
Write-Host ""

Write-Host "KICH BAN 2: QUAY VE TRANG GIOI THIEU TU LOGIN (/vi/login)" -ForegroundColor Yellow
Write-Host "  1. Kiem tra goc tren ben trai: Bam Logo WorkGo -> Quay ve /vi."
Write-Host "  2. Kiem tra goc tren ben phai: Bam 'Ve trang gioi thieu' (mui ten) -> Quay ve /vi."
Write-Host "  3. Kiem tra chan form card: Bam 'Quay ve trang gioi thieu' -> Quay ve /vi."
Write-Host ""

Write-Host "KICH BAN 3: QUAY VE TRANG GIOI THIEU TU REGISTER (/vi/register)" -ForegroundColor Yellow
Write-Host "  1. Kiem tra header va chan form card: Co nut/link 'Quay ve trang gioi thieu'."
Write-Host "  2. Bam thu link -> Quay ve /vi an toan, muot ma."
Write-Host ""

Write-Host "KICH BAN 4: CHU TRINH LOGIN -> LOGOUT -> VE LANDING (BUG FIX REPRO)" -ForegroundColor Yellow
Write-Host "  1. Tai /vi/login, bam 'Demo Khach hang' -> Bam 'Dang nhap' -> Vao /vi/client."
Write-Host "  2. Bam Avatar goc phai tren -> Chon 'Dang xuat' -> Trinh duyet reload sach ve /vi/login."
Write-Host "  3. Tai /vi/login, bam 'Ve trang gioi thieu' -> Mo /vi thanh cong, KHONG GAP LOI!"
Write-Host ""

Write-Host "KICH BAN 5: DA NGON NGU TIENG ANH (/en va /en/login)" -ForegroundColor Yellow
Write-Host "  1. Truy cap http://localhost:3000/en -> Header co 'Jobs', 'Sign In', 'Get Started'."
Write-Host "  2. Vao /en/login -> Co nut 'Back to Home' va 'Back to landing page' -> Quay ve /en."
Write-Host ""

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  HOAN TAT KIEM THU TRINH DUYET E2E!                                  " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan