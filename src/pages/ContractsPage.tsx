import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import { exportToExcel } from '../utils/exportExcel';
import type { ContractRegistryItem } from '../types';

type AccountImportRow = {
  accountNumber: string;
  fullAddress: string;
  heatedArea?: number;
  phone?: string;
};

declare global {
  interface Window {
    XLSX?: any;
  }
}

async function loadSheetJs() {
  if (window.XLSX) return window.XLSX;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-sheetjs="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить модуль чтения Excel.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.async = true;
    script.dataset.sheetjs = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить модуль чтения Excel. Проверьте интернет.'));
    document.head.appendChild(script);
  });

  if (!window.XLSX) throw new Error('Модуль чтения Excel не найден.');
  return window.XLSX;
}

function normalizeHeader(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/ё/g, 'е');
}

function getCell(row: unknown[], index: number) {
  return String(row[index] ?? '').trim();
}

function parseAccountRows(rows: unknown[][]): AccountImportRow[] {
  const result: AccountImportRow[] = [];
  const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeHeader(cell).includes('лицев')));
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const header = headerIndex >= 0 ? rows[headerIndex].map(normalizeHeader) : [];

  const accountIndex = header.findIndex((cell) => cell.includes('лицев'));
  const addressIndex = header.findIndex((cell) => cell.includes('адрес'));
  const phoneIndex = header.findIndex((cell) => cell.includes('телефон'));
  const areaIndex = header.findIndex((cell) => cell.includes('площад'));

  for (const row of rows.slice(startIndex)) {
    const accountNumber = getCell(row, accountIndex >= 0 ? accountIndex : 0);
    const fullAddress = getCell(row, addressIndex >= 0 ? addressIndex : 3);
    const phone = phoneIndex >= 0 ? getCell(row, phoneIndex) : '';
    const heatedAreaText = areaIndex >= 0 ? getCell(row, areaIndex) : '';
    const heatedArea = Number(heatedAreaText.replace(',', '.')) || 0;

    if (!accountNumber || !fullAddress) continue;
    if (accountNumber.toLowerCase().includes('лицев')) continue;

    result.push({ accountNumber, fullAddress, phone: phone || undefined, heatedArea });
  }

  return result;
}

export function ContractsPage() {
  const [items, setItems] = useState<ContractRegistryItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [busyId, setBusyId] = useState('');

  const [contractNumber, setContractNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [heatedArea, setHeatedArea] = useState('');
  const [phone, setPhone] = useState('');

  async function loadContracts() {
    const data = await apiRequest<ContractRegistryItem[]>('/admin/contracts');
    setItems(data);
  }

  useEffect(() => {
    loadContracts().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить реестр лицевых счетов'));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await apiRequest('/admin/contracts', {
        method: 'POST',
        body: JSON.stringify({
          contractNumber: contractNumber.trim(),
          fullAddress: fullAddress.trim(),
          heatedArea: Number(heatedArea) || 0,
          phone: phone.trim() || undefined,
          isActive: true,
        }),
      });

      setContractNumber('');
      setFullAddress('');
      setHeatedArea('');
      setPhone('');
      await loadContracts();
      setSuccess('Лицевой счёт добавлен в реестр. Пользователь сможет зарегистрироваться по адресу.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить лицевой счёт');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setImporting(true);
      setError('');
      setSuccess('');

      const XLSX = await loadSheetJs();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];
      const parsed = parseAccountRows(rows);

      if (!parsed.length) {
        throw new Error('В Excel не найдены строки с лицевым счётом и адресом. Для файла 1С используются колонки A и D.');
      }

      const result = await apiRequest<{ message?: string; created: number; updated: number; skipped: number; errors?: string[] }>('/admin/contracts/import', {
        method: 'POST',
        body: JSON.stringify({ items: parsed }),
      });

      await loadContracts();
      setSuccess(`${result.message || 'Импорт завершён.'}${result.errors?.length ? ` Первые ошибки: ${result.errors.join('; ')}` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось импортировать Excel');
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    await exportToExcel('accounts_registry', 'Лицевые счета', items.map((item) => ({
      Лицевой_счет: item.contractNumber,
      Адрес: item.fullAddress,
      Телефон: item.phone || '',
      Отапливаемая_площадь_м2: item.heatedArea ?? 0,
      Статус: item.isActive ? 'Активен' : 'Отключён',
      Привязка: item.boundUserId ? 'Личный кабинет создан' : 'Свободен',
    })));
  }

  async function toggleContract(item: ContractRegistryItem) {
    try {
      setBusyId(item.id);
      setError('');
      setSuccess('');

      await apiRequest(`/admin/contracts/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      await loadContracts();
      setSuccess(item.isActive ? 'Лицевой счёт отключён для регистрации.' : 'Лицевой счёт снова доступен для регистрации.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить статус лицевого счёта');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Реестр лицевых счетов"
        subtitle="Регистрация пользователя идёт по адресу: приложение автоматически находит лицевой счёт из этого реестра."
        actions={(
          <div className="inline-actions">
            <label className="button secondary" style={{ cursor: importing ? 'not-allowed' : 'pointer' }}>
              {importing ? 'Импортируем...' : 'Импорт Excel'}
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importing} style={{ display: 'none' }} />
            </label>
            <button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))} disabled={!items.length}>
              Экспорт в Excel
            </button>
          </div>
        )}
      />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <div className="card-header">
          <h3>Добавить лицевой счёт</h3>
          <p className="muted">Телефон можно указать, если лицевой счёт заранее привязан к конкретному номеру. Тогда регистрация с другим телефоном будет отклонена.</p>
        </div>
        <form className="form-grid" onSubmit={handleCreate}>
          <div className="field">
            <label>Лицевой счёт</label>
            <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="Например, 10001" required />
          </div>
          <div className="field">
            <label>Адрес</label>
            <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Полный адрес как в Excel/1С" required />
          </div>
          <div className="field">
            <label>Отапливаемая площадь, м²</label>
            <input type="number" min="0" step="0.01" value={heatedArea} onChange={(e) => setHeatedArea(e.target.value)} placeholder="54.2" />
          </div>
          <div className="field">
            <label>Телефон, если известен</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="79990002233" />
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? 'Добавляем...' : 'Добавить лицевой счёт'}
            </button>
          </div>
        </form>
      </div>

      {!items.length ? (
        <EmptyState title="Реестр пуст" subtitle="Импортируйте Excel с лицевыми счетами или добавьте запись вручную." />
      ) : (
        <div className="card">
          <div className="table-toolbar">
            <p>Всего лицевых счетов: {items.length}</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Лицевой счёт</th>
                  <th>Адрес</th>
                  <th>Телефон</th>
                  <th>Площадь</th>
                  <th>Статус</th>
                  <th>Привязка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.contractNumber}</td>
                    <td>{item.fullAddress}</td>
                    <td>{item.phone || '—'}</td>
                    <td>{item.heatedArea ?? 0} м²</td>
                    <td>
                      <StatusBadge tone={item.isActive ? 'success' : 'danger'}>
                        {item.isActive ? 'Активен' : 'Отключён'}
                      </StatusBadge>
                    </td>
                    <td>{item.boundUserId ? 'Личный кабинет создан' : 'Свободен для регистрации'}</td>
                    <td>
                      <button className={item.isActive ? 'button danger' : 'button primary'} disabled={busyId === item.id} onClick={() => toggleContract(item)}>
                        {item.isActive ? 'Отключить' : 'Включить'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
