import { PROJECT_ID, HOUSEHOLD_CODE, MIGRATION_BATCH, getAccessToken, commitBatch } from './lincoln_shared.mjs';

const batchTag = process.argv[2] || MIGRATION_BATCH;
const collections = ['transactions', 'refuels', 'records', 'homeRecords', 'houses'];

async function findByBatch(token, collection, batchTag) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/households/${HOUSEHOLD_CODE}:runQuery`;
  const structuredQuery = {
    from: [{ collectionId: collection }],
    where: { fieldFilter: { field: { fieldPath: 'migrationBatch' }, op: 'EQUAL', value: { stringValue: batchTag } } }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery })
  });
  if (!res.ok) throw new Error(`runQuery(${collection}) failed ${res.status}: ${await res.text()}`);
  const results = await res.json();
  return results.map(r => r.document?.name).filter(Boolean);
}

async function main() {
  console.log('===================================================');
  console.log(`ROLLBACK - Project: ${PROJECT_ID}  Household: ${HOUSEHOLD_CODE}`);
  console.log(`Migration Batch Tag: ${batchTag}`);
  console.log('===================================================\n');

  const token = await getAccessToken();

  let allNames = [];
  for (const collection of collections) {
    const names = await findByBatch(token, collection, batchTag);
    console.log(`Found ${names.length} docs in ${collection} matching batch "${batchTag}".`);
    allNames = allNames.concat(names);
  }

  if (allNames.length === 0) {
    console.log('\nNothing to roll back.');
    process.exit(0);
  }

  console.log(`\nDeleting ${allNames.length} documents total...`);
  for (let i = 0; i < allNames.length; i += 400) {
    const chunk = allNames.slice(i, i + 400);
    await commitBatch(token, chunk.map(name => ({ delete: name })));
    console.log(`  deleted ${Math.min(i + 400, allNames.length)} / ${allNames.length}`);
  }

  console.log(`\n✅ ROLLBACK COMPLETE: removed ${allNames.length} documents tagged "${batchTag}".`);
}

main().catch(err => { console.error('Rollback error:', err); process.exit(1); });
