import {
  HOUSEHOLD_CODE, PROJECT_ID, MIGRATION_BATCH, getAccessToken, listAll, commitBatch, docRef,
  valueToFirestore, dedupKey, openLincolnDb, loadLincoln
} from './lincoln_shared.mjs';
import { classifyDebits, resolveVehicleMatches, determineAction } from './lincoln_classify.mjs';

const migratedAt = new Date().toISOString();

function isoFromDateTime(date, time) {
  try { return new Date(`${date}T${time}:00`).toISOString(); } catch { return migratedAt; }
}

function buildFuelCategory(vehicle) {
  return `Car - Fuel - ${vehicle.year} - ${vehicle.make} ${vehicle.model}`;
}
function buildCarCategory(serviceCategory, vehicle) {
  return `Car - ${serviceCategory} - ${vehicle.year} - ${vehicle.make} ${vehicle.model}`;
}
function buildHomeCategory(maintenanceCategory, homeNickname) {
  return `Home - ${maintenanceCategory} - ${homeNickname}`;
}

function transactionFields(r, category) {
  return {
    id: r.id, date: r.date, time: r.time, amount: r.amount, vendor: r.vendor,
    notes: r.notes || '', category, paymentType: r.paymentType, user: r.user,
    isMigrated: true, migrationBatch: MIGRATION_BATCH, migratedAt
  };
}

async function main() {
  console.log('===================================================');
  console.log(`LIVE MIGRATION: Lincoln.db -> households/${HOUSEHOLD_CODE}`);
  console.log(`Project: ${PROJECT_ID}  Batch: ${MIGRATION_BATCH}`);
  console.log('===================================================\n');

  const db = openLincolnDb();
  const lincoln = loadLincoln(db);
  console.log(`Loaded ${lincoln.debits.length} debits from Lincoln.db (read-only).`);

  const token = await getAccessToken();

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

  // --- Step 0: two Lincoln fleet vehicles can collide onto the same existing
  // CarTracker vehicle doc (e.g. two 2004 Siennas -> one "Sienna" doc). The
  // fleet vehicle with the more recent fill-up history keeps that match; any
  // other colliding vehicle gets its own new doc so histories don't interleave.
  const { matches: vehicleMatches, collided, fleetDescriptions } = resolveVehicleMatches(lincoln, existingVehicles);
  if (collided.size > 0) {
    console.log(`Creating ${collided.size} new vehicle doc(s) for collided fleet vehicle(s): ${[...collided].join(', ')}`);
    const vehicleWrites = [...collided].map((fleetName, i) => {
      const desc = fleetDescriptions[fleetName];
      const id = `v-lincoln-${Date.now()}-${i}`;
      const fields = {
        id, make: desc.make, model: desc.model, year: desc.year,
        vin: '', licensePlate: '', startingMileage: 0, currentMileage: 0,
        fuelType: 'Gasoline', notes: `Migrated from Lincoln.db as "${fleetName}"`,
        createdAt: migratedAt, updatedAt: migratedAt,
        isMigrated: true, migrationBatch: MIGRATION_BATCH, migratedAt
      };
      vehicleMatches.set(fleetName, fields);
      return {
        update: {
          name: docRef('vehicles', id),
          fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, valueToFirestore(v)]))
        }
      };
    });
    await commitBatch(token, vehicleWrites);
    console.log('✅ Vehicles created.\n');
  }

  const results = classifyDebits(lincoln, vehicleMatches, existingTxByKey);
  for (const r of results) r.action = determineAction(r, existingCompanionIds);
  const toWrite = results.filter(r => r.action !== 'skip');
  console.log(`${results.length - toWrite.length} debits are already fully migrated and will be skipped. ${toWrite.length} will be written (some as companion-only backfills).\n`);

  // --- Step 1: create any missing House docs up front so their ids are known ---
  const homeIdByNickname = new Map(existingHouses.map(h => [(h.nickname || '').toLowerCase(), h.id]));
  const homeEntries = toWrite.filter(r => r.bucket === 'home');
  const newHomeNames = [...new Set(homeEntries.map(r => r.homeName))].filter(name => !homeIdByNickname.has(name.toLowerCase()));

  if (newHomeNames.length > 0) {
    console.log(`Creating ${newHomeNames.length} new House doc(s): ${newHomeNames.join(', ')}`);
    const houseWrites = newHomeNames.map((name, i) => {
      const id = `h-lincoln-${Date.now()}-${i}`;
      homeIdByNickname.set(name.toLowerCase(), id);
      return {
        update: {
          name: docRef('houses', id),
          fields: Object.fromEntries(Object.entries({
            id, nickname: name, address: '', propertyType: 'Other',
            createdAt: migratedAt, updatedAt: migratedAt,
            isMigrated: true, migrationBatch: MIGRATION_BATCH, migratedAt
          }).map(([k, v]) => [k, valueToFirestore(v)]))
        }
      };
    });
    await commitBatch(token, houseWrites);
    console.log('✅ Houses created.\n');
  }

  // --- Step 2: build all transaction + specialized-record writes ---
  let writes = [];
  let totalDocsWritten = 0;
  let debitsWritten = 0;

  async function flush() {
    if (writes.length === 0) return;
    await commitBatch(token, writes);
    totalDocsWritten += writes.length;
    console.log(`Committed batch: ${totalDocsWritten} docs written so far...`);
    writes = [];
  }

  function pushDoc(collection, id, fields) {
    writes.push({
      update: {
        name: docRef(collection, id),
        fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, valueToFirestore(v)]))
      }
    });
  }

  let backfillCount = 0;
  for (const r of toWrite) {
    // 'backfill-companion-only' means a plain transaction already exists for
    // this debit from the prior migration — only add the missing companion
    // doc onto that same id, never touch/duplicate the transaction itself.
    const writeTransaction = r.action !== 'backfill-companion-only';
    if (r.action === 'backfill-companion-only') backfillCount++;

    if (r.bucket === 'fuel') {
      if (writeTransaction) pushDoc('transactions', r.id, transactionFields(r, buildFuelCategory(r.vehicle)));
      pushDoc('refuels', r.id, {
        id: r.id, vehicleId: r.vehicle.id, odometer: r.odometer, isFullTank: r.isFullTank, gallons: r.gallons,
        createdAt: isoFromDateTime(r.date, r.time), loggedBy: { uid: r.userUid, displayName: r.user },
        isMigrated: true, migrationBatch: MIGRATION_BATCH, migratedAt
      });
    } else if (r.bucket === 'carService') {
      if (writeTransaction) pushDoc('transactions', r.id, transactionFields(r, buildCarCategory(r.serviceCategory, r.vehicle)));
      pushDoc('records', r.id, {
        id: r.id, vehicleId: r.vehicle.id, mileage: r.mileage || 0, category: r.serviceCategory, type: r.serviceType,
        createdAt: isoFromDateTime(r.date, r.time), loggedBy: { uid: r.userUid, displayName: r.user },
        isMigrated: true, migrationBatch: MIGRATION_BATCH, migratedAt
      });
    } else if (r.bucket === 'home') {
      const homeId = homeIdByNickname.get(r.homeName.toLowerCase());
      if (writeTransaction) pushDoc('transactions', r.id, transactionFields(r, buildHomeCategory(r.maintenanceCategory, r.homeName)));
      pushDoc('homeRecords', r.id, {
        id: r.id, homeId, category: r.maintenanceCategory, type: r.maintenanceType,
        createdAt: isoFromDateTime(r.date, r.time), loggedBy: { uid: r.userUid, displayName: r.user },
        isMigrated: true, migrationBatch: MIGRATION_BATCH, migratedAt
      });
    } else {
      pushDoc('transactions', r.id, transactionFields(r, r.category));
    }
    debitsWritten++;
    if (writes.length >= 396) await flush(); // stay under Firestore's 500-write commit limit
  }
  await flush();

  console.log(`\n🎉 MIGRATION COMPLETE: ${debitsWritten} debits processed (${backfillCount} were companion-only backfills), ${totalDocsWritten} total documents written to households/${HOUSEHOLD_CODE}.`);
}

main().catch(err => { console.error('Migration error:', err); process.exit(1); });
