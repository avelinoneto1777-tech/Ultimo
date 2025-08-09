// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";

// Sua configuração de app web do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAh1UHya83-uANm6RYmOt-Fk885WIJTe0U",
  authDomain: "agendamento-de-ambientes.firebaseapp.com",
  projectId: "agendamento-de-ambientes",
  storageBucket: "agendamento-de-ambientes.firebasestorage.app",
  messagingSenderId: "436747247500",
  appId: "1:436747247500:web:d9438aab4b29c3d8f900a9",
};

// Inicializa o Firebase e exporta a variável 'app'
export const app = initializeApp(firebaseConfig);
