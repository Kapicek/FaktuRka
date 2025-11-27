import * as React from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@toolpad/core/PageContainer";

export enum CrudViewMode {
    LIST = "LIST",
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DETAIL = "DETAIL",
}

// Typy vezmeme přímo z PageHeaderu, ať sedí 1:1
type PageHeaderProps = React.ComponentProps<typeof PageHeader>;
type BreadcrumbType = NonNullable<PageHeaderProps["breadcrumbs"]>[number];

interface BreadcrumbsNavProps
    extends Omit<PageHeaderProps, "title" | "breadcrumbs"> {
    /** Název entity v jednotném čísle – např. "Customer" */
    entityLabel: string;
    /** Název listu – např. "Customers". Když se nevyplní, použije se entityLabel + "s" */
    listLabel?: string;
    /** Základní cesta listu – např. "/customers" */
    basePath: string;
    /** Jestli přidat na začátek breadcrumb "Home" */
    withHome?: boolean;
    /** Extra breadcrumbs navíc (např. pro složitější cesty) */
    extraBreadcrumbs?: BreadcrumbType[];
}

/**
 * Určí režim (list/create/update/detail) z aktuální URL.
 */
const getCrudViewMode = (pathname: string, basePath: string): CrudViewMode => {
    const normalizedPath = pathname.replace(/\/+$/, "");
    const normalizedBase = basePath.replace(/\/+$/, "");

    if (normalizedPath === normalizedBase || normalizedPath === "") {
        return CrudViewMode.LIST;
    }

    if (normalizedPath.includes("/new")) {
        return CrudViewMode.CREATE;
    }

    if (normalizedPath.includes("/update") || normalizedPath.includes("/edit")) {
        return CrudViewMode.UPDATE;
    }

    return CrudViewMode.DETAIL;
};

export const BreadcrumbsNav: React.FC<BreadcrumbsNavProps> = ({
    entityLabel,
    listLabel,
    basePath,
    withHome = false,
    extraBreadcrumbs,
    ...pageHeaderProps
}) => {
    const { pathname } = useLocation();

    const mode = React.useMemo(
        () => getCrudViewMode(pathname, basePath),
        [pathname, basePath]
    );

    const computedListLabel = listLabel ?? `${entityLabel}s`;

    const title = React.useMemo(() => {
        switch (mode) {
            case CrudViewMode.CREATE:
                return `Create ${entityLabel.toLowerCase()}`;
            case CrudViewMode.UPDATE:
                return `Update ${entityLabel.toLowerCase()}`;
            case CrudViewMode.DETAIL:
                return `${entityLabel} detail`;
            case CrudViewMode.LIST:
            default:
                return computedListLabel;
        }
    }, [mode, entityLabel, computedListLabel]);

    const breadcrumbs = React.useMemo(() => {
        const items: BreadcrumbType[] = [];

        if (withHome) {
            items.push({ title: "Home", path: "/" });
        }

        // List
        items.push({ title: computedListLabel, path: basePath });

        // Detailní úroveň (create, update, detail)
        if (mode !== CrudViewMode.LIST) {
            items.push({ title, path: pathname });
        }

        if (extraBreadcrumbs?.length) {
            items.push(...extraBreadcrumbs);
        }

        return items;
    }, [withHome, computedListLabel, basePath, mode, title, pathname, extraBreadcrumbs]);

    return (
        <PageHeader
            title={""}
            breadcrumbs={breadcrumbs}
            {...pageHeaderProps}
        />
    );
};
