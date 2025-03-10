import { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigation, NavigationProp } from "@react-navigation/native";

type RootStackParamList = {
  Home: undefined;
  quiz: { quizID: string };
};

export default function TakeTestScreen() {
  const [tests, setTests] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        const testsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name as string,
        }));
        setTests(testsData);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const memoizedTests = useMemo(() => tests, [tests]);

  const handleStartTest = useCallback(
    (quizID: string) => {
      navigation.navigate("quiz", { quizID });
    },
    [navigation]
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Prelim Tests
      </ThemedText>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : memoizedTests.length > 0 ? (
        <FlatList
          data={memoizedTests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.testCard}>
              <ThemedText type="defaultSemiBold" style={styles.testTitle}>
                {item.name}
              </ThemedText>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartTest(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedText style={styles.noTests}>No tests available.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f6f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  listContainer: {
    paddingBottom: 20,
  },
  testCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testTitle: {
    fontSize: 18,
    color: "#333",
  },
  startButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    marginTop: 50,
    alignSelf: "center",
  },
  noTests: {
    textAlign: "center",
    fontSize: 18,
    color: "#777",
    marginTop: 50,
  },
});
