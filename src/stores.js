//not using file right now

import { writable } from 'svelte/store';

const userAnswers = [];

const { subscribe, set, update } = writable(userAnswers);

const addAnswer = (userAnswer) =>
  update((userAnswer) => {
    return [...usersAnswers, userAnswer];
  });

const reset = () => {
  set(userAnswers);
};

export default {
  userAnswers,
  subscribe,
  addAnswer,
  reset,
};
