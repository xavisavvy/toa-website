import { ComponentType, SVGProps } from 'react';

interface AccessibleIconProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label?: string;
  className?: string;
}

/**
 * Wrapper for react-icons to handle accessibility properly.
 * - If label is provided, icon is accessible with that label
 * - If label is not provided, icon is decorative (aria-hidden)
 * 
 * Note: react-icons automatically add role="img", so we need to wrap
 * and override accessibility attributes properly.
 */
export function AccessibleIcon({ icon: Icon, label, className }: AccessibleIconProps) {
  if (label) {
    // Icon is meaningful - wrap with label
    return (
      <span role="img" aria-label={label} className="inline-flex">
        <Icon className={className} aria-hidden="true" />
      </span>
    );
  }
  
  // Icon is decorative - mark as presentation
  return (
    <span role="presentation" aria-hidden="true" className="inline-flex">
      <Icon className={className} aria-hidden="true" />
    </span>
  );
}

