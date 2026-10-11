import React from 'react';
import styles from './Step2Pricing.module.css';

export default function Step2Pricing({ formData, onChange, errors = {} }) {
  const isDigital = (formData.executionType || 'DIGITAL') === 'DIGITAL';
  const packages = formData.packages || {
    basic: { title: 'Gói Starter', desc: 'Landing Page 1 trang chuẩn di động', days: 3, rev: '2 lần', price: 2500000 },
    standard: { title: 'Gói Business Pro', desc: 'Website đa trang (đến 5 trang) kèm CMS', days: 5, rev: '5 lần', price: 5000000 },
    premium: { title: 'Gói Enterprise VIP', desc: 'Trọn gói webapp hoàn chỉnh & thanh toán', days: 10, rev: 'Không giới hạn', price: 8500000 }
  };

  const handlePackageChange = (tier, field, value) => {
    const updated = {
      ...packages,
      [tier]: {
        ...packages[tier],
        [field]: value
      }
    };
    onChange('packages', updated);
  };

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

      {/* Add-ons Upsells */}
      <h3 className={styles.addonsSectionTitle}>Dịch vụ gia tăng (Add-on Services / Upsells)</h3>
      <p className={styles.addonsSectionDesc}>
        Cung cấp các tùy chọn nâng cấp để khách hàng chọn thêm trong lúc thanh toán đơn hàng.
      </p>

      <div className={styles.addonsGrid}>
        <div className={`${styles.addonCard} ${styles.active}`}>
          <input type="checkbox" className={styles.addonCheck} defaultChecked />
          <div className={styles.addonContent}>
            <div className={styles.addonTitle}>Giao hàng hỏa tốc (Rút ngắn 40% thời gian)</div>
            <div className={styles.addonDesc}>Ưu tiên tập trung hoàn thiện dự án của bạn trước tiên trong lịch trình.</div>
            <div className={styles.addonPriceRow}>
              <input type="number" className={styles.addonPriceInput} defaultValue={800000} step={50000} />
              <span className={styles.currency}>VNĐ</span>
            </div>
          </div>
        </div>

        <div className={`${styles.addonCard} ${styles.active}`}>
          <input type="checkbox" className={styles.addonCheck} defaultChecked />
          <div className={styles.addonContent}>
            <div className={styles.addonTitle}>Bàn giao trọn bộ File gốc & Source Code</div>
            <div className={styles.addonDesc}>Bao gồm toàn bộ file thiết kế Figma gốc và mã nguồn sạch chuẩn repository.</div>
            <div className={styles.addonPriceRow}>
              <input type="number" className={styles.addonPriceInput} defaultValue={600000} step={50000} />
              <span className={styles.currency}>VNĐ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

