import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Interface for components that can have unsaved changes.
 *
 * @publicApi
 */
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

/**
 * Configuration for unsaved changes guard.
 *
 * @publicApi
 */
export interface UnsavedChangesGuardConfig {
  /** Custom confirmation message */
  message?: string;
  /** Whether to show browser confirmation dialog (default: true) */
  showDialog?: boolean;
}

/**
 * Creates a functional guard that prevents navigation away from a route with unsaved changes.
 *
 * This guard prompts users before leaving a page with unsaved changes,
 * preventing accidental data loss.
 *
 * @param config - Configuration for the unsaved changes guard
 * @returns CanDeactivateFn guard function
 *
 * @example
 * ```typescript
 * // form.component.ts
 * export class FormComponent implements CanComponentDeactivate {
 *   hasUnsavedChanges = false;
 *
 *   canDeactivate(): boolean {
 *     return !this.hasUnsavedChanges;
 *   }
 *
 *   onFormChange() {
 *     this.hasUnsavedChanges = true;
 *   }
 *
 *   onSave() {
 *     this.hasUnsavedChanges = false;
 *   }
 * }
 *
 * // app.routes.ts
 * import { createUnsavedChangesGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'form',
 *     component: FormComponent,
 *     canDeactivate: [createUnsavedChangesGuard({
 *       message: 'You have unsaved changes. Are you sure you want to leave?'
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createUnsavedChangesGuard(
  config: UnsavedChangesGuardConfig = {}
): CanDeactivateFn<CanComponentDeactivate> {
  const { message = 'You have unsaved changes. Do you want to leave this page?', showDialog = true } = config;

  return async (component): Promise<boolean> => {
    if (!component.canDeactivate) {
      return true;
    }

    const canDeactivateResult = component.canDeactivate();
    const canDeactivate =
      canDeactivateResult instanceof Promise || canDeactivateResult instanceof Observable
        ? await canDeactivateResult
        : canDeactivateResult;

    if (canDeactivate) {
      return true;
    }

    if (showDialog) {
      return confirm(message);
    }

    return false;
  };
}
