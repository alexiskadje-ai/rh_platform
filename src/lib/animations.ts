/** Transitions réutilisées (formulaires, panneaux conditionnels). */

export const collapseMotion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
} as const;
