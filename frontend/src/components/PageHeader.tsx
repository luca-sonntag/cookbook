import React from 'react';

export interface PageHeaderProps {
  /** Main title of the page */
  title: React.ReactNode;
  /** Subtitle or description under the title */
  subtitle?: React.ReactNode;
  /** Optional icon displayed in a rounded badge on the left */
  icon?: React.ReactNode;
  /** Optional action slot on the right (e.g. buttons, menu, status) */
  action?: React.ReactNode;
  /** Extra container classes */
  className?: string;
}

/**
 * Standardized Page Header for top-level views.
 * Features an icon badge, bold title, descriptive subtitle, and optional right-aligned action slot.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center justify-between ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          {icon && (
            <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 ml-3 flex items-center gap-2">{action}</div>}
    </div>
  );
};

export default PageHeader;
