export const clearDemoData = (): void => {
  try {
    const vehicles = loadLocalVehicles().filter(v => !v.id.startsWith('demo-'));
    const records = loadLocalRecords().filter(r => !r.id.startsWith('rec-') && !r.vehicleId.startsWith('demo-'));
    const reminders = loadLocalReminders().filter(rem => !rem.id.startsWith('rem-') && !rem.vehicleId.startsWith('demo-'));
    saveLocalVehicles(vehicles);
    saveLocalRecords(records);
    saveLocalReminders(reminders);
  } catch (err) {
    console.error('Failed to clear demo data:', err);
  }
};

export const clearLocalDemoData = clearDemoData;