import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export const PROJECT_ID = 'pwa-experiment-291c0';
export const HOUSEHOLD_CODE = '3701';
export const LINCOLN_DB_PATH = 'C:\\Users\\lyvuo\\Documents\\Projects\\Family\\Expense\\public\\Lincoln.db';
export const MIGRATION_BATCH = 'lincoln-cartracker-hometracker-2026-08-07';

// ---------------------------------------------------------------------------
// Firestore REST helpers (OAuth token from the Firebase CLI's cached login,
// same approach already used by Family/Expense/scripts/migrate_household_3701.mjs)
// ---------------------------------------------------------------------------

export async function getAccessToken() {
  const tokensPath = 'C:/Users/lyvuo/.config/configstore/firebase-tools.json';
  const toolsConfig = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const tokens = toolsConfig.tokens;

  if (Date.now() >= (tokens.expires_at || 0) - 60000) {
    const params = new URLSearchParams({
      // Firebase CLI's own public "installed application" OAuth client id/secret
      // (published in firebase-tools' open-source code) — required by Google's
      // token endpoint to refresh a cached firebase-tools login, not a project secret.
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    if (data.access_token) {
      tokens.access_token = data.access_token;
      tokens.expires_at = Date.now() + data.expires_in * 1000;
      toolsConfig.tokens = tokens;
      fs.writeFileSync(tokensPath, JSON.stringify(toolsConfig, null, 2));
    }
  }
  return tokens.access_token;
}

// JSON.stringify (used internally by fetch's body) escapes quotes/apostrophes
// correctly, so raw Notes text can be dropped straight into stringValue.
export function valueToFirestore(val) {
  if (val === null || val === undefined) return { nullValue: 'NULL_VALUE' };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(valueToFirestore) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = valueToFirestore(v);
    return { mapValue: { fields } };
  }
  return { nullValue: 'NULL_VALUE' };
}

function fromFirestoreValue(v) {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.mapValue) {
    const o = {};
    for (const [k, vv] of Object.entries(v.mapValue.fields || {})) o[k] = fromFirestoreValue(vv);
    return o;
  }
  if (v.arrayValue) return (v.arrayValue.values || []).map(fromFirestoreValue);
  return null;
}

function docPathToId(name) {
  return name.split('/').pop();
}

export async function listAll(token, collection, { retries = 5 } = {}) {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/households/${HOUSEHOLD_CODE}/${collection}`;
  let all = [];
  let pageToken;
  do {
    const url = new URL(base);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    let attempt = 0;
    let data;
    for (;;) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 429 && attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      if (res.status === 404) { data = {}; break; }
      if (!res.ok) throw new Error(`listDocuments(${collection}) failed ${res.status}: ${await res.text()}`);
      data = await res.json();
      break;
    }
    all = all.concat((data.documents || []).map(d => ({ id: docPathToId(d.name), ...fromFirestoreValue({ mapValue: { fields: d.fields || {} } }) })));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return all;
}

export async function commitBatch(token, writes, { retries = 5 } = {}) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  let attempt = 0;
  for (;;) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes })
    });
    if (res.status === 429 && attempt < retries) {
      attempt++;
      await new Promise(r => setTimeout(r, 2000 * attempt));
      continue;
    }
    if (!res.ok) throw new Error(`commit failed ${res.status}: ${await res.text()}`);
    return res.json();
  }
}

export function docRef(collection, id) {
  return `projects/${PROJECT_ID}/databases/(default)/documents/households/${HOUSEHOLD_CODE}/${collection}/${id}`;
}

// ---------------------------------------------------------------------------
// Lincoln.db loading (read-only — never open this without { readOnly: true })
// ---------------------------------------------------------------------------

export function openLincolnDb() {
  return new DatabaseSync(LINCOLN_DB_PATH, { readOnly: true });
}

export function loadLincoln(db) {
  const categories = new Map();
  db.prepare('SELECT * FROM ExpenseCategories').all().forEach(c => categories.set(c.ExpenseCategoryId, c));

  const merchants = new Map();
  db.prepare('SELECT * FROM Merchants').all().forEach(m => merchants.set(m.MerchantId, (m.Name || '').trim()));

  const paymentTypes = new Map();
  db.prepare('SELECT * FROM PaymentTypes').all().forEach(p => paymentTypes.set(p.PaymentTypeId, p));

  const users = new Map();
  db.prepare('SELECT * FROM ExpenseUsers').all().forEach(u => users.set(u.ExpenseUserId, u.Firstname));

  const vehicles = new Map();
  db.prepare('SELECT * FROM Vehicles').all().forEach(v => vehicles.set(v.Id, v));

  const fillupsByDebitId = new Map();
  db.prepare('SELECT * FROM FillUps').all().forEach(f => fillupsByDebitId.set(f.DebitId, f));

  const debits = db.prepare('SELECT * FROM Debits ORDER BY SpentOn').all();

  return { categories, merchants, paymentTypes, users, vehicles, fillupsByDebitId, debits };
}

export function catPath(id, categories) {
  const parts = [];
  let cur = categories.get(id);
  let guard = 0;
  while (cur && guard++ < 25) {
    const name = (cur.Name || '').trim();
    if (name) parts.unshift(name);
    if (!cur.ParentCategoryId || cur.ParentCategoryId === 0 || cur.ParentCategoryId === cur.ExpenseCategoryId) break;
    cur = categories.get(cur.ParentCategoryId);
  }
  return parts;
}

export function rootOf(id, categories) {
  let cur = categories.get(id);
  let guard = 0;
  while (cur && cur.ParentCategoryId && cur.ParentCategoryId !== 0 && cur.ParentCategoryId !== cur.ExpenseCategoryId && guard++ < 25) {
    cur = categories.get(cur.ParentCategoryId);
  }
  return cur ? cur.ExpenseCategoryId : id;
}

// ---------------------------------------------------------------------------
// Fixed lookup tables carried over from the prior ExpenseTracker migration
// (Family/Expense/scripts/dry_run_3701.mjs) so names stay consistent with the
// 1817 rows already migrated.
// ---------------------------------------------------------------------------

export const USER_NAME_MAP = { Ly: 'Anh Vuong', Huong: 'Huong Pham', Huan: 'Huan Vuong' };
export const USER_UID_MAP = { Ly: 'user-ly', Huong: 'user-huong', Huan: 'user-huan' };

export const PAYMENT_TYPE_MAPPING = {
  1: { name: 'Cash', isSystemDefault: true },
  2: { name: 'Credit Card', ownerName: 'Anh Vuong' },
  3: { name: 'VISA', ownerName: 'Anh Vuong' },
  4: { name: 'VISA - Citi Costco - Anh Vuong', ownerName: 'Anh Vuong' },
  5: { name: 'Mastercard', ownerName: 'Anh Vuong' },
  6: { name: 'Capital One Mastercard', ownerName: 'Anh Vuong' },
  7: { name: 'Wells Fargo VISA', ownerName: 'Anh Vuong' },
  8: { name: 'Synchrony Mastercard', ownerName: 'Anh Vuong' },
  9: { name: 'Freedom VISA', ownerName: 'Anh Vuong' },
  10: { name: 'Gift Card - Vanilla - Anh Vuong', ownerName: 'Anh Vuong' },
  11: { name: 'Home Depot VISA', ownerName: 'Anh Vuong' },
  12: { name: 'VISA - Venture X - Anh Vuong', ownerName: 'Anh Vuong' },
  13: { name: 'HSA - Huong', ownerName: 'Huong Pham' },
  14: { name: 'HSA - Ly', ownerName: 'Anh Vuong' },
  15: { name: 'BCBS Wellness', ownerName: 'Anh Vuong' },
  16: { name: 'ModivCare Debit', ownerName: 'Anh Vuong' },
  17: { name: 'VISA - Venture X - Huong', ownerName: 'Huong Pham' },
  18: { name: 'VISA - United Explorer - Anh Vuong', ownerName: 'Anh Vuong' },
  19: { name: 'VISA - United Explorer - Huong', ownerName: 'Huong Pham' },
  20: { name: 'VISA - United Explorer - Huan', ownerName: 'Huan Vuong' }
};

function getCatHierarchyNames(id, categories) {
  return catPath(id, categories);
}

// Verbatim port of Family/Expense/scripts/dry_run_3701.mjs's category mapper,
// used only as the fallback for debits that don't classify as fuel/car/home,
// so the free-text category string on plain transactions stays consistent
// with the 1817 rows the prior migration already wrote.
export function mapToExpenseCategory(hierarchy) {
  if (!hierarchy || hierarchy.length === 0) return 'Expense - Other';
  const root = hierarchy[0];
  const sub = hierarchy[hierarchy.length - 1];
  let topCategory = 'Other';
  let subCategory = '';

  if (root === 'Food') {
    topCategory = 'Food & Dining';
    if (sub === 'Groceries') { topCategory = 'Grocery'; subCategory = 'Supermarket'; }
    else if (sub === 'Fast food') { subCategory = 'Fast Food'; }
    else if (sub === 'Coffee shops') { subCategory = 'Coffee & Tea'; }
    else if (sub === 'Breakfast' || sub === 'Lunch' || sub === 'Dinner') { subCategory = 'Restaurant'; }
    else if (sub === 'Snacks') { subCategory = 'Dessert & Snacks'; }
    else if (sub === 'Drinks') { subCategory = 'Bar & Drinks'; }
    else { subCategory = sub; }
  } else if (root === 'Transportation') {
    topCategory = 'Transportation';
    if (sub === 'Gas') { subCategory = 'Fuel'; }
    else if (sub === 'Parking Fees') { subCategory = 'Parking'; }
    else if (sub === 'Public transportation') { subCategory = 'Public Transit'; }
    else if (sub === 'Ride sharing (Uber, Lyft)') { subCategory = 'Rideshare & Taxi'; }
    else if (sub === 'Tolls') { subCategory = 'Tolls'; }
    else { subCategory = sub; }
  } else if (root === 'Technology') {
    topCategory = 'Digital & Tech';
    if (sub === 'Mobile Phone') { subCategory = 'Online Services'; }
    else { subCategory = 'Devices & Accessories'; }
  } else if (root === 'Housing') {
    topCategory = 'Household Supplies';
    if (sub === 'Furnishings' || sub === 'Home improvement') { topCategory = 'Shopping'; subCategory = 'Home & Furniture'; }
    else { subCategory = 'Tools & Hardware'; }
  } else if (root === 'Health') {
    topCategory = 'Health & Medical';
    if (sub === 'Prescriptions / Medication') { subCategory = 'Pharmacy'; }
    else if (sub === 'Doctor bills' || sub === 'Hospital bills') { subCategory = 'Doctor Visit'; }
    else if (sub === 'Dentist visits') { subCategory = 'Dental'; }
    else if (sub === 'Optometrist' || sub === 'Glasses, contacts') { subCategory = 'Vision'; }
    else { subCategory = sub; }
  } else if (root === 'Kids') {
    topCategory = 'Kids & Childcare';
    if (sub === 'School supplies' || sub === 'Tuition' || sub === 'School lunches') { subCategory = 'School'; }
    else if (sub === 'Daycare') { subCategory = 'Daycare'; }
    else if (sub === 'Babysitter / Nanny') { subCategory = 'Babysitting'; }
    else { subCategory = sub; }
  } else if (root === 'Travel') {
    topCategory = 'Travel';
    if (sub === 'Lunch') { subCategory = 'Travel Food'; }
    else if (sub === 'Housing') { subCategory = 'Lodging'; }
    else { subCategory = 'Activities & Tours'; }
  } else if (root === 'Clothing') {
    topCategory = 'Shopping';
    subCategory = 'Clothing';
  } else if (root === 'Giving') {
    topCategory = 'Gifts & Donations';
    subCategory = 'Charity';
  } else if (root === 'Personal development / Recreation') {
    topCategory = 'Entertainment';
    subCategory = 'Hobbies';
  }

  if (subCategory && subCategory !== topCategory) return `Expense - ${topCategory} - ${subCategory}`;
  return `Expense - ${topCategory}`;
}

export function getPlainCategory(debit, categories) {
  const hierarchy = getCatHierarchyNames(debit.ExpenseCategoryId, categories);
  return mapToExpenseCategory(hierarchy);
}

// ---------------------------------------------------------------------------
// Shared parsing utilities
// ---------------------------------------------------------------------------

export function splitSpentOn(spentOn) {
  const str = String(spentOn || '');
  const [datePart, timePart] = str.split(' ');
  const date = datePart || new Date().toISOString().split('T')[0];
  const time = (timePart || '12:00').slice(0, 5);
  return { date, time };
}

export function dedupKey({ amount, date, time, vendor }) {
  return `${Number(amount).toFixed(2)}|${date}|${time}|${(vendor || '').trim().toLowerCase()}`;
}

export function parseVehicleDescription(description) {
  const m = String(description || '').trim().match(/^(\d{4})\s+(\S+)\s+(.+)$/);
  if (!m) return { year: null, make: '', model: String(description || '').trim() };
  return { year: Number(m[1]), make: m[2], model: m[3].trim() };
}
