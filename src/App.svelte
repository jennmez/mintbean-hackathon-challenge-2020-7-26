<script>
  import { onMount } from 'svelte';
  let state = 'welcome'; // 'playing'
  let difficulty;
  let numOfQuestions;
  let category;
  // let questionsPromise;
  let questions;
  let score;
  // let trivia;
  let questionAnswers;
  let userAnswers;

  const proxyURL = 'https://cors-anywhere.herokuapp.com/';
  const api = {
    key: process.env.QUIZ_API_KEY,
    baseURL: 'https://quizapi.io/api/v1/',
  };

  const loadQuestions = async () => {
    try {
      score = 0;
      let response = await fetch(
        `${proxyURL}${api.baseURL}questions?apiKey=${api.key}&difficulty=${difficulty}&limit=${numOfQuestions}&tags=JavaScript`
      );
      questions = await response.json();
      console.log(questions);
      getQuestions(questions);
    } catch (err) {
      alert(err);
    }
  };

  const getQuestions = async (questions) => {
    try {
      userAnswers = [];
      const array = await questions.forEach((question) => {
        let answersArray = question.incorrect_answers;
        answersArray.push(question.correct_answer);
      });
    } catch (err) {
      alert(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadQuestions();
    console.log(difficulty, numOfQuestions);
    state = 'playing';
  };

  // onMount(() => {
  //   questionsPromise = loadQuestions();
  // });
</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 800x;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  h1 {
    color: #bc1a96;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 200;
  }
  p {
    color: #2b2b2b;
    font-size: 1.5em;
    font-weight: 100;
    max-width: 24em;
    margin: 0 auto 1em auto;
  }
  button {
    background-color: #bc1a96;
  }
</style>

<main>
  <header>
    <h1>PROGRAMMING TRIVIA</h1>
  </header>
  {#if state === 'welcome'}
    <p>
      So you think you know HTML? Prove it! Select the number of questions,
      difficulty level and let's find out!
    </p>
    <form on:submit={handleSubmit}>
      <select bind:value={difficulty}>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
      <select bind:value={numOfQuestions}>
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="15">15</option>
        <option value="20">20</option>
      </select>
      <button type="submit">Start Game</button>
    </form>
  {:else if state === 'playing'}
    <p>game screen here</p>
  {/if}
</main>

<!--<script>
//   import Welcome from './components/Welcome.svelte';
//   let state = 'welcome'; // 'playing'
//   import { onMount } from 'svelte';
//   // import { getQuestions } from './api';
//   // import { userAnswers } from './stores';
//   let questions = [];
//   let userAnswers = [];

//   const proxyURL = 'https://cors-anywhere.herokuapp.com/';
//   const api = {
//     key: process.env.QUIZ_API_KEY,
//     baseURL: 'https://quizapi.io/api/v1/',
//   };

//   onMount(async function loadQuestions() {
//     try {
//       let response = await fetch(
//         `${proxyURL}${api.baseURL}questions?apiKey=${api.key}&category=code&difficulty=${difficultyLevel}&limit==${numOfQuestions}&tags=${category}`
//       );
//       questions = await response.json();
//       console.log(questions);
//     } catch (err) {
//       alert(err);
//     }
//   });


// </script>//<style>
//   main {
//     text-align: center;
//     padding: 1em;
//     max-width: 800x;
//     margin: 0 auto;
//     height: 100%;
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//   }
// </style>// <main>
//   {#if state === 'welcome'}
//     <Welcome />
//   {:else if state === 'playing'}
//     <p>game screen here</p>
//   {/if}
// </main>

//  <main>
//   <h1>HTML Interview Questions</h1>
//   <h6>
//     Just started learning HTML? Test your knowledge by answering these 5 common
//     interview questions!
//   </h6>
//   {#each questions as question}
//     <div>
//       <p>{question.question}</p>
//       <div class="answers">
//         <button on:click={() => handleClick(question.answers.answer_a)}>
//           {question.answers.answer_a}
//         </button>
//         <button on:click={() => handleClick(question.answers.answer_b)}>
//           {question.answers.answer_b}
//         </button>
//         <button on:click={() => handleClick(question.answers.answer_c)}>
//           {question.answers.answer_c}
//         </button>
//         <button on:click={() => handleClick(question.answers.answer_d)}>
//           {question.answers.answer_d}
//         </button>
//       </div>
//     </div>
//   {:else}
//     <p>loading...</p>
//   {/each}
// </main> -->
