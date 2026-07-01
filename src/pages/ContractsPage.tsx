import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import type { ContractRegistryItem } from '../types';

export function ContractsPage() {
  const [items, setItems] = useState<ContractRegistryItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
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
    loadContracts().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить реестр договоров'));
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
      setSuccess('Договор добавлен в реестр. Теперь пользователь сможет зарегистрироваться по этому номеру договора.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить договор');
    } finally {
      setLoading(false);
    }
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
      setSuccess(item.isActive ? 'Договор отключён для регистрации.' : 'Договор снова доступен для регистрации.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить статус договора');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Реестр договоров"
        subtitle="Пользовательская регистрация теперь проверяет договор по этому реестру. Случайный номер договора больше не создаёт аккаунт."
      />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <div className="card-header">
          <h3>Добавить договор</h3>
          <p className="muted">Телефон можно указать, если договор заранее привязан к конкретному номеру. Тогда регистрация с другим телефоном будет отклонена.</p>
        </div>
        <form className="form-grid" onSubmit={handleCreate}>
          <div className="field">
            <label>Номер договора</label>
            <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="Например, 234524" required />
          </div>
          <div className="field">
            <label>Адрес</label>
            <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Полный адрес" required />
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
              {loading ? 'Добавляем...' : 'Добавить договор'}
            </button>
          </div>
        </form>
      </div>

      {!items.length ? (
        <EmptyState title="Реестр пуст" subtitle="Добавьте договоры, чтобы пользователи могли регистрироваться только по реальным данным." />
      ) : (
        <div className="card">
          <div className="table-toolbar">
            <p>Всего договоров: {items.length}</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Договор</th>
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
