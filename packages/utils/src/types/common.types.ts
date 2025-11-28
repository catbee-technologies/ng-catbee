// ============================================================================
// NULLABLE & OPTIONAL TYPES
// ============================================================================

/**
 * A type representing a value that can be `null` or `undefined`.
 */
export type Nullable<T> = T | null | undefined;

/**
 * A type representing a string that can also be null or undefined.
 */
export type NullableString = string | null | undefined;

/**
 * A type representing a value that may or may not be present.
 */
export type Optional<T> = T | undefined;

/**
 * A type representing a value that can be null.
 */
export type Maybe<T> = T | null;

/**
 * Remove null and undefined from T.
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

// ============================================================================
// DEEP UTILITY TYPES
// ============================================================================

/**
 * A type that makes all properties of `T` deeply optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * A type that makes all properties of `T` readonly, recursively.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Makes all properties of T required recursively.
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Makes all properties of T mutable recursively (removes readonly).
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

/**
 * A type that makes all properties of T mutable (removes readonly).
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Makes all properties of an object writable (removes readonly).
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };

// ============================================================================
// PICK & OMIT VARIANTS
// ============================================================================

/**
 * A type representing a partial pick from `T` (like Partial + Pick combined)
 */
export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

/**
 * Picks properties from T that are of type U.
 */
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Omits properties from T that are of type U.
 */
export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/**
 * Makes specific keys K of type T optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specific keys K of type T required.
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Creates a type with all properties of T except those with types assignable to U.
 */
export type Without<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/**
 * Pick only the keys from T that are also in K.
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>;

/**
 * Omit keys from T that are in K, ensuring K are valid keys.
 */
export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// ============================================================================
// FUNCTION TYPES
// ============================================================================

/**
 * A type representing a function that returns `R` and optionally receives arguments `A`.
 */
export type Func<A extends unknown[] = unknown[], R = unknown> = (...args: A) => R;

/**
 * A type representing any function.
 */
export type AnyFunction = (...args: unknown[]) => unknown;

/**
 * A type representing a constructor function.
 */
export type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * A type representing an abstract constructor.
 */
export type AbstractConstructor<T = object> = abstract new (...args: unknown[]) => T;

/**
 * Extract the parameters from a function type.
 */
export type Parameters<T extends (...args: unknown[]) => unknown> = T extends (...args: infer P) => unknown ? P : never;

/**
 * Extract the return type from a function type.
 */
export type ReturnType<T extends (...args: unknown[]) => unknown> = T extends (...args: unknown[]) => infer R
  ? R
  : unknown;

/**
 * A function that can be called with no arguments.
 */
export type NoArgFunction<R = void> = () => R;

/**
 * A predicate function type.
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * A comparator function type for sorting.
 */
export type Comparator<T> = (a: T, b: T) => number;

// ============================================================================
// PROMISE & ASYNC TYPES
// ============================================================================

/**
 * A type representing a promise or a plain value.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Recursively unwraps Promise types to get their resolved value type.
 */
export type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

/**
 * A type representing an async function.
 */
export type AsyncFunction<A extends unknown[] = unknown[], R = unknown> = (...args: A) => Promise<R>;

// ============================================================================
// ARRAY & COLLECTION TYPES
// ============================================================================

/**
 * A type representing a non-empty array of T.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Get the type of array elements.
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : T extends readonly (infer U)[] ? U : never;

/**
 * A tuple of exactly N elements of type T.
 */
export type Tuple<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

/**
 * Get the first element type of a tuple.
 */
export type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;

/**
 * Get the last element type of a tuple.
 */
export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

/**
 * A readonly array type.
 */
export type ReadonlyArray<T> = readonly T[];

// ============================================================================
// OBJECT & RECORD TYPES
// ============================================================================

/**
 * A type representing a record with string keys and values of type `T`.
 */
export type StringKeyedRecord<T> = Record<string, T>;

/**
 * A record type with optional keys.
 */
export type RecordOptional<K extends string | number | symbol, T> = Partial<Record<K, T>>;

/**
 * A type representing the union of all property values of T.
 */
export type ValueOf<T> = T[keyof T];

/**
 * A type that gets the keys of T whose values are assignable to U.
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Extract string keys from an object type.
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Extract number keys from an object type.
 */
export type NumberKeys<T> = Extract<keyof T, number>;

/**
 * Extract symbol keys from an object type.
 */
export type SymbolKeys<T> = Extract<keyof T, symbol>;

/**
 * Get the values of specific keys from an object.
 */
export type ValuesOf<T, K extends keyof T> = T[K];

/**
 * A plain object type.
 */
export type PlainObject<T = unknown> = Record<string, T>;

/**
 * An empty object type.
 */
export type EmptyObject = Record<string, never>;

// ============================================================================
// CONDITIONAL & LOGIC TYPES
// ============================================================================

/**
 * Require at least one of the keys in K to be present in T.
 */
export type RequireAtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]-?: T[P] } & Partial<Omit<T, K>>
  : never;

/**
 * Require exactly one of the keys in K to be present in T.
 */
export type RequireExactlyOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]-?: T[P] } & Partial<Record<Exclude<K, K>, never>> & Omit<T, K>
  : never;

/**
 * Make all keys in K mutually exclusive.
 */
export type MutuallyExclusive<T, K extends keyof T> = {
  [P in K]: { [Q in P]: T[Q] } & Partial<Record<Exclude<K, P>, never>>;
}[K] &
  Omit<T, K>;

/**
 * Checks if two types are exactly equal.
 * Returns true or false as type.
 */
export type IsEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

/**
 * Check if type T extends type U.
 */
export type Extends<T, U> = T extends U ? true : false;

/**
 * A type that represents a configurable toggle.
 * Can be `true`, `false`, or a custom configuration object `T`.
 */
export type ToggleConfig<T> = boolean | T;

/**
 * Conditional type that returns T if condition C is true, otherwise returns F.
 */
export type If<C extends boolean, T, F> = C extends true ? T : F;

/**
 * Returns T if it's not never, otherwise returns F.
 */
export type IfNotNever<T, F = never> = [T] extends [never] ? F : T;

// ============================================================================
// UNION & INTERSECTION TYPES
// ============================================================================

/**
 * A type that converts a union of types into an intersection.
 */
export type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never;

/**
 * Convert a union type to a tuple type.
 */
export type UnionToTuple<T> =
  UnionToIntersection<T extends unknown ? (t: T) => T : never> extends (_: unknown) => infer W
    ? [...UnionToTuple<Exclude<T, W>>, W]
    : [];

/**
 * Exclude members from union U that are assignable to type E.
 */
export type Exclude<U, E> = U extends E ? never : U;

/**
 * Extract from union U those types that are assignable to type E.
 */
export type Extract<U, E> = U extends E ? U : never;

/**
 * Get the last type in a union.
 */
export type LastInUnion<U> =
  UnionToIntersection<U extends unknown ? (x: U) => void : never> extends (x: infer L) => void ? L : never;

// ============================================================================
// PRIMITIVE & BASIC TYPES
// ============================================================================

/**
 * Primitive types in TypeScript.
 */
export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Non-primitive types (objects, arrays, functions).
 */
export type NonPrimitive = object | unknown[] | ((...args: unknown[]) => unknown);

/**
 * JSON-compatible primitive types.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * JSON-compatible value types.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * JSON-compatible object type.
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * JSON-compatible array type.
 */
export type JsonArray = JsonValue[];

/**
 * A type that deeply stringifies all properties of T or makes them null.
 */
export type DeepStringifyOrNull<T> = T extends string | number | boolean | bigint | symbol | null | undefined
  ? string | null
  : T extends (infer U)[]
    ? DeepStringifyOrNull<U>[]
    : T extends object
      ? { [K in keyof T]: DeepStringifyOrNull<T[K]> }
      : string | null;

/**
 * Falsy values in JavaScript.
 */
export type Falsy = false | 0 | '' | null | undefined;

/**
 * Any value except falsy values.
 */
export type Truthy<T> = Exclude<T, Falsy>;

// ============================================================================
// CLASS & INSTANCE TYPES
// ============================================================================

/**
 * Get the instance type from a constructor.
 */
export type InstanceType<T extends abstract new (...args: unknown[]) => unknown> = T extends abstract new (
  ...args: unknown[]
) => infer R
  ? R
  : never;

/**
 * Abstract class type.
 */
export type AbstractClass<T = unknown> = abstract new (...args: unknown[]) => T;

/**
 * Concrete class type.
 */
export type ConcreteClass<T = unknown> = new (...args: unknown[]) => T;

/**
 * Mixin constructor type.
 */
export type MixinConstructor<T = object> = new (...args: unknown[]) => T;

// ============================================================================
// BRANDED & OPAQUE TYPES
// ============================================================================

/**
 * Create a branded/nominal type.
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Create an opaque type.
 */
export type Opaque<T, K> = T & { readonly __opaque__: K };

/**
 * A unique symbol brand.
 */
export type UniqueBrand<T> = T & { readonly __brand__: unique symbol };

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Flatten nested object types into a single level.
 */
export type Flatten<T> = T extends object ? { [K in keyof T]: T[K] } : T;

/**
 * Simplify a complex type for better readability in IDE.
 * For non-object types, returns T as-is.
 */
export type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T;

/**
 * Merge two types, with properties from B overriding those in A.
 */
export type Merge<A, B> = Simplify<Omit<A, keyof B> & B>;

/**
 * Override properties in T with properties from U.
 */
export type Override<T, U> = Omit<T, keyof U> & U;

/**
 * Make a type immutable (deeply readonly).
 */
export type Immutable<T> = DeepReadonly<T>;

/**
 * Get the keys that are required in T.
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Get the keys that are optional in T.
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Get only the required properties from T.
 */
export type RequiredProperties<T> = Pick<T, RequiredKeys<T>>;

/**
 * Get only the optional properties from T.
 */
export type OptionalProperties<T> = Pick<T, OptionalKeys<T>>;

/**
 * Negate a boolean type.
 */
export type Not<T extends boolean> = T extends true ? false : true;

/**
 * Check if T is any type.
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check if T is unknown type.
 */
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

/**
 * Check if T is never type.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Ensure a value is of type T.
 */
export type Ensure<T, U extends T> = U;

/**
 * Mark certain properties as deprecated.
 */
export type Deprecated<T, K extends keyof T> = Omit<T, K> & {
  /**
   * @deprecated
   */
  [P in K]: T[P];
};
