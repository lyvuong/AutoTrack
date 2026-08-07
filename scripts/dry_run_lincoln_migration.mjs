import {
  HOUSEHOLD_CODE, PROJECT_ID, getAccessToken, listAll, dedupKey, openLincolnDb, loadLincoln
} from './lincoln_shared.mjs';
import { classifyDebits, resolveVehicleMatches, determineAction } from './lincoln_classify.mjs';

async function main() {
  console.log('===================================================');
  console.log('DRY-RUN: Lincoln.db -> CarTracker / HomeTracker / shared ledger');
  console.log(`Project: ${PROJECT_ID}  Household: ${HOUSEHOLD_CODE}`);
  console.log('===================================================\n');

  const db = openLincolnDb();
  const lincoln = loadLincoln(db);
  console.log(`Loaded ${lincoln.debits.length} debits from Lincoln.db (read-only).`);

  const token = await getAccessToken();
  console.log('Authenticated with cached Firebase CLI OAuth token.\n');

  const [existingTx, existingVehicles, existingHouses, existingRefuels, existingRecords, existingHomeRecords] = await Promise.all([
    listAll(token, 'transactions'),
    listAll(token, 'vehicles'),
    listAll(token, 'houses'),
    listAll(token, 'refuels'),
    listAll(token, 'records'),
    listAll(token, 'homeRecords')
  ]);
  console.log(`Existing Firestore state: ${existingTx.length} transactions, ${existingVehicles.length} vehicles, ${existingHouses.length} houses, ${existingRefuels.length} refuels, ${existingRecords.length} records, ${existingHomeRecords.length} homeRecords.\n`);

  const existingTxByKey = new Map(existingTx.map(t => [dedupKey({ amount: t.amount, date: t.date, time: t.time, vendor: t.vendor }), t.id]));
  const existingCompanionIds = {
    refuels: new Set(existingRefuels.map(r => r.id)),
    records: new Set(existingRecords.map(r => r.id)),
    homeRecords: new Set(existingHomeRecords.map(r => r.id))
  };

  const { matches: vehicleMatches, collided, fleetDescriptions } = resolveVehicleMatches(lincoln, existingVehicles);
  const results = classifyDebits(lincoln, vehicleMatches, existingTxByKey);
  for (const r of results) r.action = determineAction(r, existingCompanionIds);

  const byBucket = { fuel: [], carService: [], home: [], plain: [] };
  for (const r of results) byBucket[r.bucket].push(r);

  console.log(`--- Summary (${results.length} total debits) ---`);
  for (const [bucket, rows] of Object.entries(byBucket)) {
    const sum = rows.reduce((s, r) => s + r.amount, 0);
    const byAction = { 'create-transaction-only': 0, 'create-transaction-and-companion': 0, 'backfill-companion-only': 0, skip: 0 };
    for (const r of rows) byAction[r.action]++;
    console.log(`${bucket.padEnd(12)} count=${String(rows.length).padEnd(6)} sum=$${sum.toFixed(2).padEnd(12)} new=${byAction['create-transaction-only'] + byAction['create-transaction-and-companion']}  backfill=${byAction['backfill-companion-only']}  skip=${byAction.skip}`);
  }

  console.log('\n--- Vehicle match table (Lincoln fleet -> existing CarTracker vehicle) ---');
  for (const fleetName of Object.keys(fleetDescriptions)) {
    const desc = fleetDescriptions[fleetName];
    const match = vehicleMatches.get(fleetName);
    let status;
    if (match) status = `MATCHED: ${match.id} (${match.year} ${match.make} ${match.model})`;
    else if (collided.has(fleetName)) status = 'COLLISION with another fleet vehicle on the same existing doc -> a new vehicle will be created';
    else status = 'NOT FOUND (its debits fall back to plain transactions)';
    console.log(`  ${fleetName.padEnd(14)} (${desc ? `${desc.year} ${desc.make} ${desc.model}` : 'n/a'})  ->  ${status}`);
  }

  console.log('\n--- Home list (resolved home name -> existing House or to-be-created); counts exclude already-fully-migrated entries ---');
  const homeCounts = new Map();
  for (const r of byBucket.home) {
    if (r.action === 'skip') continue;
    const g = homeCounts.get(r.homeName) || { count: 0, sum: 0 };
    g.count++; g.sum += r.amount;
    homeCounts.set(r.homeName, g);
  }
  for (const [name, g] of [...homeCounts.entries()].sort((a, b) => b[1].count - a[1].count)) {
    const existing = existingHouses.find(h => (h.nickname || '').toLowerCase() === name.toLowerCase());
    console.log(`  ${name.padEnd(14)} count=${String(g.count).padEnd(4)} sum=$${g.sum.toFixed(2).padEnd(10)} -> ${existing ? `existing house ${existing.id}` : 'WILL CREATE new house'}`);
  }

  console.log('\n--- Car service breakdown by vehicle / category; counts exclude already-fully-migrated entries ---');
  const carGroups = new Map();
  for (const r of byBucket.carService) {
    if (r.action === 'skip') continue;
    const k = `${r.vehicleFleetName} / ${r.serviceCategory}`;
    const g = carGroups.get(k) || { count: 0, sum: 0 };
    g.count++; g.sum += r.amount;
    carGroups.set(k, g);
  }
  for (const [k, g] of [...carGroups.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${k.padEnd(35)} count=${String(g.count).padEnd(4)} sum=$${g.sum.toFixed(2)}`);
  }

  console.log('\n--- LOW-CONFIDENCE assignments (please spot-check after migration) ---');
  const lowConf = results.filter(r => r.confidence === 'low');
  if (lowConf.length === 0) console.log('  (none)');
  for (const r of lowConf) {
    const target = r.bucket === 'carService' ? `vehicle=${r.vehicleFleetName}` : r.bucket === 'home' ? `home=${r.homeName}` : '';
    console.log(`  [${r.bucket}] ${r.date} $${r.amount.toFixed(2)} ${r.vendor} — "${r.notes}" -> ${target}`);
  }

  console.log('\n--- Sample of "plain" fallbacks with a reason (car/home debits that did NOT get a specialized record) ---');
  const reasoned = results.filter(r => r.bucket === 'plain' && r.reason);
  for (const r of reasoned.slice(0, 25)) {
    console.log(`  ${r.date} $${r.amount.toFixed(2)} ${r.vendor} — "${r.notes}" — ${r.reason}`);
  }
  if (reasoned.length > 25) console.log(`  ... and ${reasoned.length - 25} more`);

  const actionCounts = { 'create-transaction-only': 0, 'create-transaction-and-companion': 0, 'backfill-companion-only': 0, skip: 0 };
  for (const r of results) actionCounts[r.action]++;
  console.log(`\n[DRY-RUN RESULT]: 0 writes executed.`);
  console.log(`  ${actionCounts['create-transaction-only'] + actionCounts['create-transaction-and-companion']} new transaction(s) to create`);
  console.log(`  ${actionCounts['backfill-companion-only']} companion doc(s) to backfill onto already-existing transactions`);
  console.log(`  ${actionCounts.skip} debit(s) fully skipped (already completely migrated)`);
}

main().catch(err => { console.error(err); process.exit(1); });
