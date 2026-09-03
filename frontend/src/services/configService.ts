import api from './api';

export interface SystemConfig {
  id: number;
  configKey?: string;
  configValue?: string;
  configType?: string;
  description?: string;
}

export async function getAllConfigs() {
  const res = await api.get('/admin/configs');
  return res.data as Record<string, SystemConfig[]>;
}

export async function batchUpdateConfigs(configs: Record<string, string>) {
  await api.put('/admin/configs', configs);
}