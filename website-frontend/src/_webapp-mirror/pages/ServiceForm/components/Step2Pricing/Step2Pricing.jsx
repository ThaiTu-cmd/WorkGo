import { useTranslations } from "next-intl";
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from './Step2Pricing.module.css';
let nextAddonKey = 0;
export default function Step2Pricing({
  formData,
  onChange,
  errors = {}
}) {
  const tr = useTranslations("misc");
  const isDigital = (formData.executionType || 'DIGITAL') === 'DIGITAL';
  const packages = formData.packages || {
    basic: {
      title: tr("m1039"),
      desc: tr("m1040"),
      days: 3,
      rev: '2 lần',
      price: 2500000
    },
    standard: {
      title: tr("m1041"),
      desc: tr("m1042"),
      days: 5,
      rev: '5 lần',
      price: 5000000
    },
    premium: {
      title: tr("m1043"),
      desc: tr("m1044"),
      days: 10,
      rev: tr("m1045"),
      price: 8500000
    }
  };

  // F1: keep raw numeric input (NaN → 0) so validateStep can REPORT range errors;
  // the save path clamps as a safety net. Silent hard-clamp here would hide the error UI.
  const handlePackageChange = (tier, field, value) => {
    const nextValue = field === 'price' ? Number.isFinite(Number(value)) ? Number(value) : 0 : value;
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
  const updateAddon = (idx, field, value) => onChange('addons', addons.map((item, i) => i === idx ? {
    ...item,
    [field]: value
  } : item));
  const removeAddon = idx => onChange('addons', addons.filter((_, i) => i !== idx));
  const addAddon = () => onChange('addons', [...addons, {
    key: `new-${nextAddonKey += 1}`,
    name: '',
    desc: '',
    price: 100000
  }]);
  return <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.heading}>{tr("m1064")}</h2>
        <p className={styles.desc}>{tr("m1065")}</p>
      </div>

      {/* Pricing Matrix Table */}
      <div className={styles.matrixWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thTitle}>{tr("m1066")}</th>
              
              {/* Basic */}
              <th className={styles.thPkg}>
                <div className={styles.pkgName}>{tr("m1067")}</div>
                <div className={styles.pkgSub}>{tr("m1068")}</div>
              </th>

              {/* Standard */}
              <th className={`${styles.thPkg} ${styles.recommended}`}>
                <span className={styles.recBadge}>{tr("m933")}</span>
                <div className={styles.pkgName}>{tr("m1069")}</div>
                <div className={styles.pkgSub}>{tr("m427")}</div>
              </th>

              {/* Premium */}
              <th className={styles.thPkg}>
                <div className={styles.pkgName}>{tr("m1070")}</div>
                <div className={styles.pkgSub}>{tr("m1071")}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Custom Titles */}
            <tr>
              <td className={styles.tdFeature}>{tr("m1072")}</td>
              <td>
                <input type="text" className={styles.inputTitle} value={packages.basic?.title || ''} onChange={e => handlePackageChange('basic', 'title', e.target.value)} />
              </td>
              <td>
                <input type="text" className={styles.inputTitle} value={packages.standard?.title || ''} onChange={e => handlePackageChange('standard', 'title', e.target.value)} />
              </td>
              <td>
                <input type="text" className={styles.inputTitle} value={packages.premium?.title || ''} onChange={e => handlePackageChange('premium', 'title', e.target.value)} />
              </td>
            </tr>

            {/* Custom Description */}
            <tr>
              <td className={styles.tdFeature}>{tr("m1073")}</td>
              <td>
                <textarea className={styles.textareaDesc} value={packages.basic?.desc || ''} onChange={e => handlePackageChange('basic', 'desc', e.target.value)} />
              </td>
              <td>
                <textarea className={styles.textareaDesc} value={packages.standard?.desc || ''} onChange={e => handlePackageChange('standard', 'desc', e.target.value)} />
              </td>
              <td>
                <textarea className={styles.textareaDesc} value={packages.premium?.desc || ''} onChange={e => handlePackageChange('premium', 'desc', e.target.value)} />
              </td>
            </tr>

            {/* Delivery Days */}
            <tr>
              <td className={styles.tdFeature}>{tr("m422")}</td>
              <td>
                <select className={styles.select} value={packages.basic?.days || 3} onChange={e => handlePackageChange('basic', 'days', Number(e.target.value))}>
                  <option value={1}>{tr("m1074")}</option>
                  <option value={2}>{tr("m1075")}</option>
                  <option value={3}>{tr("m1076")}</option>
                  <option value={5}>{tr("m1077")}</option>
                  <option value={7}>{tr("m1078")}</option>
                </select>
              </td>
              <td>
                <select className={styles.select} value={packages.standard?.days || 5} onChange={e => handlePackageChange('standard', 'days', Number(e.target.value))}>
                  <option value={3}>{tr("m1076")}</option>
                  <option value={5}>{tr("m1077")}</option>
                  <option value={7}>{tr("m1078")}</option>
                  <option value={10}>{tr("m1079")}</option>
                </select>
              </td>
              <td>
                <select className={styles.select} value={packages.premium?.days || 10} onChange={e => handlePackageChange('premium', 'days', Number(e.target.value))}>
                  <option value={7}>{tr("m1078")}</option>
                  <option value={10}>{tr("m1079")}</option>
                  <option value={14}>{tr("m1080")}</option>
                  <option value={21}>{tr("m1081")}</option>
                </select>
              </td>
            </tr>

            {/* Revisions */}
            <tr>
              <td className={styles.tdFeature}>{tr("m1082")}</td>
              <td>
                <select className={styles.select} value={packages.basic?.rev || '2 lần'} onChange={e => handlePackageChange('basic', 'rev', e.target.value)}>
                  <option value="1 lần">1 lần</option>
                  <option value="2 lần">2 lần</option>
                  <option value="3 lần">3 lần</option>
                </select>
              </td>
              <td>
                <select className={styles.select} value={packages.standard?.rev || '5 lần'} onChange={e => handlePackageChange('standard', 'rev', e.target.value)}>
                  <option value="3 lần">3 lần</option>
                  <option value="5 lần">5 lần</option>
                  <option value={tr("m1045")}>{tr("m1045")}</option>
                </select>
              </td>
              <td>
                <select className={styles.select} value={packages.premium?.rev || tr("m1045")} onChange={e => handlePackageChange('premium', 'rev', e.target.value)}>
                  <option value="5 lần">5 lần</option>
                  <option value={tr("m1045")}>{tr("m1045")}</option>
                </select>
              </td>
            </tr>

            {/* Dynamic Features Row 1 */}
            <tr>
              <td className={styles.tdFeature}>
                {isDigital ? tr("m1046") : tr("m1047")}
                <span className={styles.featureSub}>
                  {isDigital ? tr("m1048") : tr("m1049")}
                </span>
              </td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
            </tr>

            {/* Dynamic Features Row 2 */}
            <tr>
              <td className={styles.tdFeature}>
                {isDigital ? tr("m1050") : tr("m1051")}
                <span className={styles.featureSub}>
                  {isDigital ? tr("m1052") : tr("m1053")}
                </span>
              </td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
            </tr>

            {/* Dynamic Features Row 3 */}
            <tr>
              <td className={styles.tdFeature}>
                {isDigital ? tr("m1054") : tr("m1055")}
                <span className={styles.featureSub}>
                  {isDigital ? tr("m1056") : tr("m1057")}
                </span>
              </td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} /></td>
              <td className={styles.cellCenter}><input type="checkbox" className={styles.checkbox} defaultChecked /></td>
            </tr>

            {/* Price Row */}
            <tr style={{
            background: '#f8fafc'
          }}>
              <td className={styles.tdFeature} style={{
              verticalAlign: 'middle'
            }}>
                <strong>{tr("m1089")}</strong>
              </td>
              <td>
                <div className={styles.priceInputRow}>
                  <input type="number" className={styles.priceInput} value={packages.basic?.price || 2500000} step={50000} min={50000} onChange={e => handlePackageChange('basic', 'price', Number(e.target.value))} />
                  <span className={styles.currency}>₫</span>
                </div>
              </td>
              <td style={{
              background: '#f0fdf4'
            }}>
                <div className={styles.priceInputRow}>
                  <input type="number" className={styles.priceInput} value={packages.standard?.price || 5000000} step={50000} min={50000} onChange={e => handlePackageChange('standard', 'price', Number(e.target.value))} />
                  <span className={styles.currency}>₫</span>
                </div>
              </td>
              <td>
                <div className={styles.priceInputRow}>
                  <input type="number" className={styles.priceInput} value={packages.premium?.price || 8500000} step={50000} min={50000} onChange={e => handlePackageChange('premium', 'price', Number(e.target.value))} />
                  <span className={styles.currency}>₫</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* F1: price errors had no UI slot — user never knew why Next blocked. */}
      {errors.price && <p role="alert" style={{
      fontSize: '0.75rem',
      color: '#ef4444',
      marginTop: '-1rem',
      marginBottom: '1rem'
    }}>
          {errors.price}
        </p>}

      {/* Add-ons Upsells */}
      <h3 className={styles.addonsSectionTitle}>{tr("m1090")}</h3>
      <p className={styles.addonsSectionDesc}>{tr("m1091")}</p>

      <div className={styles.addonsGrid}>
        {addons.map((addon, idx) => <div key={addon.id || addon.key || idx} className={`${styles.addonCard} ${styles.active}`}>
            <div className={styles.addonContent}>
              <input type="text" className={styles.inputTitle} placeholder={tr("m1058")} aria-label={tr("m1059", {
            p0: idx + 1
          })} value={addon.name} onChange={e => updateAddon(idx, 'name', e.target.value)} />
              <textarea className={styles.textareaDesc} placeholder={tr("m1060")} aria-label={tr("m1061", {
            p0: idx + 1
          })} value={addon.desc} onChange={e => updateAddon(idx, 'desc', e.target.value)} />
              <div className={styles.addonPriceRow}>
                <input type="number" className={styles.addonPriceInput} aria-label={tr("m1062", {
              p0: idx + 1
            })} value={addon.price ?? 0} step={50000} min={0} onChange={e => updateAddon(idx, 'price', Number(e.target.value))} />
                <span className={styles.currency}>{tr("m1092")}</span>
                <button type="button" className={styles.addonRemove} onClick={() => removeAddon(idx)} aria-label={tr("m1063", {
              p0: idx + 1
            })}>
                  <Trash2 size={14} aria-hidden="true" />{tr("m1093")}</button>
              </div>
            </div>
          </div>)}
        <button type="button" className={styles.addonAdd} onClick={addAddon}>
          <Plus size={16} aria-hidden="true" />{tr("m1094")}</button>
      </div>
      {addons.length === 0 && <p className={styles.addonsSectionDesc}>{tr("m1095")}</p>}
      {errors.addons && <p role="alert" style={{
      fontSize: '0.75rem',
      color: '#ef4444',
      marginTop: '0.75rem'
    }}>
          {errors.addons}
        </p>}
    </div>;
}