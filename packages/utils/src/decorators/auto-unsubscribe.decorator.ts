import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

/**
 * Automatically unsubscribes from RxJS subscriptions when the component is destroyed.
 *
 * This decorator intercepts the ngOnDestroy lifecycle hook and automatically unsubscribes
 * from any properties that are RxJS Subscriptions or have an 'unsubscribe' method.
 *
 * @returns Class decorator that adds auto-unsubscribe functionality.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-example',
 *   template: '...'
 * })
 * @AutoUnsubscribe()
 * export class ExampleComponent implements OnDestroy {
 *   private subscription$ = new Subscription();
 *   private data$ = this.service.getData().subscribe();
 *
 *   ngOnDestroy(): void {
 *     // Your cleanup code here (optional)
 *     // Subscriptions will be auto-unsubscribed
 *   }
 * }
 * ```
 *
 * @public
 */
export function AutoUnsubscribe(): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function (constructor: Function & { prototype: { ngOnDestroy?: () => void } }) {
    const original = constructor.prototype.ngOnDestroy;

    constructor.prototype.ngOnDestroy = function (this: OnDestroy & Record<string, unknown>) {
      // Unsubscribe from all subscription properties
      for (const prop in this) {
        if (Object.prototype.hasOwnProperty.call(this, prop)) {
          const property = this[prop];

          if (property && typeof property === 'object') {
            // Check if it's a Subscription
            if (property instanceof Subscription) {
              property.unsubscribe();
            }
            // Check if it has an unsubscribe method
            else if (typeof (property as { unsubscribe?: () => void }).unsubscribe === 'function') {
              (property as { unsubscribe: () => void }).unsubscribe();
            }
          }
        }
      }

      // Call the original ngOnDestroy if it exists
      if (original && typeof original === 'function') {
        original.apply(this);
      }
    };
  };
}
