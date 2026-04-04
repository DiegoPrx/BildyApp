import { EventEmitter } from 'events';

const emitter = new EventEmitter();

// Listeners de eventos del ciclo de vida del usuario
emitter.on('user:registered', (user) => {
  console.log(`[evento] user:registered - ${user.email}`);
});

emitter.on('user:verified', (user) => {
  console.log(`[evento] user:verified - ${user.email}`);
});

emitter.on('user:invited', (user) => {
  console.log(`[evento] user:invited - ${user.email}`);
});

emitter.on('user:deleted', (user) => {
  console.log(`[evento] user:deleted - ${user.email}`);
});

export default emitter;
