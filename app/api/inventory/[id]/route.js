import { createCrudByIdRoutes } from '@/lib/crud';
export const { GET, PUT, DELETE } = createCrudByIdRoutes('inventory');
