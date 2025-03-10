import { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "../config/firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  quizID: string;
}

export default function QuizScreen() {
  const { quizID } = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string;
  }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const memoizedQuizID = useMemo(() => quizID, [quizID]);

  useEffect(() => {
    if (!memoizedQuizID) return;

    const quizRef = doc(db, "quizzes", `${memoizedQuizID}`);

    const q = query(
      collection(db, "questions"),
      where("quizID", "==", quizRef)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const questionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Question[];

        setQuestions(questionsData);
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setError("Failed to fetch questions. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuizID]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const handleOptionSelect = useCallback(
    (questionId: string, option: string) => {
      if (quizSubmitted) return; // Prevent selection after submission

      setSelectedOptions((prev) => ({
        ...prev,
        [questionId]: prev[questionId] === option ? "" : option,
      }));
    },
    [quizSubmitted]
  );

  const handleSubmitQuiz = useCallback(() => {
    setQuizSubmitted(true);
  }, []);

  const renderQuestionItem = useCallback(
    ({ item }: { item: Question }) => {
      const isCorrect =
        quizSubmitted && selectedOptions[item.id] === item.correctAnswer;
      const isIncorrect =
        quizSubmitted &&
        selectedOptions[item.id] !== "" &&
        selectedOptions[item.id] !== item.correctAnswer;

      return (
        <View
          style={[
            styles.card,
            isCorrect && styles.correctQuestionCard,
            isIncorrect && styles.incorrectQuestionCard,
          ]}
        >
          <ThemedText style={styles.question}>{item.question}</ThemedText>
          {item.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionButton,
                selectedOptions[item.id] === option &&
                  styles.selectedOptionButton,
              ]}
              onPress={() => handleOptionSelect(item.id, option)}
            >
              <ThemedText style={styles.optionText}>{option}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      );
    },
    [selectedOptions, quizSubmitted, handleOptionSelect]
  );

  const memoizedQuestions = useMemo(() => questions, [questions]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <ThemedText style={styles.loadingText}>Loading questions...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.error}>{error}</ThemedText>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={memoizedQuestions}
        renderItem={renderQuestionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10} // Adjust based on your needs
        maxToRenderPerBatch={10} // Adjust based on your needs
        windowSize={5} // Adjust based on your needs
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmitQuiz}>
        <ThemedText style={styles.submitText}>Submit Quiz</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
    marginBottom: 15,
  },
  correctQuestionCard: {
    backgroundColor: "#d4edda", // Light green for correct answers
  },
  incorrectQuestionCard: {
    backgroundColor: "#f8d7da", // Light red for incorrect answers
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  selectedOptionButton: {
    backgroundColor: "#ffa500",
  },
  optionText: {
    color: "white",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#ff4d4d",
    padding: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007bff",
  },
});
