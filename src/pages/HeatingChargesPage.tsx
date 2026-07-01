import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Notice, PageHeader } from '../components/Ui';
import { exportToExcel } from '../utils/exportExcel';
import type { HeatingCalculationLine, HeatingGenerateResult, HeatingSetting } from '../types';

function defaultMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function HeatingChargesPage() {
  const [billingMonth, setBillingMonth] = useState(defaultMonth());
  const [tariffPerUnit, setTariffPerUnit] = useState('5');
  const [normPerSquareMeter, setNormPerSquareMeter] = useState('0.03');
  const [seasonCoefficient, setSeasonCoefficient] = useState('1');
  const [commonAreaCoefficient, setCommonAreaCoefficient] = useState('1');
  const [lossCoefficient, setLossCoefficient] = useState('1');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [result, setResult] = useState<HeatingGenerateResult | null>(null);
  const [lines, setLines] = useState<HeatingCalculationLine[]>([]);

  async function loadSetting(month: string) {
    try {
      const data = await apiRequest<HeatingSetting>(`/admin/heating-settings/${month}`);
      setTariffPerUnit(String(data.tariffPerUnit));
      setNormPerSquareMeter(String(data.normPerSquareMeter));
      setSeasonCoefficient(String(data.seasonCoefficient));
      setCommonAreaCoefficient(String(data.commonAreaCoefficient));
      setLossCoefficient(String(data.lossCoefficient));
    } catch {
      // нормально, если настроек ещё нет
    }
  }

  async function loadLines(month: string) {
    try {
      const data = await apiRequest<HeatingCalculationLine[]>(`/admin/heating-calculations/${month}`);
      setLines(data);
    } catch {
      setLines([]);
    }
  }

  useEffect(() => {
    loadSetting(billingMonth);
    loadLines(billingMonth);
  }, [billingMonth]);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();

    try {
      setLoadingSave(true);
      setError('');
      setSuccess('');

      await apiRequest('/admin/heating-settings', {
        method: 'POST',
        body: JSON.stringify({
          effectiveFromMonth: billingMonth,
          tariffPerUnit: Number(tariffPerUnit),
          normPerSquareMeter: Number(normPerSquareMeter),
          seasonCoefficient: Number(seasonCoefficient),
          commonAreaCoefficient: Number(commonAreaCoefficient),
          lossCoefficient: Number(lossCoefficient),
        }),
      });

      setSuccess('Настройки отопления сохранены.');
      await loadSetting(billingMonth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения настроек');
    } finally {
      setLoadingSave(false);
    }
  }

  async function generateCharges() {
    try {
      setLoadingGenerate(true);
      setError('');
      setSuccess('');
      setResult(null);

      const data = await apiRequest<HeatingGenerateResult>('/admin/payments/generate-heating', {
        method: 'POST',
        body: JSON.stringify({
          billingMonth,
        }),
      });

      setResult(data);
      setSuccess('Начисления по отоплению сформированы.');
      await loadLines(billingMonth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка формирования начислений');
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleExport() {
    await exportToExcel(`heating_${billingMonth}`, 'Heating', lines.map((line) => ({
      Телефон: line.user.phone,
      Адрес: line.user.fullAddress,
      Договор: line.user.contractNumber,
      Метод: line.method === 'BY_METER' ? 'По счётчику' : 'По нормативу',
      Площадь: line.area,
      Предыдущее: line.previousReading ?? '',
      Текущее: line.currentReading ?? '',
      База: line.rawConsumption,
      Итоговое_потребление: line.finalConsumption,
      Тариф: line.tariffPerUnit,
      Сумма: line.amount,
      Месяц: line.billingMonth,
    })));
  }

  return (
    <div className="stack">
      <PageHeader
        title="Начисления по отоплению"
        subtitle="Настройки расчёта, формирование начислений и просмотр расчётных строк."
        actions={<div className="inline-actions"><button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))} disabled={!lines.length}>Экспорт в CSV</button></div>}
      />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <form className="form-grid" onSubmit={saveSettings}>
          <div className="field">
            <label>Расчётный месяц</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="2026-04"
              required
            />
          </div>

          <div className="field">
            <label>Тариф за единицу</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tariffPerUnit}
              onChange={(e) => setTariffPerUnit(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Норматив на 1 м²</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={normPerSquareMeter}
              onChange={(e) => setNormPerSquareMeter(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Сезонный коэффициент</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={seasonCoefficient}
              onChange={(e) => setSeasonCoefficient(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Коэффициент общедомовых расходов</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={commonAreaCoefficient}
              onChange={(e) => setCommonAreaCoefficient(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Коэффициент потерь</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={lossCoefficient}
              onChange={(e) => setLossCoefficient(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
            <button className="button primary" type="submit" disabled={loadingSave}>
              {loadingSave ? 'Сохранение...' : 'Сохранить настройки'}
            </button>

            <button
              className="button secondary"
              type="button"
              onClick={generateCharges}
              disabled={loadingGenerate}
            >
              {loadingGenerate ? 'Расчёт...' : 'Сформировать начисления'}
            </button>
          </div>
        </form>
      </div>

      {result ? (
        <div className="card">
          <h3>Результат расчёта</h3>
          <p><strong>Месяц:</strong> {result.billingMonth}</p>
          <p><strong>Создано начислений:</strong> {result.created}</p>

          {!!result.skipped.length && (
            <>
              <h4>Пропущенные счётчики</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID счётчика</th>
                      <th>Причина</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skipped.map((item, index) => (
                      <tr key={`${item.meterId}-${index}`}>
                        <td>{item.meterId}</td>
                        <td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>Расчётные строки</h3>
          <button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))} disabled={!lines.length}>Скачать CSV</button>
        </div>

        {!lines.length ? (
          <p className="muted">За выбранный месяц расчётных строк пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Телефон</th>
                  <th>Адрес</th>
                  <th>Договор</th>
                  <th>Метод</th>
                  <th>Площадь</th>
                  <th>Предыдущее</th>
                  <th>Текущее</th>
                  <th>База</th>
                  <th>Итоговое потребление</th>
                  <th>Тариф</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.user.phone}</td>
                    <td>{line.user.fullAddress}</td>
                    <td>{line.user.contractNumber}</td>
                    <td>{line.method === 'BY_METER' ? 'По счётчику' : 'По нормативу'}</td>
                    <td>{line.area}</td>
                    <td>{line.previousReading ?? '—'}</td>
                    <td>{line.currentReading ?? '—'}</td>
                    <td>{line.rawConsumption}</td>
                    <td>{line.finalConsumption}</td>
                    <td>{line.tariffPerUnit}</td>
                    <td>{line.amount} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}