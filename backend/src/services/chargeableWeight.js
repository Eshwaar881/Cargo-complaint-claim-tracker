// Chargeable Weight Calculator
// IATA standard: volumetric weight = (L x W x H in cm) / 6000, per piece
// Chargeable weight = max(actual gross weight, total volumetric weight)
// This is the explicit fallback module if Firebase is unavailable, and is
// also used directly by the complaint workflow to validate billing-issue
// and damage-claim cases against the shipment's real chargeable weight.

const VOLUMETRIC_DIVISOR = 6000; // IATA air freight standard (cm-based)

/**
 * @param {Object} dims
 * @param {number} dims.lengthCm
 * @param {number} dims.widthCm
 * @param {number} dims.heightCm
 * @param {number} dims.actualWeightKg
 * @param {number} [dims.pieces=1]
 * @returns {{volumetricWeightKg: number, actualWeightKg: number, chargeableWeightKg: number, basis: 'ACTUAL'|'VOLUMETRIC'}}
 */
export function calculateChargeableWeight({ lengthCm, widthCm, heightCm, actualWeightKg, pieces = 1 }) {
  if ([lengthCm, widthCm, heightCm, actualWeightKg].some((v) => typeof v !== 'number' || v <= 0)) {
    throw new Error('All dimensions and actual weight must be positive numbers');
  }

  const volumetricWeightPerPiece = (lengthCm * widthCm * heightCm) / VOLUMETRIC_DIVISOR;
  const volumetricWeightKg = roundTo(volumetricWeightPerPiece * pieces, 2);
  const totalActualWeightKg = roundTo(actualWeightKg, 2);

  const chargeableWeightKg = Math.max(volumetricWeightKg, totalActualWeightKg);
  const basis = chargeableWeightKg === volumetricWeightKg ? 'VOLUMETRIC' : 'ACTUAL';

  return {
    volumetricWeightKg,
    actualWeightKg: totalActualWeightKg,
    chargeableWeightKg: roundTo(chargeableWeightKg, 2),
    basis,
  };
}

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
