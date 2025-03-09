import { db } from "../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import fs from "fs";

// Load questions from JSON file
const questions = JSON.parse(fs.readFileSync("questions.json", "utf-8"));

// Function to add questions to Firestore
async function addQuestions() {
  try {
    for (const question of questions) {
      const docRef = await addDoc(collection(db, "questions"), question);
      console.log("Document written with ID: ", docRef.id);
    }
    console.log("All questions added successfully!");
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

// Run the function
addQuestions();