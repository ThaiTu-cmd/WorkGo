import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from './Step2Pricing.module.css';

let nextAddonKey = 0;

export default function Step2Pricing({ formData, onChange, errors = {} }) {
  const isDigital = (formData.executionType || 'DIGITAL') === 'DIGITAL';
  const packages = formData.packages || {
    basic: { title: 'Gói Starter', desc: 'Landing Page 1 trang chuẩn di động', days: 3, rev: '2 lần', price: 2500000 },
    standard: { title: 'Gói Business Pro', desc: 'Website đa trang (đến 5 trang) kèm CMS', days: 5, rev: '5 lần', price: 5000000 },
    premium: { title: 'Gói Enterprise VIP', desc: 'Trọn gói webapp hoàn chỉnh & thanh toán', days: 10, rev: 'Không giới hạn', price: 8500000 }
  };

  // F1: keep raw numeric input (NaN → 0) so validateStep can REPORT range errors;
  // the save path clamps as a safety net. Silent hard-clamp here would hide the error UI.
  const handlePackageChange = (tier, field, value) => {
    const nextValue = field === 'price' ? (Number.isFinite(Number(value)) ? Number(value) : 0) : value;
    const updated = {
      ...packages,
      [tier]: {
        ...packages[tier],
        [field]: nextValue
      }
    };
    onChange('packages', updated);
  };

  // Add-ons are saved with the service (create / update / delete by id).
  // New rows get a local `key` so React keeps their inputs apart before they have an id.
  const addons = formData.addons || [];
  const updateAddon = (idx, field, value) =>
    onChange('addons', addons.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  const removeAddon = (idx) => onChange('addons', addons.filter((_, i) => i !== idx));
  const addAddon = () =>
    onChange('addons', [...addons, { key: `new-${(nextAddonKey += 1)}`, name: '', desc: '', price: 100000 }]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.heading}>Bảng giá & Cấu hình 3 Gói Dịch vụ</h2>
        <p className={styles.desc}>
          Thiết kế bảng so sánh 3 gói Cơ bản, Tiêu chuẩn và Cao cấp giúp khách hàng dễ dàng đưa ra quyết định đặt đơn phù hợp với ngân sách.
        </p>
      </div>

      {/* Pricing Matrix Table */}
      <div className={styles.matrixWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thTitle}>Hạng mục cấu hình</th>
              
              {/* Basic */}
              <th className={styles.thPkg}>
                <div className={styles.pkgName}>Cơ bản (Basic)</div>
                <div className={styles.pkgSub}>Khởi đầu / Dự án nhỏ</div>
              </th>

              {/* Standard */}
              <th className={`${styles.thPkg} ${styles.recommended}`}>
                <span className={styles.recBadge}>Khuyên dùng</span>
                <div className={styles.pkgName}>Tiêu chuẩn (Standard)</div>
                <div className={styles.pkgSub}>Phổ biến nhất</div>
              </th>

              {/* Premium */}
              <th className={styles.thPkg}>
                <div className={styles.pkgName}>Cao cấp (Premium)</div>
                <div className={styles.pkgSub}>Trọn gói chuyên sâu</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Custom Titles */}
            <tr>
              <td className={styles.tdFeature}>Tên gói tùy chỉnh</td>
              <td>
                <input
                  type="text"
                  className={styles.inputTitle}
                  value={packages.basic?.title || ''}
                  onChange={(e) => handlePackageChange('basic', 'title', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className={styles.inputTitle}
                  value={packages.standard?.title || ''}
                  onChange={(e) => handlePackageChange('standard', 'title', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className={styles.inputTitle}
                  value={packages.premium?.title || ''}
                  onChange={(e) => handlePackageChange('premium', 'title', e.target.value)}
                />
              </td>
            </tr>

            {/* Custom Description */}
            <tr>
              <td className={styles.tdFeature}>Mô tả ngắn gọn phạm vi</td>
              <td>
                <textarea
                  className={styles.textareaDesc}
                  value={packages.basic?.desc || ''}
                  onChange={(e) => handlePackageChange('basic', 'desc', e.target.value)}
                />
              </td>
              <td>
                <textarea
                  className={styles.textareaDesc}
                  value={packages.standard?.desc || ''}
                  onChange={(e) => handlePackageChange('standard', 'desc', e.target.value)}
                />
              </td>
              <td>
                <textarea
                  className={styles.textareaDesc}
                  value={packages.premium?.desc || ''}
                  onChange={(e) => handlePackageChange('premium', 'desc', e.target.value)}
                />
              </td>
            </tr>

            {/* Delivery Days */}
            <tr>
              <td className={styles.tdFeature}>Thời gian hoàn thành</td>
              <td>
                <select
                  className={styles.select}
                  value={packages.basic?.days || 3}
                  onChange={(e) => handlePackageChange('basic', 'days', Number(e.target.value))}
                >
                  <option value={1}>1 ngày</option>
                  <option value={2}>2 ngày</option>
                  <option value={3}>3 ngày</option>
                  <option value={5}>5 ngày</option>
                  <option value={7}>7 ngày</option>
                </select>
              </td>
              <td>
                <select
                  className={styles.select}
                  value={packages.standard?.days || 5}
                  onChange={(e) => handlePackageChange('standard', 'days', Number(e.target.value))}
                >
                  <option value={3}>3 ngày</option>
                  <option value={5}>5 ngày</option>
                  <option value={7}>7 ngày</option>
                  <option value={10}>10 ngày</option>
                </select>
              </td>
              <td>
                <select
                  className={styles.select}
                  value={packages.premium?.days || 10}
                  onChange={(e) => handlePackageChange('premium', 'days', Number(e.target.value))}
                >
                  <option value={7}>7 ngày</option>
                  <option value={10}>10 ngày</option>
                  <option value={14}>14 ngày</option>
                  <option value={21}>21 ngày</option>
                </select>
              </td>
            </tr>

            {/* Revisions */}
            <tr>
              <td className={styles.tdFeature}>Số lần chỉnh sửa</td>
              <td>
                <select
                  className={styles.select}
                  value={packages.basic?.rev || '2 lần'}
                  onChange={(e) => handlePackageChange('basic', 'rev', e.target.value)}
                >
                  <option value="1 lần">1 lần</option>
                  <option value="2 lần">2 lần</option>
                  <option value="3 lần">3 lần</option>
                </select>
              </td>
              <td>
                <select
                  className={styles.select}
                  value={packages.standard?.rev || '5 lần'}
                  onChange={(e) => handlePackageChange('standard', 'rev', e.target.value)}
                >
                  <option value="3 lần">3 lần</option>
                  <option value="5 lần">5 lần</option>
                  <option value="Không giới hạn">Không giới hạn</option>
                </select>
              </td>
              <td>
                <select
                  className={styles.select}
                  value={packages.premium?.rev || 'Không giới hạn'}
                  onChange={(e) => handlePackageChange('premium', 'rev', e.target.value)}
                >
                  <option value="5 lần">5 lần</option>
                  <option value="Không giới hạn">Không giới hạn</option>
                </select>
              </td>
            </tr>

            {/* Dynamic Features Row 1 */}
            <tr>
              <td className={styles.tdFeature}>
                {isDigital ? 'Tối ưu Responsive & Tốc độ' : 'Thời gian tiếp cận tận nơi'}
                <span className={styles.featureSub}>
                  {isDigital ? 'Tương thích mọi thiết bị di động' : 'Khảo sát & có mặt theo hẹn'}
                </span>
              </td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
            </tr>

            {/* Dynamic Features Row 2 */}
            <tr>
              <td className={styles.tdFeature}>
                {isDigital ? 'Tích hợp CMS / Quản trị' : 'Vật tư chính hãng đi kèm'}
                <span className={styles.featureSub}>
                  {isDigital ? 'Tự quản lý bài viết / sản phẩm' : 'Linh kiện đạt chứng chỉ an toàn'}
                </span>
              </td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
            </tr>

            {/* Dynamic Features Row 3 */}
            <tr>
              <td className={styles.tdFeature}>
                {isDigital ? 'Bàn giao Source Code gốc' : 'Dọn dẹp vệ sinh sau thi công'}
                <span className={styles.featureSub}>
                  {isDigital ? 'Mã nguồn sạch, tài liệu API' : 'Hoàn trả mặt bằng sạch sẽ'}
                </span>
              </td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
            </tr>

            {/* Price Row */}
            <tr style={{ background: '#f8fafc' }}>
              <td className={styles.tdFeature} style={{ verticalAlign: 'middle' }}>
                <strong>Mức giá niêm yết (VNĐ) *</strong>
              </td>
              <td>
                <div className={styles.priceInputRow}>
                  <input
                    type="number"
                    className={styles.priceInput}
                    value={packages.basic?.price || 2500000}
                    step={50000}
                    min={50000}
                    onChange={(e) => handlePackageChange('basic', 'price', Number(e.target.value))}
                  />
                  <span className={styles.currency}>₫</span>
                </div>
              </td>
              <td style={{ background: '#f0fdf4' }}>
                <div className={styles.priceInputRow}>
                  <input
                    type="number"
                    className={styles.priceInput}
                    value={packages.standard?.price || 5000000}
                    step={50000}
                    min={50000}
                    onChange={(e) => handlePackageChange('standard', 'price', Number(e.target.value))}
                  />
                  <span className={styles.currency}>₫</span>
                </div>
              </td>
              <td>
                <div className={styles.priceInputRow}>
                  <input
                    type="number"
                    className={styles.priceInput}
                    value={packages.premium?.price || 8500000}
                    step={50000}
                    min={50000}
                    onChange={(e) => handlePackageChange('premium', 'price', Number(e.target.value))}
                  />
                  <span className={styles.currency}>₫</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* F1: price errors had no UI slot — user never knew why Next blocked. */}
      {errors.price && (
        <p role="alert" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '-1rem', marginBottom: '1rem' }}>
          {errors.price}
        </p>
      )}

      {/* Add-ons Upsells */}
      <h3 className={styles.addonsSectionTitle}>Dịch vụ gia tăng (Add-on Services / Upsells)</h3>
      <p className={styles.addonsSectionDesc}>
        Cung cấp các tùy chọn nâng cấp để khách hàng chọn thêm trong lúc thanh toán đơn hàng.
      </p>

      <div className={styles.addonsGrid}>
        {addons.map((addon, idx) => (
          <div key={addon.id || addon.key || idx} className={`${styles.addonCard} ${styles.active}`}>
            <div className={styles.addonContent}>
              <input
                type="text"
                className={styles.inputTitle}
                placeholder="Tên add-on, ví dụ: Giao gấp trong 24h"
                aria-label={`Tên add-on ${idx + 1}`}
                value={addon.name}
                onChange={(e) => updateAddon(idx, 'name', e.target.value)}
              />
              <textarea
                className={styles.textareaDesc}
                placeholder="Mô tả ngắn cho khách hàng"
                aria-label={`Mô tả add-on ${idx + 1}`}
                value={addon.desc}
                onChange={(e) => updateAddon(idx, 'desc', e.target.value)}
              />
              <div className={styles.addonPriceRow}>
                <input
                  type="number"
                  className={styles.addonPriceInput}
                  aria-label={`Giá add-on ${idx + 1}`}
                  value={addon.price ?? 0}
                  step={50000}
                  min={0}
                  onChange={(e) => updateAddon(idx, 'price', Number(e.target.value))}
                />
                <span className={styles.currency}>VNĐ</span>
                <button
                  type="button"
                  className={styles.addonRemove}
                  onClick={() => removeAddon(idx)}
                  aria-label={`Xóa add-on ${idx + 1}`}
                >
                  <Trash2 size={14} aria-hidden="true" /> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className={styles.addonAdd} onClick={addAddon}>
          <Plus size={16} aria-hidden="true" /> Thêm add-on
        </button>
      </div>
      {addons.length === 0 && (
        <p className={styles.addonsSectionDesc}>Chưa có add-on nào. Khách vẫn đặt được các gói ở trên.</p>
      )}
      {errors.addons && (
        <p role="alert" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.75rem' }}>
          {errors.addons}
        </p>
      )}
    </div>
  );
}

