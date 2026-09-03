'use strict';

/**
 * Shared data registry (CommonJS, for the Node backend).
 *
 * The React client imports the same JSON files directly from
 * client/src/data/index.js, so guidance, contacts and kit items can never
 * drift between the AI fallback answers and the screens the user reads.
 *
 * To add a disaster: drop a JSON file in ./disasters and add it below.
 */

const flood = require('./disasters/flood.json');
const fire = require('./disasters/fire.json');
const earthquake = require('./disasters/earthquake.json');
const storm = require('./disasters/storm.json');
const roadAccident = require('./disasters/road-accident.json');
const medicalEmergency = require('./disasters/medical-emergency.json');

const emergencyContacts = require('./emergencyContacts.json');
const emergencyKit = require('./emergencyKit.json');

const disasters = [flood, fire, earthquake, storm, roadAccident, medicalEmergency].sort(
  (a, b) => a.order - b.order
);

const disastersById = disasters.reduce((map, disaster) => {
  map[disaster.id] = disaster;
  return map;
}, {});

const contactsById = emergencyContacts.contacts.reduce((map, contact) => {
  map[contact.id] = contact;
  return map;
}, {});

module.exports = {
  disasters,
  disastersById,
  emergencyContacts,
  contactsById,
  emergencyKit,
};
