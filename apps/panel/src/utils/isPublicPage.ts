import { publicRoutes } from '@/config/publicRoutes';

export function isPublicPage(pathname: string): boolean {
    return publicRoutes.some((route) =>
        route === '/'
            ? pathname === '/'
            : pathname.split('/')[1] === route.slice(1),
    );
}
