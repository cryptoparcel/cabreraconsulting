import { createCrudRoutes } from '@/lib/crud';
export const { GET, POST } = createCrudRoutes('billing', ['name']);
