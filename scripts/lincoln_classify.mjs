import {
  catPath, rootOf, splitSpentOn, dedupKey, parseVehicleDescription,
  USER_NAME_MAP, USER_UID_MAP, PAYMENT_TYPE_MAPPING, getPlainCategory
} from './lincoln_shared.mjs';

// ---------------------------------------------------------------------------
// Fleet vehicle name detection.
//
// Lincoln.db's category tree mixes properly-nested vehicle categories
// (Transportation > Gasoline > "Blue Van") with several duplicate top-level
// "shortcut" trees (e.g. root category 213 is just named "Rav4") and with
// free-text Notes that are often the *only* place a vehicle is actually named
// (e.g. "Front and rear brake pads for 2004 Sienna, Blue van."). None of these
// signals alone is reliable, so detection scans category path + notes text
// together and a NON-fleet mention (a relative's car, a rental) always wins
// over a fleet match, since several "car" categories turned out to contain
// repairs for cars this household doesn't own.
// ---------------------------------------------------------------------------

const NON_FLEET = 'NON_FLEET';
const AMBIGUOUS_SIENNA = 'AMBIGUOUS_SIENNA';

const NON_FLEET_PATTERNS = [/honda fit/i, /lexus/i, /rx\s*300/i, /\bkia\b/i, /spectra/i];

function detectVehicleMention(text) {
  if (NON_FLEET_PATTERNS.some(p => p.test(text))) return NON_FLEET;
  if (/beige/i.test(text) && /(van|sienna)/i.test(text)) return 'Beige Van';
  if (/blue/i.test(text) && /(van|sienna)/i.test(text)) return 'Blue Van';
  if (/tacoma/i.test(text) || /white elephant/i.test(text)) return 'White Elephant';
  if (/rav\s*4/i.test(text)) return 'Rav4';
  if (/sienna/i.test(text)) return AMBIGUOUS_SIENNA;
  return null;
}

export function detectVehicleName(pathParts, notes) {
  const haystack = `${pathParts.join(' ')} ${notes || ''}`;
  return detectVehicleMention(haystack);
}

// Notes-content overrides that force exclusion from CarTracker even though
// the category itself looks car-related (a drone FAA registration and a
// personal international driving permit both got filed under car categories).
const NON_CAR_NOTE_OVERRIDE = [/drone/i, /international driving permit/i, /\bfaa\b/i];

const CAR_BOUNDARY_LEAF_NAMES = new Set([
  'transportation', 'gas', 'gasoline', 'parking fees', 'public transportation',
  'ride sharing (uber, lyft)', 'tolls', 'smartrip', 'moving accessories',
  'car payment / lease payments', 'citation', 'ticket', 'roadside assistance (aaa)',
  'license'
]);

const CAR_ALLOWED_LEAF_NAMES = new Set([
  'oil change', 'maintenance / repairs', 'maintenance/repair', 'repair/maintenance',
  'tools', 'registration', 'decal', 'car inspection', 'inspection', 'safety',
  'emission inspection', 'car insurance', 'personal property taxes', 'tires'
]);

const CAR_SHORTCUT_ROOTS = new Set([213, 345]); // standalone "Rav4" / "Maintenance/Repair" trees

function mapServiceCategory(notes) {
  const n = (notes || '').toLowerCase();
  if (/brake/.test(n)) return 'Brakes';
  if (/tire/.test(n)) return 'Tires & Alignment';
  if (/timing belt|water pump|engine|transmission|fuel leak/.test(n)) return 'Engine & Transmission';
  if (/shock|strut|suspension|steering/.test(n)) return 'Suspension & Steering';
  if (/refrigerant|air condition|\bac\b/.test(n)) return 'HVAC / AC';
  if (/battery|electrical|ignition coil/.test(n)) return 'Battery & Electrical';
  if (/emission/.test(n)) return 'Emission Inspection';
  if (/safety/.test(n)) return 'Safety Inspection';
  if (/inspection/.test(n)) return 'Inspection & Registration';
  if (/registration/.test(n)) return 'Registration';
  if (/insurance/.test(n)) return 'Insurance';
  if (/tax/.test(n)) return 'Property Tax';
  if (/oil change|motor oil/.test(n)) return 'Oil Change';
  if (/detail|dent|paint|mirror|headlight|door handle|cabin filter/.test(n)) return 'Detailing & Body';
  return 'General Repair';
}

function serviceTypeFor(category) {
  if (category === 'Registration' || category === 'Insurance' || category === 'Property Tax') return 'Fee / Tax';
  if (category.includes('Inspection')) return 'Inspection';
  if (category === 'Oil Change') return 'Maintenance';
  if (category === 'Fuel Log') return 'Other Expense';
  return 'Repair';
}

// ---------------------------------------------------------------------------
// Home name detection (address-hunting through the category path).
// ---------------------------------------------------------------------------

const HOME_SHORTCUT_SELF_NAMED_ROOTS = new Set([266, 151]); // "Albemarle", "Silenttree"
const HOME_SHORTCUT_NO_NAME_ROOTS = new Set([282]); // "Home Improvements" (no address given)
const HOME_SHORTCUT_CHILD_NAMED_ROOTS = new Set([259, 166]); // "Rental" > x, "Home repairs" > x

const HOME_GENERIC_PATH_WORDS = new Set([
  'housing', 'home repairs / maintenance', 'home repairs', 'home improvement',
  'home improvements', 'improvement', 'improvements', 'repairs', 'repair',
  'property taxes', 'personal property taxes', 'homeowners insurance',
  'property insurance', 'rental', 'home', 'appliances'
]);

function huntHomeName(pathParts) {
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const seg = pathParts[i].trim();
    if (seg && !HOME_GENERIC_PATH_WORDS.has(seg.toLowerCase())) {
      // normalize the "Silentree"/"Silenttree" typo variants to one nickname
      if (/^silent?ree$/i.test(seg.replace(/\s+/g, ''))) return 'Silenttree';
      return seg;
    }
  }
  return null;
}

// Several address names only ever show up in free-text Notes, not the
// category itself (e.g. "Philadelphia Insurance - 3701 property insurance",
// "Travelers - for 2221 McLean Park Rd") — check for these before falling
// back to a time-based guess.
const KNOWN_HOME_NAMES = ['Albemarle', 'Ballston', 'Cordoba', 'Silenttree', 'Silentree', '2221', '1119', '3701'];

function huntHomeNameFromNotes(notes) {
  if (!notes) return null;
  for (const name of KNOWN_HOME_NAMES) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(notes)) return /silent/i.test(name) ? 'Silenttree' : name;
  }
  return null;
}

function pathHasHomeKeyword(pathParts) {
  return pathParts.some(p => /repair|improvement|tax|insurance|rental/i.test(p));
}

function mapMaintenanceCategory(notes) {
  const n = (notes || '').toLowerCase();
  if (/remodel|renovat/.test(n)) return 'Renovation';
  if (/\btax\b/.test(n)) return 'Property Tax';
  if (/insurance/.test(n)) return 'Homeowners Insurance';
  if (/mulch|lawn|orchid|garden|pond|lotus|plant|hedge|tree/.test(n)) return 'Landscaping & Lawn';
  if (/hvac|furnace/.test(n)) return 'HVAC';
  if (/plumb|faucet|toilet|shower|sink|drain/.test(n)) return 'Plumbing';
  if (/electric|outlet|wiring|gfci|floodlight|camera/.test(n)) return 'Electrical';
  if (/\broof/.test(n)) return 'Roofing';
  if (/appliance|dryer|washer|refrigerator/.test(n)) return 'Appliances';
  if (/pest|termite|\bant\b/.test(n)) return 'Pest Control';
  if (/\bpaint/.test(n)) return 'Painting';
  if (/floor|tile/.test(n)) return 'Flooring';
  if (/window|\bdoor\b/.test(n)) return 'Windows & Doors';
  if (/inspection/.test(n)) return 'Inspection';
  return 'General Repair';
}

function maintenanceTypeFor(category) {
  if (category === 'Property Tax' || category === 'Homeowners Insurance') return 'Expense';
  if (category === 'Renovation') return 'Upgrade';
  if (category === 'Inspection') return 'Inspection';
  return 'Repair';
}

// ---------------------------------------------------------------------------
// Vehicle matching against existing CarTracker vehicles / mileage estimation
// ---------------------------------------------------------------------------

const FLEET_DESCRIPTIONS = {
  'Beige Van': null, 'Blue Van': null, 'White Elephant': null, 'Rav4': null
};

export function buildFleetDescriptions(lincolnVehicles) {
  for (const v of lincolnVehicles.values()) {
    const name = (v.Name || '').trim();
    if (name in FLEET_DESCRIPTIONS) FLEET_DESCRIPTIONS[name] = parseVehicleDescription(v.Description);
  }
  return FLEET_DESCRIPTIONS;
}

const MODEL_KEYWORD = { 'Beige Van': 'sienna', 'Blue Van': 'sienna', 'White Elephant': 'tacoma', 'Rav4': 'rav4' };
const TRIM_HINT = { 'Beige Van': 'lx', 'Blue Van': 'ex' };

// Kept for any external/simple lookup needs; resolveVehicleMatches below does
// its own grouped resolution rather than calling this per fleet name, since
// sibling fleet vehicles sharing a model keyword (both Siennas) must be
// resolved together, not independently.
export function matchExistingVehicle(fleetName, fleetDescriptions, existingVehicles) {
  const desc = fleetDescriptions[fleetName];
  if (!desc) return null;
  const keyword = MODEL_KEYWORD[fleetName];
  const trimHint = TRIM_HINT[fleetName];
  const candidates = existingVehicles.filter(v =>
    Number(v.year) === desc.year &&
    String(v.make || '').toLowerCase() === desc.make.toLowerCase() &&
    String(v.model || '').toLowerCase().includes(keyword)
  );
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && trimHint) {
    const trimmed = candidates.filter(v => String(v.model || '').toLowerCase().includes(trimHint));
    if (trimmed.length === 1) return trimmed[0];
  }
  return null; // ambiguous or not found -> caller falls back to plain transaction
}

// Two fleet vehicles can legitimately parse to the same year/make/model (both
// Siennas) and therefore contend for the same existing CarTracker doc(s).
// Resolution runs per model-keyword group (e.g. {Beige Van, Blue Van} share
// "sienna") in three passes: (1) claim by exact trim substring ("LX"/"EX")
// when it uniquely identifies a doc, (2) claim whatever's left by
// elimination once only one name and one candidate remain, (3) if a single
// doc is still contested by multiple names (e.g. only one generic "Sienna"
// doc exists for two vans), the fleet vehicle with the more recent fill-up
// history keeps it and the other is reported as collided so the caller can
// create a dedicated doc for it instead of splicing two odometer histories
// together.
export function resolveVehicleMatches(lincoln, existingVehicles) {
  const fleetDescriptions = buildFleetDescriptions(lincoln.vehicles);
  const lincolnVehicleNameById = new Map([...lincoln.vehicles.values()].map(v => [v.Id, (v.Name || '').trim()]));
  const fillupTimeline = buildFillupTimeline(lincoln.debits, lincoln.fillupsByDebitId);

  const lastFillupTimeByName = new Map();
  for (const f of fillupTimeline) {
    const name = lincolnVehicleNameById.get(f.vehicleId);
    if (!lastFillupTimeByName.has(name) || f.time > lastFillupTimeByName.get(name)) lastFillupTimeByName.set(name, f.time);
  }

  const fleetNames = Object.keys(fleetDescriptions);
  const groups = new Map();
  for (const name of fleetNames) {
    const kw = MODEL_KEYWORD[name];
    if (!groups.has(kw)) groups.set(kw, []);
    groups.get(kw).push(name);
  }

  const matches = new Map();
  const collided = new Set();

  for (const names of groups.values()) {
    const desc0 = fleetDescriptions[names[0]];
    let pool = desc0 ? existingVehicles.filter(v =>
      Number(v.year) === desc0.year &&
      String(v.make || '').toLowerCase() === desc0.make.toLowerCase() &&
      String(v.model || '').toLowerCase().includes(MODEL_KEYWORD[names[0]])
    ) : [];

    const claimed = new Map();

    // pass 1: exact trim match
    for (const name of names) {
      const trimHint = TRIM_HINT[name];
      if (!trimHint) continue;
      const hits = pool.filter(v => String(v.model || '').toLowerCase().includes(trimHint));
      if (hits.length === 1) { claimed.set(name, hits[0]); pool = pool.filter(v => v.id !== hits[0].id); }
    }

    // pass 2: elimination — exactly one name and one candidate left
    let remaining = names.filter(n => !claimed.has(n));
    if (remaining.length === 1 && pool.length === 1) {
      claimed.set(remaining[0], pool[0]);
      pool = [];
    }

    // pass 3: a single doc still contested by multiple names -> time-based tie-break
    remaining = names.filter(n => !claimed.has(n));
    if (remaining.length > 1 && pool.length === 1) {
      const winner = remaining.reduce((a, b) => (lastFillupTimeByName.get(a) || 0) >= (lastFillupTimeByName.get(b) || 0) ? a : b);
      claimed.set(winner, pool[0]);
    }

    for (const name of names) {
      if (claimed.has(name)) matches.set(name, claimed.get(name));
      else { matches.set(name, null); if (names.length > 1) collided.add(name); }
    }
  }

  return { matches, collided, fleetDescriptions };
}

export function buildFillupTimeline(debits, fillupsByDebitId) {
  const byId = new Map(debits.map(d => [d.DebitId, d]));
  const timeline = [];
  for (const [debitId, fillup] of fillupsByDebitId.entries()) {
    const debit = byId.get(debitId);
    if (!debit) continue;
    timeline.push({ time: new Date(debit.SpentOn.replace(' ', 'T')).getTime(), vehicleId: fillup.VehicleId, odometer: fillup.Odometer, debitId });
  }
  timeline.sort((a, b) => a.time - b.time);
  return timeline;
}

export function nearestFillup(timeline, targetTime, vehicleId = null) {
  const pool = vehicleId ? timeline.filter(f => f.vehicleId === vehicleId) : timeline;
  if (pool.length === 0) return null;
  let best = pool[0];
  let bestDiff = Math.abs(pool[0].time - targetTime);
  for (const f of pool) {
    const diff = Math.abs(f.time - targetTime);
    if (diff < bestDiff) { best = f; bestDiff = diff; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Action resolution: a classified debit may need a brand-new transaction +
// companion doc, just a companion doc backfilled onto an already-migrated
// transaction, or nothing at all (fully migrated already).
// ---------------------------------------------------------------------------

export function companionCollectionFor(bucket) {
  if (bucket === 'fuel') return 'refuels';
  if (bucket === 'carService') return 'records';
  if (bucket === 'home') return 'homeRecords';
  return null;
}

export function determineAction(r, existingCompanionIds) {
  const collection = companionCollectionFor(r.bucket);
  if (!collection) return r.existingTxId ? 'skip' : 'create-transaction-only';
  if (!r.existingTxId) return 'create-transaction-and-companion';
  const ids = existingCompanionIds[collection] || new Set();
  return ids.has(r.existingTxId) ? 'skip' : 'backfill-companion-only';
}

// ---------------------------------------------------------------------------
// Main classification pass
// ---------------------------------------------------------------------------

export function classifyDebits(lincoln, vehicleMatches, existingTxByKey) {
  const { categories, merchants, users, fillupsByDebitId, vehicles: lincolnVehicles, debits } = lincoln;
  const lincolnVehicleNameById = new Map([...lincolnVehicles.values()].map(v => [v.Id, (v.Name || '').trim()]));
  const fillupTimeline = buildFillupTimeline(debits, fillupsByDebitId);
  const vehicleIdByName = new Map([...lincolnVehicles.values()].map(v => [(v.Name || '').trim(), v.Id]));

  const results = [];
  const unresolvedHomeIdx = [];
  const resolvedHomeTimeline = [];

  for (const d of debits) {
    const { date, time } = splitSpentOn(d.SpentOn);
    const amount = Number(d.Amount) || 0;
    const vendor = merchants.get(d.MerchantId) || 'Unknown Merchant';
    const notes = (d.Notes || '').trim();
    const key = dedupKey({ amount, date, time, vendor });
    const userFirstName = users.get(d.ExpenseUserId) || 'Ly';
    const paymentType = (PAYMENT_TYPE_MAPPING[d.PaymentTypeId] || { name: 'Credit Card' }).name;
    const time_ms = new Date(d.SpentOn.replace(' ', 'T')).getTime();

    // A debit already present as a plain transaction (from the prior
    // ExpenseTracker migration) still needs its specialized companion doc
    // backfilled if it classifies as fuel/car/home — only the transaction
    // itself must never be duplicated. `id` is the existing transaction's id
    // when there is one, so any companion doc pairs with it instead of
    // minting a new "lincoln-{DebitId}" transaction.
    const existingTxId = existingTxByKey.get(key) || null;
    const base = {
      debit: d, id: existingTxId || `lincoln-${d.DebitId}`, dedupKey: key, date, time, amount, vendor, notes,
      user: USER_NAME_MAP[userFirstName] || 'Anh Vuong',
      userUid: USER_UID_MAP[userFirstName] || 'user-ly',
      paymentType,
      existingTxId
    };

    const catId = d.ExpenseCategoryId;
    const pathParts = catPath(catId, categories);
    const leafLower = (pathParts[pathParts.length - 1] || '').toLowerCase();
    const rId = rootOf(catId, categories);
    const hasNonCarOverride = NON_CAR_NOTE_OVERRIDE.some(p => p.test(notes));

    // 1. Fuel with FillUp data (authoritative)
    const fillup = fillupsByDebitId.get(d.DebitId);
    if (fillup) {
      const fleetName = lincolnVehicleNameById.get(fillup.VehicleId);
      const existing = vehicleMatches.get(fleetName);
      if (existing) {
        results.push({
          ...base, bucket: 'fuel', vehicleFleetName: fleetName, vehicle: existing,
          gallons: fillup.Gallons, odometer: fillup.Odometer, isFullTank: true, confidence: 'high'
        });
        continue;
      }
      results.push({ ...base, bucket: 'plain', category: getPlainCategory(d, categories), reason: `fuel debit for unmatched vehicle "${fleetName}"` });
      continue;
    }

    // 1b. Fuel without FillUp data (the two Costco charges under the standalone "Rav4" root)
    if (!hasNonCarOverride && rId === 213) {
      const existing = vehicleMatches.get('Rav4');
      if (existing) {
        results.push({
          ...base, bucket: 'carService', vehicleFleetName: 'Rav4', vehicle: existing,
          serviceCategory: 'Fuel Log', serviceType: 'Other Expense', mileage: null, confidence: 'high'
        });
        continue;
      }
      results.push({ ...base, bucket: 'plain', category: getPlainCategory(d, categories), reason: 'Rav4 fuel debit, no matching vehicle' });
      continue;
    }

    // 2. Car maintenance/service/tax/registration/insurance/inspection
    const underTransportation = rId === 3;
    const isCarShortcut = CAR_SHORTCUT_ROOTS.has(rId);
    const carLeafAllowed = underTransportation && CAR_ALLOWED_LEAF_NAMES.has(leafLower) && !CAR_BOUNDARY_LEAF_NAMES.has(leafLower);
    if (!hasNonCarOverride && (carLeafAllowed || isCarShortcut)) {
      const mention = detectVehicleName(pathParts, notes);
      let fleetName = null;
      let confidence = 'high';
      if (mention === NON_FLEET) {
        results.push({ ...base, bucket: 'plain', category: getPlainCategory(d, categories), reason: 'names a vehicle outside the tracked fleet' });
        continue;
      } else if (mention === AMBIGUOUS_SIENNA || mention === null) {
        // elimination-by-active-window: is exactly one Sienna (or exactly one
        // fleet vehicle for shortcut-root debits) actively fueled around this date?
        const candidateNames = mention === AMBIGUOUS_SIENNA ? ['Beige Van', 'Blue Van'] : ['Beige Van', 'Blue Van', 'White Elephant', 'Rav4'];
        const active = candidateNames.filter(name => {
          const vid = vehicleIdByName.get(name);
          const own = fillupTimeline.filter(f => f.vehicleId === vid);
          if (own.length === 0) return false;
          const min = own[0].time, max = own[own.length - 1].time;
          const grace = 1000 * 60 * 60 * 24 * 90;
          return time_ms >= min - grace && time_ms <= max + grace;
        });
        if (active.length === 1) {
          fleetName = active[0];
        } else {
          const nearest = nearestFillup(fillupTimeline, time_ms);
          fleetName = nearest ? lincolnVehicleNameById.get(nearest.vehicleId) : null;
          confidence = 'low';
        }
      } else {
        fleetName = mention;
      }

      if (!fleetName) {
        results.push({ ...base, bucket: 'plain', category: getPlainCategory(d, categories), reason: 'no vehicle could be determined' });
        continue;
      }
      const existing = vehicleMatches.get(fleetName);
      if (!existing) {
        results.push({ ...base, bucket: 'plain', category: getPlainCategory(d, categories), reason: `car cost for "${fleetName}", no matching CarTracker vehicle` });
        continue;
      }
      const serviceCategory = mapServiceCategory(notes);
      const nearestOwn = nearestFillup(fillupTimeline, time_ms, vehicleIdByName.get(fleetName));
      results.push({
        ...base, bucket: 'carService', vehicleFleetName: fleetName, vehicle: existing,
        serviceCategory, serviceType: serviceTypeFor(serviceCategory),
        mileage: nearestOwn ? nearestOwn.odometer : 0, confidence
      });
      continue;
    }

    // 3. Home maintenance/improvement/tax/insurance
    const underHousing = rId === 1;
    const homeSelfNamed = HOME_SHORTCUT_SELF_NAMED_ROOTS.has(rId);
    const homeNoName = HOME_SHORTCUT_NO_NAME_ROOTS.has(rId);
    const homeChildNamed = HOME_SHORTCUT_CHILD_NAMED_ROOTS.has(rId);
    const homeAllowed = (underHousing && pathHasHomeKeyword(pathParts)) || homeSelfNamed || homeNoName || homeChildNamed;

    if (homeAllowed) {
      let homeName = null;
      if (homeSelfNamed) homeName = categories.get(rId).Name.trim();
      else homeName = huntHomeName(pathParts) || huntHomeNameFromNotes(notes);

      const maintenanceCategory = mapMaintenanceCategory(notes);
      const entry = {
        ...base, bucket: 'home', homeName, maintenanceCategory,
        maintenanceType: maintenanceTypeFor(maintenanceCategory), confidence: homeName ? 'high' : 'low'
      };
      if (homeName) resolvedHomeTimeline.push({ time: time_ms, homeName });
      else unresolvedHomeIdx.push(results.length);
      results.push(entry);
      continue;
    }

    // 4. Everything else
    results.push({ ...base, bucket: 'plain', category: getPlainCategory(d, categories) });
  }

  // Resolve homeless "home" entries via nearest-named-home-in-time
  resolvedHomeTimeline.sort((a, b) => a.time - b.time);
  for (const idx of unresolvedHomeIdx) {
    const entry = results[idx];
    if (resolvedHomeTimeline.length === 0) { entry.homeName = 'Albemarle'; continue; }
    const t = new Date(entry.debit.SpentOn.replace(' ', 'T')).getTime();
    let best = resolvedHomeTimeline[0], bestDiff = Math.abs(best.time - t);
    for (const r of resolvedHomeTimeline) {
      const diff = Math.abs(r.time - t);
      if (diff < bestDiff) { best = r; bestDiff = diff; }
    }
    entry.homeName = best.homeName;
  }

  return results;
}
