import flood from '@shared/data/disasters/flood.json';
import fire from '@shared/data/disasters/fire.json';
import earthquake from '@shared/data/disasters/earthquake.json';
import storm from '@shared/data/disasters/storm.json';
import roadAccident from '@shared/data/disasters/road-accident.json';
import medicalEmergency from '@shared/data/disasters/medical-emergency.json';
import emergencyContacts from '@shared/data/emergencyContacts.json';
import emergencyKit from '@shared/data/emergencyKit.json';

/**
 * Client-side view of the shared safety data.
 *
 * The JSON is bundled at build time, which is what makes guidance, emergency
 * numbers and the kit fully available offline. The server reads the exact same
 * files through shared/data/index.cjs, so the two can never disagree.
 */

export const disasters = [flood, fire, earthquake, storm, roadAccident, medicalEmergency].sort(
  (a, b) => a.order - b.order
);

export const disastersById = Object.fromEntries(
  disasters.map((disaster) => [disaster.id, disaster])
);

export const contacts = [...emergencyContacts.contacts].sort((a, b) => a.priority - b.priority);

export const contactsById = Object.fromEntries(contacts.map((contact) => [contact.id, contact]));

export const contactsMeta = emergencyContacts.meta;

export const disasterContactMap = emergencyContacts.disasterContactMap;

export const kitItems = emergencyKit.items;

export const kitMeta = emergencyKit.meta;

/** Verified numbers to show alongside a specific disaster's guidance. */
export const getContactsForDisaster = (disasterId) =>
  (disasterContactMap[disasterId] || ['rescue-1122']).map((id) => contactsById[id]).filter(Boolean);

export const getDisaster = (id) => disastersById[id] || null;
