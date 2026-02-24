import { createCrudRoutes } from '@/lib/crud';
export const { GET, POST } = createCrudRoutes('partners', ['name']);
