/**
 * Unit Conversion Utility
 * Supports Weight (base: g), Volume (base: mL), and Count (base: unit) dimensions.
 */

export type Dimension = 'weight' | 'volume' | 'count'

export interface UnitDef {
  label: string
  factor: number // how many base units = 1 of this unit
  dimension: Dimension
}

export const UNIT_DEFINITIONS: Record<string, UnitDef> = {
  // Weight
  g:  { label: 'g',  factor: 1,       dimension: 'weight' },
  kg: { label: 'kg', factor: 1000,    dimension: 'weight' },
  mg: { label: 'mg', factor: 0.001,   dimension: 'weight' },

  // Volume
  mL: { label: 'mL', factor: 1,       dimension: 'volume' },
  L:  { label: 'L',  factor: 1000,    dimension: 'volume' },
  µL: { label: 'µL', factor: 0.001,   dimension: 'volume' },

  // Count
  unit:  { label: 'unit',  factor: 1,  dimension: 'count' },
  dozen: { label: 'dozen', factor: 12, dimension: 'count' },
  pack:  { label: 'pack',  factor: 1,  dimension: 'count' }, // customizable
}

/** Convert a value from `fromUnit` to the base unit of that dimension. */
export function convertToBase(value: number, fromUnit: string): number {
  const def = UNIT_DEFINITIONS[fromUnit]
  if (!def) throw new Error(`Unknown unit: ${fromUnit}`)
  return value * def.factor
}

/** Convert a value from the base unit to `toUnit`. */
export function convertFromBase(value: number, toUnit: string): number {
  const def = UNIT_DEFINITIONS[toUnit]
  if (!def) throw new Error(`Unknown unit: ${toUnit}`)
  return value / def.factor
}

/**
 * Return all unit keys that are compatible with a given base unit
 * (i.e. belong to the same dimension).
 */
export function getCompatibleUnits(baseUnit: string): string[] {
  const def = UNIT_DEFINITIONS[baseUnit]
  if (!def) return [baseUnit]
  return Object.entries(UNIT_DEFINITIONS)
    .filter(([, d]) => d.dimension === def.dimension)
    .map(([key]) => key)
}

/**
 * Format a base-unit value as a human-readable string in the requested display unit.
 * e.g. formatQuantity(1500, 'kg') → '1.5 kg'
 */
export function formatQuantity(baseValue: number, displayUnit: string): string {
  const converted = convertFromBase(baseValue, displayUnit)
  // Use up to 6 significant figures, strip trailing zeros
  const formatted = parseFloat(converted.toPrecision(6)).toString()
  return `${formatted} ${displayUnit}`
}

/**
 * Price per display unit derived from the base price.
 * e.g. priceInUnit(0.05, 'kg') → 50  (₹0.05/g × 1000g/kg)
 */
export function priceInUnit(basePricePerUnit: number, displayUnit: string): number {
  const def = UNIT_DEFINITIONS[displayUnit]
  if (!def) return basePricePerUnit
  return basePricePerUnit * def.factor
}

/** Get the dimension for a unit string */
export function getDimension(unit: string): Dimension | undefined {
  return UNIT_DEFINITIONS[unit]?.dimension
}

/** Human-readable label for a unit */
export function unitLabel(unit: string): string {
  return UNIT_DEFINITIONS[unit]?.label ?? unit
}
